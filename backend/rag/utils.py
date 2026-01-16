from langchain_tavily import TavilySearch
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv


load_dotenv()


# Tavily Search helper function 
tavily = TavilySearch(
    max_results=3,         # tune as you like
    search_depth="advanced"  # "basic" or "advanced"
)

def tavily_fetch(query: str, max_results: int = 3, cache_bust: bool = False) -> List[Dict[str, str]]:
    """
    Fetch raw results from Tavily and normalize them to a list of dicts with keys:
      {"title":..., "url":..., "content":...}
    Returns an empty list on error.
    """
    if not query:
        return []

    if cache_bust:
        # append a tiny unique token so Tavily treats request as new:
        query = f"{query} [cb:{datetime.now().timestamp()}]"

    try:
        raw = tavily.invoke(query)
    except Exception as e:
        # don't raise here — return empty list and let caller handle it
        print(f"[tavily_fetch] Tavily invocation error: {e}")
        return []

    # normalize various shapes returned by Tavily
    if isinstance(raw, dict) and "results" in raw:
        items = raw["results"]
    elif isinstance(raw, list):
        items = raw
    else:
        items = [raw]

    normalized = []
    seen_urls = set()
    for r in items[:max_results]:
        if isinstance(r, dict):
            title = r.get("title", "") or r.get("headline", "")
            url = r.get("url", "") or r.get("link", "")
            content = r.get("content", "") or r.get("snippet", "") or r.get("summary", "")
        else:
            title, url, content = "", "", str(r)

        url = url.strip()
        if url and url in seen_urls:
            continue # skipping duplication
        seen_urls.add(url)
        normalized.append({"title": title.strip(), "url": url.strip(), "content": content.strip()})
    return normalized