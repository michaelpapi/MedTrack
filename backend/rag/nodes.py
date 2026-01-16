import re
import os
import traceback
import asyncio
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, List, Any, Callable
from langchain_core.messages import AIMessage, AIMessageChunk
from rag.utils import tavily_fetch
from dotenv import load_dotenv

load_dotenv()

# -------------------------
# Logging setup
# -------------------------
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# -------------------------
# TypedDict for state
# -------------------------
class RouterState(TypedDict):
    query: str
    selected_domain: Optional[str]
    retrieved_docs: Optional[List[Any]]
    reasoned_answer: Optional[str]
    tavily_results: Optional[str]
    sources: Optional[List[str]]
    ws_send: Optional[Callable[[dict], asyncio.Future]]
    stream_callback: Optional[Callable[[str], asyncio.Future]]

# -------------------------
# Initialize LLMs
# -------------------------
router_llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.0)
pharmacist_llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)

# -------------------------
# Helper functions
# -------------------------
def safe_preview(text, n=300):
    return text[:n].replace("\n", " ") + ("..." if len(text) > n else "")

def strip_think(text: str) -> str:
    """Remove <think>...</think> reasoning traces from model output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

# -------------------------
# Router node
# -------------------------
def router_node(state: RouterState) -> RouterState:
    query = state["query"].lower().strip()
    prompt = f"""
    You are a domain routing assistant for a pharmacist support system.
    Do NOT include <think> or hidden reasoning. 
    Respond ONLY with the final answer. No explanations.

    Analyze the user's query and classify it into EXACTLY ONE of the following domains:

    1️ medical_faqs → General questions about symptoms, usage, or patient experiences.
    2️ drug_dosages → Questions about drug strength, dosing, frequency, age-based doses, or mg amounts.
    3️ drug_interactions → Questions about combining drugs or foods, or avoiding dangerous mixes.

    Respond ONLY with one of the following:
    - medical_faqs
    - drug_dosages
    - drug_interactions
    
    Query: "{query}"
    """

    response = router_llm.invoke(prompt)
    domain = response.content.strip().lower()

    # Ensure domain is valid
    valid_domains = ["medical_faqs", "drug_dosages", "drug_interactions"]
    if domain not in valid_domains:
        if any(word in query for word in ["interaction", "interact", "combine", "together", "contraindication"]):
            domain = "drug_interactions"
        elif any(word in query for word in ["dose", "dosage", "mg", "tablet", "strength", "take", "daily", "twice"]):
            domain = "drug_dosages"
        else:
            domain = "medical_faqs"

    logger.info(f"Routed query to domain: {domain}")
    state["selected_domain"] = domain
    return state

# -------------------------
# Retriever node
# -------------------------
def retriever_node(state: RouterState, app=None) -> RouterState:
    domain = state["selected_domain"]
    query = state["query"]

    retrievers = getattr(app.state, "retrievers", None)
    if retrievers is None:
        from backend.rag.ingestion import initialize_vectorstores
        logger.warning("Retriever cache not found, initializing fallback...")
        retrievers = initialize_vectorstores()

    retriever = retrievers.get(domain, None)
    if not retriever:
        logger.warning(f"No retriever found for domain '{domain}', defaulting to medical_faqs.")
        retriever = retrievers["medical_faqs"]

    docs = retriever.invoke(query)
    logger.info(f"Retrieved {len(docs)} docs from domain: {domain}")
    state["retrieved_docs"] = docs
    return state

# -------------------------
# Tavily fetch wrapper
# -------------------------
async def _run_tavily_fetch(query: str, max_results: int = 3, cache_bust: bool = False):
    return await asyncio.to_thread(tavily_fetch, query, max_results, True)

# -------------------------
# LLM streaming and fallback
# -------------------------
async def _invoke_llm_stream(full_prompt: str):
    logger.debug("[STREAM] _invoke_llm_stream STARTED")
    logger.debug("Prompt length: %d", len(full_prompt))

    if not hasattr(pharmacist_llm, "astream_events"):
        logger.error("pharmacist_llm.astream_events DOES NOT EXIST")
        raise AttributeError("pharmacist_llm.astream_events is not available")

    try:
        async for event in pharmacist_llm.astream_events(full_prompt):
            evt = event.get("event")
            data = event.get("data", {})

            if evt == "on_chat_model_stream":

                chunk = data.get("chunk")

                #  FIX: Gemini returns AIMessageChunk, not dicts
                if isinstance(chunk, AIMessageChunk):
                    content = chunk.content or ""

                else:
                    # OpenAI-style dict fallback
                    delta = chunk.get("delta", {}) if isinstance(chunk, dict) else {}
                    content = delta.get("content", "")

                if content:
                    yield content

    except Exception as e:
        logger.error("[STREAM ERROR]", exc_info=e)
        raise


async def _invoke_llm_fallback(full_prompt: str):
    logger.debug("[FALLBACK] _invoke_llm_fallback running")
    try:
        resp = await asyncio.to_thread(pharmacist_llm.invoke, full_prompt)
        logger.debug("[FALLBACK RESULT TYPE] %s", type(resp))
    except Exception as e:
        logger.error("[FALLBACK ERROR]", exc_info=e)
        raise

    if isinstance(resp, AIMessage):
        logger.debug("[FALLBACK CONTENT] extracted from AIMessage")
        return resp.content

    logger.debug("[FALLBACK RAW RETURN]")
    return str(resp)

# -------------------------
# Reasoning node
# -------------------------
async def reasoning_node(state: RouterState) -> RouterState:
    logger.debug("[REASONING] Entered reasoning_node")
    query = state["query"]
    domain = state.get("selected_domain", "unknown")
    retrieved_docs = state.get("retrieved_docs") or []
    logger.info("Running reasoning for query: '%s' in domain: %s", query, domain)

    domain_context = "\n\n".join([doc.page_content for doc in retrieved_docs]) if retrieved_docs else "No domain context retrieved."

    # Tavily search
    try:
        tavily_results = await _run_tavily_fetch(query, max_results=3, cache_bust=True)
        logger.info("Tavily returned %d results", len(tavily_results))
    except Exception as e:
        logger.error("Tavily ERROR", exc_info=e)
        tavily_results = []

    snippets, urls = [], set()
    for r in tavily_results:
        title = (r.get("title") or "").strip()
        url = (r.get("url") or "").strip()
        content = (r.get("content") or "").strip()
        if url:
            urls.add(url)
        snippets.append(f"📌 {title or 'N/A'}\n🔗 {url or 'N/A'}\n{content[:1000]}")

    tavily_block = "\n\n---\n\n".join(snippets) if snippets else "No live web results found."
    logger.debug("Tavily fetched %d results. Preview: %s", len(snippets), safe_preview(tavily_block))

    combined_content = f"""
    [DOMAIN KNOWLEDGE: {domain}]
    {domain_context}

    [RECENT WEB FINDINGS]
    {tavily_block}
    """

    prompt = f"""
    You are a professional clinical pharmacist providing clear, concise, and patient-safe medical information.
    Question:
    {query}
    """

    full_prompt = f"{prompt}\n\n{combined_content}"

    ws_send: Optional[Callable[[dict], asyncio.Future]] = state.get("ws_send")
    stream_cb: Optional[Callable[[str], asyncio.Future]] = state.get("stream_callback")

    accumulated = []
    streamed = False
    try:
        async for chunk in _invoke_llm_stream(full_prompt):
            logger.debug("Got stream chunk: %s", repr(chunk))
            accumulated.append(chunk)
            if stream_cb:
                try:
                    await stream_cb(chunk)
                except Exception as e:
                    logger.warning("stream_callback error: %s", e)
            if ws_send:
                try:
                    await ws_send({"type": "stream", "chunk": chunk})
                except Exception as e:
                    logger.error("STREAMING CRASH", exc_info=e)
                    final_text = await _invoke_llm_fallback(full_prompt)
            streamed = True

        final_text = "".join(accumulated).strip()
    except AttributeError:
        final_text = await _invoke_llm_fallback(full_prompt)
    except Exception as e:
        logger.error("Streaming error, falling back", exc_info=e)
        final_text = await _invoke_llm_fallback(full_prompt)

    if "**Sources:**" in final_text:
        final_text = final_text.split("**Sources:**")[0].strip()

    logger.info("Streaming finished. Accumulated chunks: %d", len(accumulated))
    logger.info("Final text length: %d", len(final_text))
    logger.debug("Final response preview: %s", safe_preview(final_text))

    state.update({
        "reasoned_answer": final_text,
        "tavily_results": tavily_block,
        "sources": list(urls)
    })

    if ws_send:
        try:
            await ws_send({"type": "stream_end", "final": final_text})
        except Exception as e:
            logger.warning("ws_send final message error: %s", e)

    return state
