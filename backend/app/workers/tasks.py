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

        steps = 5

        for i in range(steps):
            time.sleep(1)

            # update progress
            doc.progress = int(((i + 1) / steps) * 100)
            doc.status = "processing"

            db.commit()
            db.refresh(doc)   

            print(f"Step {i+1}/5 completed")

        # final update
        doc.status = "completed"
        doc.progress = 100
        db.commit()

        return {"status": "completed", "document_id": document_id}

    finally:
        db.close()   
