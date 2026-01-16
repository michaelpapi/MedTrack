import asyncio
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from contextlib import asynccontextmanager
from app.models import Base

from app.database import SessionLocal, engine
from app.router import product_router, auth_router, dispense_router, notifications_router, audit_router, analytics_router, rag_router
from rag.ingestion import initialize_vectorstores
from rag.graph import build_medtrack_graph


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database tables are created on startup."""
    Base.metadata.create_all(bind=engine)

    task = asyncio.create_task(notifications_router.redis_listener())
    print(" Redis listener started in lifespan")

    app.state.retrievers = initialize_vectorstores()
    app.state.graph = build_medtrack_graph(app)
    print(" Vectorstores + MedTrack Graph loaded and ready")

    try:
        yield
    finally:

        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print (" Redis listener stopped")


app = FastAPI(title="Drug Inventory API", lifespan=lifespan)


origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://frontend",
    "http://frontend:80",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # or ["*"] for all origins (for testing)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# include routers
app.include_router(product_router.router)
app.include_router(auth_router.router)
app.include_router(dispense_router.router)
app.include_router(notifications_router.router)
app.include_router(audit_router.router)
app.include_router(analytics_router.router)
app.include_router(rag_router.router)

# include middleware to allow frontend connectivity


@app.get("/")
def root():
    return {"message": "Welcome to MES Analytics API"}



