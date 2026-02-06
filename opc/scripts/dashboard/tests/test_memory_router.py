"""Tests for memory router endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


def create_mock_pool_and_conn():
    """Create properly configured mock pool and connection."""
    mock_conn = MagicMock()
    mock_conn.fetch = AsyncMock()
    mock_conn.fetchval = AsyncMock()
    mock_conn.fetchrow = AsyncMock()

    mock_acquire_ctx = MagicMock()
    mock_acquire_ctx.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_acquire_ctx.__aexit__ = AsyncMock(return_value=None)

    mock_pool = MagicMock()
    mock_pool.acquire.return_value = mock_acquire_ctx

    return mock_pool, mock_conn


@pytest.fixture
def mock_pool_and_conn():
    """Create a mock database pool and connection."""
    return create_mock_pool_and_conn()


class TestLearningsListEndpoint:
    """Tests for GET /api/pillars/memory/learnings endpoint."""

    def test_learnings_list_returns_paginated_results(self, mock_pool_and_conn):
        """Learnings endpoint returns paginated list."""
        mock_pool, mock_conn = mock_pool_and_conn
        learning_id = str(uuid4())

        mock_conn.fetch.return_value = [
            {
                "id": learning_id,
                "content": "Test learning content",
                "session_id": "test-session",
                "agent_id": None,
                "project_id": None,
                "metadata": '{"type": "WORKING_SOLUTION", "context": "testing"}',
                "scope": "PROJECT",
                "created_at": datetime(2025, 1, 15, 10, 30, 0),
            }
        ]
        mock_conn.fetchval.return_value = 1

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get("/api/pillars/memory/learnings")

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["id"] == learning_id
        assert data["items"][0]["content"] == "Test learning content"

    def test_learnings_list_respects_pagination(self, mock_pool_and_conn):
        """Learnings endpoint respects skip and limit parameters."""
        mock_pool, mock_conn = mock_pool_and_conn
        mock_conn.fetch.return_value = []
        mock_conn.fetchval.return_value = 100

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get("/api/pillars/memory/learnings?skip=10&limit=5")

        assert response.status_code == 200
        data = response.json()
        assert data["skip"] == 10
        assert data["limit"] == 5
        assert data["total"] == 100

    def test_learnings_list_filters_by_search(self, mock_pool_and_conn):
        """Learnings endpoint filters by search query."""
        mock_pool, mock_conn = mock_pool_and_conn
        mock_conn.fetch.return_value = []
        mock_conn.fetchval.return_value = 0

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get("/api/pillars/memory/learnings?search=hook")

        assert response.status_code == 200
        fetchval_call = mock_conn.fetchval.call_args
        assert fetchval_call is not None
        query = fetchval_call[0][0]
        assert "to_tsvector" in query

    def test_learnings_list_filters_by_type(self, mock_pool_and_conn):
        """Learnings endpoint filters by learning type."""
        mock_pool, mock_conn = mock_pool_and_conn
        mock_conn.fetch.return_value = []
        mock_conn.fetchval.return_value = 0

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get("/api/pillars/memory/learnings?type_filter=WORKING_SOLUTION")

        assert response.status_code == 200
        fetchval_call = mock_conn.fetchval.call_args
        assert fetchval_call is not None
        query = fetchval_call[0][0]
        assert "metadata" in query


class TestLearningDetailEndpoint:
    """Tests for GET /api/pillars/memory/learnings/{id} endpoint."""

    def test_learning_detail_returns_single_learning(self, mock_pool_and_conn):
        """Learning detail endpoint returns single learning by ID."""
        mock_pool, mock_conn = mock_pool_and_conn
        learning_id = str(uuid4())

        mock_conn.fetchrow.return_value = {
            "id": learning_id,
            "content": "Detailed learning content",
            "session_id": "test-session",
            "agent_id": "kraken",
            "project_id": "proj-123",
            "scope": "GLOBAL",
            "metadata": '{"type": "ARCHITECTURAL_DECISION", "context": "system design"}',
            "created_at": datetime(2025, 1, 15, 10, 30, 0),
        }

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get(f"/api/pillars/memory/learnings/{learning_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == learning_id
        assert data["content"] == "Detailed learning content"
        assert data["scope"] == "GLOBAL"
        assert data["agent_id"] == "kraken"

    def test_learning_detail_returns_404_when_not_found(self, mock_pool_and_conn):
        """Learning detail endpoint returns 404 for non-existent ID."""
        mock_pool, mock_conn = mock_pool_and_conn
        learning_id = str(uuid4())
        mock_conn.fetchrow.return_value = None

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get(f"/api/pillars/memory/learnings/{learning_id}")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_learning_detail_returns_400_for_invalid_uuid(self):
        """Learning detail endpoint returns 400 for invalid UUID."""
        mock_pool, mock_conn = create_mock_pool_and_conn()

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.memory.get_pool", mock_get_pool):
            with patch("dashboard.main.get_pool", new_callable=AsyncMock):
                with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                    from dashboard.main import app
                    with TestClient(app) as client:
                        response = client.get("/api/pillars/memory/learnings/not-a-valid-uuid")

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
