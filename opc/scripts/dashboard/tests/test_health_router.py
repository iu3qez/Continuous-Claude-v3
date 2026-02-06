"""Tests for health router endpoints."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dashboard.models import PillarHealth, PillarStatus


@pytest.fixture
def mock_memory_service():
    """Create a mock memory service that patches the module-level instance."""
    mock_service = AsyncMock()
    with patch("dashboard.routers.health.memory_service", mock_service):
        yield mock_service


@pytest.fixture
def mock_knowledge_service():
    """Create a mock knowledge service."""
    mock_service = AsyncMock()
    with patch("dashboard.routers.health.knowledge_service", mock_service):
        yield mock_service


@pytest.fixture
def mock_pageindex_service():
    """Create a mock pageindex service."""
    mock_service = AsyncMock()
    with patch("dashboard.routers.health.pageindex_service", mock_service):
        yield mock_service


@pytest.fixture
def mock_roadmap_service():
    """Create a mock roadmap service."""
    mock_service = AsyncMock()
    with patch("dashboard.routers.health.roadmap_service", mock_service):
        yield mock_service


@pytest.fixture
def mock_handoffs_service():
    """Create a mock handoffs service."""
    mock_service = AsyncMock()
    with patch("dashboard.routers.health.handoffs_service", mock_service):
        yield mock_service


@pytest.fixture
def mock_all_services(mock_memory_service, mock_knowledge_service, mock_pageindex_service, mock_roadmap_service, mock_handoffs_service):
    """Bundle all mock services together."""
    services = {
        "memory": mock_memory_service,
        "knowledge": mock_knowledge_service,
        "pageindex": mock_pageindex_service,
        "roadmap": mock_roadmap_service,
        "handoffs": mock_handoffs_service,
    }
    with patch("dashboard.routers.health.PILLAR_SERVICES", services):
        yield services


@pytest.fixture
def client(mock_all_services):
    """Create test client with mocked services."""
    with patch("dashboard.main.get_pool", new_callable=AsyncMock):
        with patch("dashboard.main.close_pool", new_callable=AsyncMock):
            from dashboard.main import app
            with TestClient(app) as c:
                yield c


class TestHealthEndpoint:
    """Tests for GET /api/health endpoint."""

    def test_health_returns_all_five_pillars(self, client, mock_all_services):
        """Health endpoint returns all 5 pillar statuses."""
        mock_all_services["memory"].check_health.return_value = PillarHealth(
            name="memory",
            status=PillarStatus.ONLINE,
            count=42,
            last_activity=datetime(2025, 1, 1, 12, 0, 0),
        )
        mock_all_services["knowledge"].check_health.return_value = PillarHealth(
            name="knowledge",
            status=PillarStatus.ONLINE,
            count=15,
            last_activity=datetime(2025, 1, 2, 10, 0, 0),
        )
        mock_all_services["pageindex"].check_health.return_value = PillarHealth(
            name="pageindex",
            status=PillarStatus.ONLINE,
            count=100,
            last_activity=datetime(2025, 1, 3, 8, 0, 0),
        )
        mock_all_services["roadmap"].check_health.return_value = PillarHealth(
            name="roadmap",
            status=PillarStatus.ONLINE,
            count=5,
            last_activity=datetime(2025, 1, 4, 14, 0, 0),
        )
        mock_all_services["handoffs"].check_health.return_value = PillarHealth(
            name="handoffs",
            status=PillarStatus.ONLINE,
            count=3,
            last_activity=datetime(2025, 1, 5, 16, 0, 0),
        )

        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert "pillars" in data
        assert len(data["pillars"]) == 5
        assert "memory" in data["pillars"]
        assert "knowledge" in data["pillars"]
        assert "pageindex" in data["pillars"]
        assert "roadmap" in data["pillars"]
        assert "handoffs" in data["pillars"]
        assert data["pillars"]["memory"]["status"] == "online"
        assert data["pillars"]["memory"]["count"] == 42
        assert data["pillars"]["knowledge"]["count"] == 15
        assert data["pillars"]["pageindex"]["count"] == 100
        assert data["pillars"]["roadmap"]["count"] == 5
        assert data["pillars"]["handoffs"]["count"] == 3

    def test_health_returns_offline_on_db_error(self, client, mock_all_services):
        """Health endpoint shows offline status when DB fails."""
        mock_all_services["memory"].check_health.return_value = PillarHealth(
            name="memory",
            status=PillarStatus.OFFLINE,
            count=0,
            error="Connection refused",
        )
        mock_all_services["knowledge"].check_health.return_value = PillarHealth(
            name="knowledge", status=PillarStatus.ONLINE, count=0,
        )
        mock_all_services["pageindex"].check_health.return_value = PillarHealth(
            name="pageindex", status=PillarStatus.ONLINE, count=0,
        )
        mock_all_services["roadmap"].check_health.return_value = PillarHealth(
            name="roadmap", status=PillarStatus.ONLINE, count=0,
        )
        mock_all_services["handoffs"].check_health.return_value = PillarHealth(
            name="handoffs", status=PillarStatus.ONLINE, count=0,
        )

        response = client.get("/api/health")

        assert response.status_code == 200
        data = response.json()
        assert data["pillars"]["memory"]["status"] == "offline"
        assert data["pillars"]["memory"]["error"] == "Connection refused"


class TestHealthPillarEndpoint:
    """Tests for GET /api/health/{pillar} endpoint."""

    def test_health_pillar_memory_returns_details(self, client, mock_all_services):
        """Memory pillar endpoint returns detailed stats."""
        mock_all_services["memory"].check_health.return_value = PillarHealth(
            name="memory",
            status=PillarStatus.ONLINE,
            count=100,
        )
        mock_all_services["memory"].get_details.return_value = {
            "by_type": {"WORKING_SOLUTION": 50, "ERROR_FIX": 30},
            "recent_entries": [{"id": 1, "content": "test", "created_at": "2025-01-01"}],
        }

        response = client.get("/api/health/memory")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "memory"
        assert data["status"] == "online"
        assert "details" in data
        assert "by_type" in data["details"]

    def test_health_pillar_knowledge_returns_details(self, client, mock_all_services):
        """Knowledge pillar endpoint returns detailed stats."""
        mock_all_services["knowledge"].check_health.return_value = PillarHealth(
            name="knowledge",
            status=PillarStatus.ONLINE,
            count=15,
        )
        mock_all_services["knowledge"].get_details.return_value = {
            "tree_depth": 3,
            "recent_pages": [],
        }

        response = client.get("/api/health/knowledge")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "knowledge"
        assert data["status"] == "online"
        assert "details" in data

    def test_health_pillar_pageindex_returns_details(self, client, mock_all_services):
        """PageIndex pillar endpoint returns detailed stats."""
        mock_all_services["pageindex"].check_health.return_value = PillarHealth(
            name="pageindex",
            status=PillarStatus.ONLINE,
            count=100,
        )
        mock_all_services["pageindex"].get_details.return_value = {
            "by_directory": {"src": 50, "tests": 50},
        }

        response = client.get("/api/health/pageindex")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "pageindex"
        assert data["status"] == "online"
        assert "details" in data

    def test_health_pillar_roadmap_returns_details(self, client, mock_all_services):
        """Roadmap pillar endpoint returns detailed stats."""
        mock_all_services["roadmap"].check_health.return_value = PillarHealth(
            name="roadmap",
            status=PillarStatus.ONLINE,
            count=5,
        )
        mock_all_services["roadmap"].get_details.return_value = {
            "by_status": {"done": 2, "in_progress": 3},
        }

        response = client.get("/api/health/roadmap")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "roadmap"
        assert data["status"] == "online"
        assert "details" in data

    def test_health_pillar_handoffs_returns_details(self, client, mock_all_services):
        """Handoffs pillar endpoint returns detailed stats."""
        mock_all_services["handoffs"].check_health.return_value = PillarHealth(
            name="handoffs",
            status=PillarStatus.ONLINE,
            count=3,
        )
        mock_all_services["handoffs"].get_details.return_value = {
            "active": 1,
            "recent": [],
        }

        response = client.get("/api/health/handoffs")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "handoffs"
        assert data["status"] == "online"
        assert "details" in data

    def test_health_pillar_unknown_returns_404(self, client, mock_all_services):
        """Unknown pillar returns 404."""
        response = client.get("/api/health/unknown")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestStaticFiles:
    """Tests for static file serving."""

    def test_root_returns_html(self, client, mock_all_services):
        """Root path returns index.html."""
        for name in ["memory", "knowledge", "pageindex", "roadmap", "handoffs"]:
            mock_all_services[name].check_health.return_value = PillarHealth(
                name=name,
                status=PillarStatus.ONLINE,
                count=0,
            )

        response = client.get("/")

        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "frontend" in response.text
