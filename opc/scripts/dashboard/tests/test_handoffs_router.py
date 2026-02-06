"""Tests for handoffs drill-down router."""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


class TestHandoffsRouter:
    """Test handoffs drill-down router endpoints."""

    @pytest.fixture
    def client(self):
        """Create test client with mocked database."""
        from dashboard.main import app
        return TestClient(app)

    @pytest.fixture
    def mock_db_handoffs(self):
        """Sample handoff records from database."""
        return [
            {
                "id": uuid4(),
                "session_name": "session-001",
                "file_path": "/path/to/handoff1.yaml",
                "goal": "Implement feature X",
                "outcome": "SUCCEEDED",
                "created_at": datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
            },
            {
                "id": uuid4(),
                "session_name": "session-002",
                "file_path": "/path/to/handoff2.yaml",
                "goal": "Fix bug Y",
                "outcome": "PARTIAL_PLUS",
                "created_at": datetime(2025, 1, 14, 9, 0, 0, tzinfo=timezone.utc),
            },
        ]

    @pytest.fixture
    def mock_full_handoff(self):
        """Sample full handoff record with all fields for detail endpoint."""
        return {
            "id": uuid4(),
            "session_name": "session-001",
            "file_path": "/path/to/handoff1.yaml",
            "format": "yaml",
            "session_id": "abc123",
            "agent_id": "agent-001",
            "root_span_id": "span-001",
            "jsonl_path": "/path/to/session.jsonl",
            "goal": "Implement feature X",
            "what_worked": "TDD approach",
            "what_failed": None,
            "key_decisions": "Use FastAPI",
            "outcome": "SUCCEEDED",
            "outcome_notes": "All tests pass",
            "content": "Full handoff content here",
            "created_at": datetime(2025, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        }

    def _create_mock_pool(self, mock_conn):
        """Create a properly mocked async pool."""
        mock_pool = MagicMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_context.__aexit__ = AsyncMock(return_value=None)
        mock_pool.acquire.return_value = mock_context
        return mock_pool

    @pytest.mark.asyncio
    async def test_list_handoffs_returns_combined_results(self, client, mock_db_handoffs):
        """GET /api/pillars/handoffs returns handoffs from DB and files."""
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=mock_db_handoffs)
        mock_conn.fetchval = AsyncMock(return_value=2)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get("/api/pillars/handoffs")

        assert response.status_code == 200
        data = response.json()
        assert "handoffs" in data
        assert "total" in data
        assert isinstance(data["handoffs"], list)

    @pytest.mark.asyncio
    async def test_list_handoffs_with_pagination(self, client):
        """GET /api/pillars/handoffs supports skip and limit params."""
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=[])
        mock_conn.fetchval = AsyncMock(return_value=0)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get("/api/pillars/handoffs?skip=10&limit=5")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_list_handoffs_with_status_filter(self, client, mock_db_handoffs):
        """GET /api/pillars/handoffs filters by status."""
        filtered = [h for h in mock_db_handoffs if h["outcome"] == "SUCCEEDED"]

        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=filtered)
        mock_conn.fetchval = AsyncMock(return_value=1)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get("/api/pillars/handoffs?status_filter=SUCCEEDED")

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_get_handoff_by_id(self, client, mock_full_handoff):
        """GET /api/pillars/handoffs/{id} returns single handoff."""
        handoff_id = str(mock_full_handoff["id"])

        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=mock_full_handoff)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get(f"/api/pillars/handoffs/{handoff_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == handoff_id

    @pytest.mark.asyncio
    async def test_get_handoff_not_found(self, client):
        """GET /api/pillars/handoffs/{id} returns 404 for unknown ID."""
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get(f"/api/pillars/handoffs/{uuid4()}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_handoff_response_includes_source(self, client, mock_db_handoffs):
        """Each handoff in response includes source field (db or file)."""
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(return_value=mock_db_handoffs)
        mock_conn.fetchval = AsyncMock(return_value=2)

        mock_pool = self._create_mock_pool(mock_conn)

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.routers.handoffs.get_pool", mock_get_pool):
            response = client.get("/api/pillars/handoffs")

        assert response.status_code == 200
        data = response.json()
        for handoff in data["handoffs"]:
            assert "source" in handoff
            assert handoff["source"] in ("db", "file")

    @pytest.mark.asyncio
    async def test_get_handoff_invalid_id_format(self, client):
        """GET /api/pillars/handoffs/{id} returns 400 for invalid UUID."""
        response = client.get("/api/pillars/handoffs/not-a-valid-uuid")
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_get_file_handoff(self, client, tmp_path):
        """GET /api/pillars/handoffs/file:name returns file-based handoff."""
        handoff_content = "# Test Handoff\n\nThis is a test."

        with patch("dashboard.routers.handoffs.PROJECT_ROOT", tmp_path):
            claude_dir = tmp_path / ".claude"
            claude_dir.mkdir()
            handoff_file = claude_dir / "HANDOFF-test.md"
            handoff_file.write_text(handoff_content)

            response = client.get("/api/pillars/handoffs/file:HANDOFF-test.md")

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "file"
        assert data["content"] == handoff_content
