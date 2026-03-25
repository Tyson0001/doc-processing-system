from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api.document import router as document_router
from app.api.status import router as status_router
from app.api.ws import router as ws_router

app = FastAPI()

# 🔥 CORS FIX (CRITICAL)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(document_router)
app.include_router(status_router)
app.include_router(ws_router)