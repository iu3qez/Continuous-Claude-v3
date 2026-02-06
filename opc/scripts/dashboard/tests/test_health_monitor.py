"""Tests for HealthMonitor background task."""

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dashboard.models import PillarHealth, PillarStatus
from dashboard.tasks.health_monitor import HealthMonitor
from dashboard.websocket.manager import ConnectionManager


@pytest.fixture
def connection_manager():
    """Create a mock connection manager."""
    manager = MagicMock(spec=ConnectionManager)
    manager.broadcast = AsyncMock()
    return manager


@pytest.fixture
def mock_services():
    """Create mock pillar services."""
    services = {}
    for name in ["memory", "knowledge", "pageindex", "handoffs", "roadmap"]:
        service = MagicMock()
        service.name = name
        service.check_health = AsyncMock(
            return_value=PillarHealth(
                name=name, status=PillarStatus.ONLINE, count=10
            )
        )
        services[name] = service
    return services


class TestHealthMonitorInit:
    """Tests for HealthMonitor initialization."""

    def test_init_with_defaults(self, connection_manager):
        """Test initialization with default interval."""
        monitor = HealthMonitor(connection_manager)
        assert monitor._connection_manager is connection_manager
        assert monitor._interval == 10
        assert monitor._previous_states == {}

    def test_init_with_custom_interval(self, connection_manager):
        """Test initialization with custom interval."""
        monitor = HealthMonitor(connection_manager, interval=30)
        assert monitor._interval == 30


class TestCheckAllPillars:
    """Tests for check_all_pillars method."""

    @pytest.mark.asyncio
    async def test_check_all_pillars_returns_5_results(self, connection_manager):
        """Test that all 5 pillars are checked."""
        monitor = HealthMonitor(connection_manager)

        # Mock _services as dict (implementation uses dict access, not .items())
        mock_services = {
            "memory": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="memory", status=PillarStatus.ONLINE, count=5)
            )),
            "knowledge": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="knowledge", status=PillarStatus.ONLINE, count=3)
            )),
            "pageindex": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="pageindex", status=PillarStatus.ONLINE, count=7)
            )),
            "handoffs": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="handoffs", status=PillarStatus.ONLINE, count=2)
            )),
            "roadmap": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="roadmap", status=PillarStatus.ONLINE, count=15)
            )),
        }

        with patch.object(monitor, "_services", mock_services):
            results = await monitor.check_all_pillars()

        assert len(results) == 5
        assert "memory" in results
        assert "knowledge" in results
        assert "pageindex" in results
        assert "handoffs" in results
        assert "roadmap" in results

    @pytest.mark.asyncio
    async def test_check_all_pillars_handles_failures(self, connection_manager):
        """Test that failures in one pillar don't affect others."""
        monitor = HealthMonitor(connection_manager)

        # Mock _services as dict with one failing service
        mock_services = {
            "memory": MagicMock(check_health=AsyncMock(
                side_effect=Exception("DB connection failed")
            )),
            "knowledge": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="knowledge", status=PillarStatus.ONLINE, count=3)
            )),
            "pageindex": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="pageindex", status=PillarStatus.ONLINE, count=7)
            )),
            "handoffs": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="handoffs", status=PillarStatus.ONLINE, count=2)
            )),
            "roadmap": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="roadmap", status=PillarStatus.ONLINE, count=15)
            )),
        }

        with patch.object(monitor, "_services", mock_services):
            results = await monitor.check_all_pillars()

        assert "memory" in results
        assert results["memory"].status == PillarStatus.OFFLINE
        assert "knowledge" in results
        assert results["knowledge"].status == PillarStatus.ONLINE


