import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.init_db import init_db

@pytest.fixture(scope="session")
def client():
    # Ensure tables and seed data are ready
    init_db()
    with TestClient(app) as c:
        yield c
