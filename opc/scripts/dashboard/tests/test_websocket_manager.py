"""Tests for WebSocket connection manager."""

import pytest
from unittest.mock import AsyncMock, MagicMock
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


class TestConnectionManagerInit:
    """Tests for ConnectionManager initialization."""

    def test_manager_instantiates_with_empty_connections(self):
        """ConnectionManager starts with no active connections."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()

        assert hasattr(manager, "active_connections")
        assert isinstance(manager.active_connections, dict)
        assert len(manager.active_connections) == 0


class TestConnectionManagerConnect:
    """Tests for ConnectionManager.connect method."""

    @pytest.mark.asyncio
    async def test_connect_stores_websocket_by_client_id(self):
        """Connect stores the websocket keyed by client_id."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-123"

        await manager.connect(mock_ws, client_id)

        assert client_id in manager.active_connections
        assert manager.active_connections[client_id] == mock_ws

    @pytest.mark.asyncio
    async def test_connect_accepts_websocket(self):
        """Connect calls websocket.accept()."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-456"

        await manager.connect(mock_ws, client_id)

        mock_ws.accept.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_multiple_clients(self):
        """Connect can track multiple clients."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")

        assert len(manager.active_connections) == 2
        assert manager.active_connections["client-1"] == mock_ws1
        assert manager.active_connections["client-2"] == mock_ws2


class TestConnectionManagerDisconnect:
    """Tests for ConnectionManager.disconnect method."""

    @pytest.mark.asyncio
    async def test_disconnect_removes_client(self):
        """Disconnect removes the client from active connections."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-789"

        await manager.connect(mock_ws, client_id)
        await manager.disconnect(client_id)

        assert client_id not in manager.active_connections

    @pytest.mark.asyncio
    async def test_disconnect_nonexistent_client_is_safe(self):
        """Disconnect handles nonexistent client without error."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()

        await manager.disconnect("nonexistent-client")

        assert "nonexistent-client" not in manager.active_connections


class TestConnectionManagerBroadcast:
    """Tests for ConnectionManager.broadcast method."""

    @pytest.mark.asyncio
    async def test_broadcast_sends_to_all_connected(self):
        """Broadcast sends message to all connected clients."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        mock_ws3 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")
        await manager.connect(mock_ws3, "client-3")

        message = {"type": "health_update", "data": {"status": "online"}}
        await manager.broadcast(message)

        expected_json = json.dumps(message)
        mock_ws1.send_text.assert_called_once_with(expected_json)
        mock_ws2.send_text.assert_called_once_with(expected_json)
        mock_ws3.send_text.assert_called_once_with(expected_json)

    @pytest.mark.asyncio
    async def test_broadcast_with_no_connections(self):
        """Broadcast with no connections does not raise error."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        message = {"type": "test"}

        await manager.broadcast(message)

    @pytest.mark.asyncio
    async def test_broadcast_serializes_dict_to_json(self):
        """Broadcast converts dict message to JSON string."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        await manager.connect(mock_ws, "client-1")

        message = {"type": "notification", "level": "info", "message": "Hello"}
        await manager.broadcast(message)

        call_args = mock_ws.send_text.call_args[0][0]
        assert json.loads(call_args) == message


class TestConnectionManagerSendPersonal:
    """Tests for ConnectionManager.send_personal method."""

    @pytest.mark.asyncio
    async def test_send_personal_sends_to_specific_client(self):
        """send_personal sends only to specified client."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")

        message = {"type": "personal", "data": "secret"}
        await manager.send_personal("client-1", message)

        expected_json = json.dumps(message)
        mock_ws1.send_text.assert_called_once_with(expected_json)
        mock_ws2.send_text.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_personal_to_nonexistent_client_is_safe(self):
        """send_personal to nonexistent client does not raise error."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        message = {"type": "test"}

        await manager.send_personal("nonexistent", message)

    @pytest.mark.asyncio
    async def test_send_personal_serializes_dict_to_json(self):
        """send_personal converts dict message to JSON string."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        await manager.connect(mock_ws, "client-1")

        message = {"type": "private", "content": "test"}
        await manager.send_personal("client-1", message)

        call_args = mock_ws.send_text.call_args[0][0]
        assert json.loads(call_args) == message


