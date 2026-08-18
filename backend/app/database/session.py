from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# In production, Supabase PostgreSQL uses SSL connection.
# For local dev, we default to local PG, but handle pool connection setup here.
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    # Fallback to local SQLite database if local PostgreSQL is not running
    engine = create_engine(
        "sqlite:///./sanket_local.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
