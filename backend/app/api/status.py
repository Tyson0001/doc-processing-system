from fastapi import APIRouter
from app.core.database import SessionLocal
from app.models.document import Document

router = APIRouter()

@router.get("/status/{doc_id}")
def get_status(doc_id: int):
    db = SessionLocal()

    doc = db.query(Document).filter(Document.id == doc_id).first()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "progress": doc.progress
    }