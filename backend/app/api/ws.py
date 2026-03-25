from fastapi import APIRouter, WebSocket
from app.core.database import SessionLocal
from app.models.document import Document
import asyncio

router = APIRouter()

@router.websocket("/ws/{doc_id}")
async def websocket_endpoint(websocket: WebSocket, doc_id: int):
    await websocket.accept()

    last_progress = -1

    try:
        while True:
            # 🔥 NEW DB session every time
            db = SessionLocal()

            doc = db.query(Document).filter(Document.id == doc_id).first()

            if doc:
                if doc.progress != last_progress:
                    await websocket.send_json({
                        "status": doc.status,
                        "progress": doc.progress
                    })
                    last_progress = doc.progress

                if doc.status == "completed":
                    break

            db.close()   # 🔥 close every loop

            await asyncio.sleep(1)

    except Exception as e:
        print("WebSocket error:", e)

    finally:
        await websocket.close()