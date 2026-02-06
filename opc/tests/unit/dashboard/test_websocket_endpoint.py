"""Tests for WebSocket endpoint in dashboard main.py."""
from __future__ import annotations

import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

opc_scripts = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts")
sys.path.insert(0, opc_scripts)


class TestWebSocketEndpoint:
    """Tests for WebSocket endpoint at /ws."""

    @pytest.fixture
    def client(self):
        """Create test client with mocked database pool."""
        with patch("dashboard.main.get_pool", new_callable=AsyncMock):
            with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                from dashboard.main import app
                yield TestClient(app)

    def test_websocket_connect_succeeds(self, client):
        """Should accept WebSocket connection at /ws."""
        with client.websocket_connect("/ws") as websocket:
            assert websocket is not None

    def test_websocket_receives_message(self, client):
        """Should receive messages sent to WebSocket."""
        with client.websocket_connect("/ws") as websocket:
            websocket.send_text("hello")
            # Connection should stay open (not crash)
            # For now we just verify connection works

    def test_websocket_disconnect_cleans_up(self, client):
        """Should properly cleanup connection on disconnect."""
        from dashboard.main import manager

        initial_count = len(manager.active_connections)

        with client.websocket_connect("/ws"):
            # While connected, should have one more connection
            assert len(manager.active_connections) == initial_count + 1

        # After disconnect, should be back to initial
        assert len(manager.active_connections) == initial_count


class TestConnectionManagerIntegration:
    """Tests for ConnectionManager integration with WebSocket endpoint."""

    @pytest.fixture
    def client(self):
        """Create test client with mocked database pool."""
        with patch("dashboard.main.get_pool", new_callable=AsyncMock):
            with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                from dashboard.main import app
                yield TestClient(app)

    def test_manager_tracks_connection(self, client):
        """Manager should track active WebSocket connections."""
        from dashboard.main import manager

        with client.websocket_connect("/ws"):
            assert len(manager.active_connections) > 0

    def test_multiple_connections_tracked_separately(self, client):
        """Manager should track multiple connections with unique IDs."""
        from dashboard.main import manager

        with client.websocket_connect("/ws") as ws1:
            count_with_one = len(manager.active_connections)

            with client.websocket_connect("/ws") as ws2:
                count_with_two = len(manager.active_connections)
                assert count_with_two == count_with_one + 1


class TestWebSocketSubscriptions:
    """Tests for WebSocket subscription message handling."""

    @pytest.fixture
    def client(self):
        """Create test client with mocked database pool."""
        with patch("dashboard.main.get_pool", new_callable=AsyncMock):
            with patch("dashboard.main.close_pool", new_callable=AsyncMock):
                from dashboard.main import app
                yield TestClient(app)

    def test_subscribe_action_returns_confirmation(self, client):
        """Subscribe action should return confirmation message."""
        import json
        with client.websocket_connect("/ws") as websocket:
            websocket.send_json({"action": "subscribe", "project": "continuous-claude"})
            response = websocket.receive_json()
            assert response["type"] == "subscription"
            assert response["action"] == "subscribed"
            assert response["project"] == "continuous-claude"

    def test_unsubscribe_action_returns_confirmation(self, client):
        """Unsubscribe action should return confirmation message."""
        import json
        with client.websocket_connect("/ws") as websocket:
            websocket.send_json({"action": "subscribe", "project": "test-project"})
            websocket.receive_json()
            websocket.send_json({"action": "unsubscribe", "project": "test-project"})
            response = websocket.receive_json()
            assert response["type"] == "subscription"
            assert response["action"] == "unsubscribed"
            assert response["project"] == "test-project"

    def test_invalid_json_is_handled(self, client):
        """Invalid JSON should be handled gracefully."""
        with client.websocket_connect("/ws") as websocket:
            websocket.send_text("not valid json")
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "invalid" in response["message"].lower() or "json" in response["message"].lower()

    def test_unknown_action_returns_error(self, client):
        """Unknown action should return error message."""
        with client.websocket_connect("/ws") as websocket:
            websocket.send_json({"action": "unknown_action"})
            response = websocket.receive_json()
            assert response["type"] == "error"

    def test_missing_project_in_subscribe_returns_error(self, client):
        """Subscribe without project should return error."""
        with client.websocket_connect("/ws") as websocket:
            websocket.send_json({"action": "subscribe"})
            response = websocket.receive_json()
            assert response["type"] == "error"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
