from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import time
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/documents_db"
)


if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")

# Retry logic 
for i in range(10):
    try:
        engine = create_engine(DATABASE_URL)
        connection = engine.connect()
        connection.close()
        break
    except Exception as e:
        print("Database not ready, retrying...")
        time.sleep(2)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
