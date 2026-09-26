import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    asyncio.run(seed_database())


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
