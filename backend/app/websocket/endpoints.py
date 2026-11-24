from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.manager import manager
import logging

logger = logging.getLogger("salonflow.ws_route")
router = APIRouter()

@router.websocket("/ws/queue")
async def websocket_queue_endpoint(websocket: WebSocket):
    """Real-time live queue channel for Customer, Reception, Barber, and TV Display."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket connection closed: {e}")
        manager.disconnect(websocket)
