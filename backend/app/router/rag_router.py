from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
import json
import traceback
import asyncio
from app.security import get_current_user_from_token

router = APIRouter(prefix="/rag", tags=["RAG"])

@router.websocket("/ws/ask")
async def websocket_ask(websocket: WebSocket):
    """
    Websocket endpoint for live reasoing responses
    """

    await websocket.accept()

    # Extract token from query parameters
    token = websocket.cookies.get("access_token")
    if not token:
        print("No access token cookie found")
        await websocket.close(code=1008)
        return
    
    try:
        user = get_current_user_from_token(token)
    except Exception:
        await websocket.send_json({"type": "error", "message": "Invalid token"})
        await websocket.close(code=1008)
        return
    
    # once user is valid, proceed
    print(" Client connected to {user.email}")

    app = websocket.app
    graph = app.state.graph

    try:
        while True:
            message = await websocket.receive_text()
            print(" [WS] Received raw websocket message:", message)
            data = json.loads(message)
            query = data.get("query", "").strip()

            if not query:
                await websocket.send_json({"type": "error", "message": "Empty query"})
                continue

            print(f" Received query: {query}")


            # initialize graph state
            state = {
                "query": query,
                "selected_domain": None,
                "retrieved_docs": None,
                "reasoned_answer": None,
                "sources": [],
                "ws_send": websocket.send_json,
            }

            # running graph reasoning
            try:
                print(" [WS] Invoking graph with state...")
                final_state = await graph.ainvoke(state)
                print(" [WS] Graph returned successfully")
            except Exception as e:
                print(" [WS] Graph ERROR:", e)
                await websocket.send_json({"type": "error", "message": "Internal error"})
                continue


            await websocket.send_json({
                "type": "final",
                "answer": final_state.get("reasoned_answer"),
                "sources": final_state.get("sources", []),
            })

    except WebSocketDisconnect:
        print(" WebSocket disconnected")
    except Exception as e:
        print(f" Unexpected error: {e}")
        await websocket.close(code=1011)