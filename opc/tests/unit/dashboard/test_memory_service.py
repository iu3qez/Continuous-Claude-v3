"""Tests for MemoryPillarService."""
from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

opc_scripts = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts")
sys.path.insert(0, opc_scripts)

from dashboard.models import PillarHealth, PillarStatus
from dashboard.services.memory import MemoryPillarService


class TestMemoryPillarServiceCheckHealth:
    """Tests for MemoryPillarService.check_health()."""

    @pytest.mark.asyncio
    async def test_check_health_returns_online_when_db_available(self):
        """Should return ONLINE status with count when database is available."""
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(side_effect=[42, datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc)])

        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_conn), __aexit__=AsyncMock()))

        with patch("dashboard.services.memory.get_pool", return_value=mock_pool):
            service = MemoryPillarService()
            result = await service.check_health()

        assert isinstance(result, PillarHealth)
        assert result.name == "memory"
        assert result.status == PillarStatus.ONLINE
        assert result.count == 42
        assert result.last_activity == datetime(2025, 1, 15, 10, 30, tzinfo=timezone.utc)
        assert result.error is None

    @pytest.mark.asyncio
    async def test_check_health_returns_offline_when_db_unavailable(self):
        """Should return OFFLINE status with error when database connection fails."""
        with patch("dashboard.services.memory.get_pool", side_effect=Exception("Connection refused")):
            service = MemoryPillarService()
            result = await service.check_health()

        assert isinstance(result, PillarHealth)
        assert result.name == "memory"
        assert result.status == PillarStatus.OFFLINE
        assert result.count == 0
        assert result.error == "Connection refused"

    @pytest.mark.asyncio
    async def test_check_health_handles_query_error(self):
        """Should return OFFLINE status when query execution fails."""
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(side_effect=Exception("Query timeout"))

        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_conn), __aexit__=AsyncMock()))

        with patch("dashboard.services.memory.get_pool", return_value=mock_pool):
            service = MemoryPillarService()
            result = await service.check_health()

        assert result.status == PillarStatus.OFFLINE
        assert result.error is not None

    @pytest.mark.asyncio
    async def test_check_health_handles_null_last_activity(self):
        """Should handle NULL last_activity gracefully (empty table)."""
        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(side_effect=[0, None])

        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_conn), __aexit__=AsyncMock()))

        with patch("dashboard.services.memory.get_pool", return_value=mock_pool):
            service = MemoryPillarService()
            result = await service.check_health()

        assert result.status == PillarStatus.ONLINE
        assert result.count == 0
        assert result.last_activity is None


class TestMemoryPillarServiceGetDetails:
    """Tests for MemoryPillarService.get_details()."""

    @pytest.mark.asyncio
    async def test_get_details_returns_stats(self):
        """Should return detailed stats including learnings by type."""
        type_counts = [
            {"learning_type": "WORKING_SOLUTION", "count": 25},
            {"learning_type": "ERROR_FIX", "count": 10},
            {"learning_type": "CODEBASE_PATTERN", "count": 5},
        ]
        recent_entries = [
            {"id": 1, "content": "Learning 1", "created_at": datetime(2025, 1, 15, tzinfo=timezone.utc)},
            {"id": 2, "content": "Learning 2", "created_at": datetime(2025, 1, 14, tzinfo=timezone.utc)},
        ]

        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(side_effect=[type_counts, recent_entries])

        mock_pool = AsyncMock()
        mock_pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_conn), __aexit__=AsyncMock()))

        with patch("dashboard.services.memory.get_pool", return_value=mock_pool):
            service = MemoryPillarService()
            result = await service.get_details()

        assert "by_type" in result
        assert result["by_type"]["WORKING_SOLUTION"] == 25
        assert result["by_type"]["ERROR_FIX"] == 10
        assert "recent_entries" in result
        assert len(result["recent_entries"]) == 2

    @pytest.mark.asyncio
    async def test_get_details_returns_empty_on_error(self):
        """Should return empty dict on database error."""
        with patch("dashboard.services.memory.get_pool", side_effect=Exception("DB error")):
            service = MemoryPillarService()
            result = await service.get_details()

        assert result == {}
