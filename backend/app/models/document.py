from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)

    status = Column(String, default="uploaded")
    progress = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ FIX: ADD THIS LINE
    result = Column(JSON, nullable=True)