class TestDetectChanges:
    """Tests for detect_changes method."""

    @pytest.mark.asyncio
    async def test_detect_changes_first_run(self, connection_manager):
        """Test that first run detects all pillars as changed."""
        monitor = HealthMonitor(connection_manager)
        monitor._previous_states = {}

        current_states = {
            "memory": PillarHealth(name="memory", status=PillarStatus.ONLINE, count=5),
            "knowledge": PillarHealth(name="knowledge", status=PillarStatus.ONLINE, count=3),
        }

        changed = await monitor.detect_changes(current_states)

        assert len(changed) == 2
        assert "memory" in changed
        assert "knowledge" in changed

    @pytest.mark.asyncio
    async def test_detect_changes_status_change(self, connection_manager):
        """Test detection when status changes."""
        monitor = HealthMonitor(connection_manager)
        monitor._previous_states = {
            "memory": PillarHealth(name="memory", status=PillarStatus.ONLINE, count=5),
        }

        current_states = {
            "memory": PillarHealth(name="memory", status=PillarStatus.OFFLINE, count=0),
        }

        changed = await monitor.detect_changes(current_states)

        assert "memory" in changed
        assert changed["memory"].status == PillarStatus.OFFLINE

    @pytest.mark.asyncio
    async def test_detect_changes_count_change(self, connection_manager):
        """Test detection when count changes."""
        monitor = HealthMonitor(connection_manager)
        monitor._previous_states = {
            "memory": PillarHealth(name="memory", status=PillarStatus.ONLINE, count=5),
        }

        current_states = {
            "memory": PillarHealth(name="memory", status=PillarStatus.ONLINE, count=10),
        }

        changed = await monitor.detect_changes(current_states)

        assert "memory" in changed
        assert changed["memory"].count == 10

    @pytest.mark.asyncio
    async def test_detect_changes_no_change(self, connection_manager):
        """Test that no changes returns empty dict."""
        monitor = HealthMonitor(connection_manager)
        health = PillarHealth(name="memory", status=PillarStatus.ONLINE, count=5)
        monitor._previous_states = {"memory": health}

        current_states = {"memory": health}

        changed = await monitor.detect_changes(current_states)

        assert len(changed) == 0


class TestStartStop:
    """Tests for start and stop methods."""

    @pytest.mark.asyncio
    async def test_start_creates_task(self, connection_manager):
        """Test that start creates a background task."""
        monitor = HealthMonitor(connection_manager, interval=1)

        with patch.object(monitor, "check_all_pillars", new_callable=AsyncMock) as mock_check:
            mock_check.return_value = {}

            await monitor.start()
            await asyncio.sleep(0.1)

            assert monitor._task is not None
            assert not monitor._task.done()

            await monitor.stop()

    @pytest.mark.asyncio
    async def test_stop_cancels_task(self, connection_manager):
        """Test that stop cancels the background task."""
        monitor = HealthMonitor(connection_manager, interval=1)

        with patch.object(monitor, "check_all_pillars", new_callable=AsyncMock) as mock_check:
            mock_check.return_value = {}

            await monitor.start()
            await asyncio.sleep(0.1)

            task = monitor._task
            await monitor.stop()

            assert monitor._task is None
            assert task.cancelled() or task.done()


class TestBroadcast:
    """Tests for broadcasting health updates."""

    @pytest.mark.asyncio
    async def test_broadcasts_on_change(self, connection_manager):
        """Test that changes trigger broadcasts."""
        monitor = HealthMonitor(connection_manager, interval=0.1)

        call_count = [0]

        async def mock_health():
            call_count[0] += 1
            return PillarHealth(
                name="memory",
                status=PillarStatus.ONLINE if call_count[0] == 1 else PillarStatus.OFFLINE,
                count=call_count[0],
            )

        # Mock _services as dict with all 5 services
        mock_services = {
            "memory": MagicMock(check_health=mock_health),
            "knowledge": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="knowledge", status=PillarStatus.ONLINE, count=3)
            )),
            "pageindex": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="pageindex", status=PillarStatus.ONLINE, count=7)
            )),
            "handoffs": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="handoffs", status=PillarStatus.ONLINE, count=2)
            )),
            "roadmap": MagicMock(check_health=AsyncMock(
                return_value=PillarHealth(name="roadmap", status=PillarStatus.ONLINE, count=15)
            )),
        }

        with patch.object(monitor, "_services", mock_services):
            await monitor.start()
            await asyncio.sleep(0.25)
            await monitor.stop()

        assert connection_manager.broadcast.call_count >= 1
