import json
import asyncio
from fastapi import APIRouter,  WebSocket, Depends
from typing import List
from sqlalchemy.orm import Session
from app import schemas, models
from app.database import get_db

from app.redis.dependencies import redis

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Tracking connected clients 
active_connections: List[WebSocket] = []

async def broadcast_message(message: dict):
    """
    Send a message to all connected websocket clients.
    """
    disconnected = []
    for connection in active_connections:
        try:
            await connection.send_json(message)
        except Exception:
            disconnected.append(connection)

    # Clean up any disconnected sockets
    for conn in disconnected:
        active_connections.remove(conn)

async def redis_listener():
    while True:
        try:
            pubsub = redis.pubsub()
            await pubsub.subscribe("low_stock_channel")
            print("Redis listener connected and subscribed.")

            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue

                data = json.loads(message["data"])
                await broadcast_message(data)

        except Exception as e:
            print("Redis listener error:", e)
            print("Retrying in 2 seconds...")
            await asyncio.sleep(2)


@router.websocket("/ws/notifications")
async def low_stock_notifications(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)


    try:
        while True:
            await websocket.receive()
    except:
        active_connections.remove(websocket)


@router.get("/active", response_model=List[schemas.ActiveNotification])
def get_active_notifications(db:Session = Depends(get_db)):
    notifs = db.query(models.LowStockNotification).filter_by(is_active=True).all()
    return [{"message": n.message} for n in notifs]