class TestConnectionManagerSubscriptions:
    """Tests for ConnectionManager subscription methods."""

    def test_manager_has_subscriptions_dict(self):
        """ConnectionManager has subscriptions tracking dict."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()

        assert hasattr(manager, "subscriptions")
        assert isinstance(manager.subscriptions, dict)
        assert len(manager.subscriptions) == 0

    @pytest.mark.asyncio
    async def test_subscribe_adds_project_to_client(self):
        """Subscribe adds project to client's subscription set."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-sub-1"
        project_id = "continuous-claude"

        await manager.connect(mock_ws, client_id)
        await manager.subscribe(client_id, project_id)

        assert client_id in manager.subscriptions
        assert project_id in manager.subscriptions[client_id]

    @pytest.mark.asyncio
    async def test_subscribe_multiple_projects(self):
        """Client can subscribe to multiple projects."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-sub-2"

        await manager.connect(mock_ws, client_id)
        await manager.subscribe(client_id, "project-1")
        await manager.subscribe(client_id, "project-2")

        assert len(manager.subscriptions[client_id]) == 2
        assert "project-1" in manager.subscriptions[client_id]
        assert "project-2" in manager.subscriptions[client_id]

    @pytest.mark.asyncio
    async def test_subscribe_same_project_twice_is_idempotent(self):
        """Subscribing to same project twice doesn't duplicate."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-sub-3"

        await manager.connect(mock_ws, client_id)
        await manager.subscribe(client_id, "project-1")
        await manager.subscribe(client_id, "project-1")

        assert len(manager.subscriptions[client_id]) == 1

    @pytest.mark.asyncio
    async def test_unsubscribe_removes_project(self):
        """Unsubscribe removes project from client's subscriptions."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-unsub-1"

        await manager.connect(mock_ws, client_id)
        await manager.subscribe(client_id, "project-1")
        await manager.unsubscribe(client_id, "project-1")

        assert "project-1" not in manager.subscriptions.get(client_id, set())

    @pytest.mark.asyncio
    async def test_unsubscribe_nonexistent_project_is_safe(self):
        """Unsubscribing from project not subscribed to is safe."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-unsub-2"

        await manager.connect(mock_ws, client_id)
        await manager.unsubscribe(client_id, "nonexistent-project")

    @pytest.mark.asyncio
    async def test_unsubscribe_nonexistent_client_is_safe(self):
        """Unsubscribing nonexistent client is safe."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        await manager.unsubscribe("nonexistent-client", "project-1")

    @pytest.mark.asyncio
    async def test_disconnect_cleans_up_subscriptions(self):
        """Disconnecting client removes their subscriptions."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws = AsyncMock()
        client_id = "client-cleanup"

        await manager.connect(mock_ws, client_id)
        await manager.subscribe(client_id, "project-1")
        await manager.disconnect(client_id)

        assert client_id not in manager.subscriptions


class TestConnectionManagerBroadcastWithProject:
    """Tests for ConnectionManager.broadcast with project filtering."""

    @pytest.mark.asyncio
    async def test_broadcast_without_project_sends_to_all(self):
        """Broadcast without project_id sends to all clients."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")
        await manager.subscribe("client-1", "project-a")

        message = {"type": "test"}
        await manager.broadcast(message)

        mock_ws1.send_text.assert_called_once()
        mock_ws2.send_text.assert_called_once()

    @pytest.mark.asyncio
    async def test_broadcast_with_project_sends_only_to_subscribers(self):
        """Broadcast with project_id sends only to subscribed clients."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()
        mock_ws3 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")
        await manager.connect(mock_ws3, "client-3")

        await manager.subscribe("client-1", "project-a")
        await manager.subscribe("client-3", "project-a")

        message = {"type": "project_update", "project": "project-a"}
        await manager.broadcast(message, project_id="project-a")

        mock_ws1.send_text.assert_called_once()
        mock_ws2.send_text.assert_not_called()
        mock_ws3.send_text.assert_called_once()

    @pytest.mark.asyncio
    async def test_broadcast_with_project_no_subscribers(self):
        """Broadcast with project_id with no subscribers sends to none."""
        from dashboard.websocket.manager import ConnectionManager

        manager = ConnectionManager()
        mock_ws1 = AsyncMock()
        mock_ws2 = AsyncMock()

        await manager.connect(mock_ws1, "client-1")
        await manager.connect(mock_ws2, "client-2")
        await manager.subscribe("client-1", "project-a")

        message = {"type": "test"}
        await manager.broadcast(message, project_id="project-b")

        mock_ws1.send_text.assert_not_called()
        mock_ws2.send_text.assert_not_called()
