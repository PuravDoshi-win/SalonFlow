
import os
import socket
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("salonflow.database")


def is_postgres_alive(host="127.0.0.1", port=5432) -> bool:
    """Check whether local PostgreSQL is available."""

    if os.getenv("TESTING") == "1":
        return False

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0

    except Exception:
        return False


def normalize_database_url(url: str) -> str:
    """Normalize PostgreSQL URLs for SQLAlchemy with psycopg2."""

    if url.startswith("postgres://"):
        return url.replace(
            "postgres://",
            "postgresql+psycopg2://",
            1
        )

    if url.startswith("postgresql://"):
        return url.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1
        )

    return url


def init_engine():
    """Initialize the appropriate database engine."""

    pg_url = settings.DATABASE_URL

    # PRODUCTION: Always use hosted PostgreSQL.
    if settings.APP_ENV.lower() == "production":

        pg_url = normalize_database_url(pg_url)

        if not pg_url.startswith("postgresql+psycopg2://"):
            raise RuntimeError(
                "Production requires a valid PostgreSQL DATABASE_URL."
            )

        logger.info("Connecting to production PostgreSQL database...")

        eng = create_engine(
            pg_url,
            pool_pre_ping=True,
            pool_recycle=300
        )

        try:
            with eng.connect():
                logger.info(
                    "Successfully connected to production PostgreSQL."
                )

            return eng

        except Exception:
            eng.dispose()

            logger.exception(
                "Failed to connect to production PostgreSQL."
            )

            raise

    # LOCAL DEVELOPMENT: Try local PostgreSQL first.
    if "postgresql" in pg_url and is_postgres_alive():

        try:
            eng = create_engine(
                normalize_database_url(pg_url),
                pool_pre_ping=True
            )

            with eng.connect():
                logger.info(
                    "Successfully connected to local PostgreSQL."
                )

            return eng

        except Exception as e:
            logger.warning(
                "Local PostgreSQL connection failed: %s",
                e
            )

    # LOCAL DEVELOPMENT: Fall back to SQLite.
    sqlite_url = settings.SQLITE_FALLBACK_URL

    logger.info("Using SQLite database: %s", sqlite_url)

    return create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )


# Initialize database engine.
engine = init_engine()

# Create database session factory.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# SQLAlchemy declarative base.
Base = declarative_base()


def get_db():
    """Provide a database session to FastAPI endpoints."""

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()
