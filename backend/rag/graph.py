from langgraph.graph import StateGraph, END
from rag.nodes import router_node, retriever_node, reasoning_node, RouterState

def build_medtrack_graph(app=None):
    """Builds and compiles the MedTrack RAG workflow graph once."""

    def retriever_with_app(state):
        return retriever_node(state, app)

    graph = StateGraph(RouterState)
    graph.add_node("router", router_node)
    graph.add_node("retriever", retriever_with_app)
    graph.add_node("reasoning", reasoning_node)

    graph.set_entry_point("router")
    graph.add_edge("router", "retriever")
    graph.add_edge("retriever", "reasoning")
    graph.add_edge("reasoning", END)

    return graph.compile()
