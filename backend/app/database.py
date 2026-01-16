"""Database configuration"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

# Base directory of backend
BASE_DIR = Path(__file__).resolve().parent.parent

# Default SQLite path (for local dev if DATABASE_URL not set)
SQLITE_PATH = BASE_DIR / "drugs_data.db"

# Postgres default for Docker environment
POSTGRES_DEFAULT = "postgresql://medtrack_user:wzMvmPBEp9zD4kg_FA_SgtIuNxfJGFTe@medtrack-postgres:5432/medtrack_db"

# Use DATABASE_URL env variable if exists, otherwise use Postgres default
DATABASE_URL = os.getenv("DATABASE_URL", POSTGRES_DEFAULT)

# For local dev, optionally fall back to SQLite if Postgres not reachable
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(f"sqlite:///{SQLITE_PATH}", connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency for FastAPI
def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
