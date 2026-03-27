from fastapi import APIRouter, UploadFile, File
from app.core.database import SessionLocal
from app.models.document import Document
from app.workers.tasks import process_document

router = APIRouter()

# Upload document
@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    db = SessionLocal()

    doc = Document(
        filename=file.filename,
        status="queued",
        progress=0
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    # send to celery
    process_document.delay(doc.id)

    return {"id": doc.id}


# Finalize document
@router.post("/finalize/{document_id}")
def finalize_document(document_id: int):
    db = SessionLocal()

    doc = db.query(Document).filter(Document.id == document_id).first()

    if not doc:
        return {"error": "Document not found"}

    doc.status = "finalized"
    db.commit()

    return {"message": "Document finalized", "id": document_id}