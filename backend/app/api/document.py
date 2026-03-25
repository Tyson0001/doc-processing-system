from fastapi import APIRouter, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.document import Document
from app.workers.tasks import process_document   # NEW

router = APIRouter()

@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    db: Session = SessionLocal()

    doc = Document(
        filename=file.filename,
        status="processing"
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Send async task
    process_document.delay(doc.id)

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status
    }