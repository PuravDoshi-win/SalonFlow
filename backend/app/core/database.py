import os
import socket
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("salonflow.database")

def is_postgres_alive(host="127.0.0.1", port=5432) -> bool:
    """Non-blocking TCP socket test before SQLAlchemy engine initialization."""
    if os.getenv("TESTING") == "1":
        return False
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        res = s.connect_ex((host, port))
        s.close()
        return res == 0
    except Exception:
        return False

def init_engine():
    pg_url = settings.DATABASE_URL
    if "postgresql" in pg_url and is_postgres_alive():
        try:
            eng = create_engine(pg_url, pool_pre_ping=True)
            with eng.connect():
                logger.info("Successfully connected to primary PostgreSQL database.")
                return eng
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")

    # Fallback SQLite engine
    sqlite_url = settings.SQLITE_FALLBACK_URL
    logger.info(f"Using SQLite database engine at {sqlite_url}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI database dependency yields clean scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

