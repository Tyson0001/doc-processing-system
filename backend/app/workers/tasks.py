import time
from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.document import Document


@celery_app.task
def process_document(document_id):
    db = SessionLocal()

    try:
        doc = db.query(Document).filter(Document.id == document_id).first()

        if not doc:
            return {"error": "Document not found"}

        # ✅ FIX 1: Immediately update status
        doc.status = "processing"
        doc.progress = 0
        db.commit()

        steps = 5

        for i in range(steps):
            time.sleep(1)

            # ✅ FIX 2: Update progress properly
            doc.progress = int(((i + 1) / steps) * 100)
            db.commit()

            print(f"Step {i+1}/5 completed")

        # ✅ FINAL UPDATE
        doc.status = "completed"
        doc.progress = 100

        doc.result = {
            "title": doc.filename,
            "category": "general",
            "summary": "Processed successfully",
            "keywords": ["document"]
        }

        db.commit()

        return {"status": "completed", "document_id": document_id}

    finally:
        db.close()