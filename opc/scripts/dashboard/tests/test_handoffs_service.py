"""Tests for HandoffsPillarService."""
from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from dashboard.models import PillarHealth, PillarStatus
from dashboard.services.handoffs import HandoffsPillarService


def create_mock_pool(fetchval_return=None, fetchval_side_effect=None, fetch_return=None, fetch_side_effect=None):
    """Helper to create properly configured mock pool."""
    mock_conn = MagicMock()

    if fetchval_side_effect:
        mock_conn.fetchval = AsyncMock(side_effect=fetchval_side_effect)
    else:
        mock_conn.fetchval = AsyncMock(return_value=fetchval_return)

    if fetch_side_effect:
        mock_conn.fetch = AsyncMock(side_effect=fetch_side_effect)
    else:
        mock_conn.fetch = AsyncMock(return_value=fetch_return or [])

    mock_ctx = MagicMock()
    mock_ctx.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_ctx.__aexit__ = AsyncMock(return_value=None)

    mock_pool = MagicMock()
    mock_pool.acquire.return_value = mock_ctx

    return mock_pool


class TestHandoffsPillarService:
    """Test suite for HandoffsPillarService."""

    def test_name_property(self):
        """Service name property returns 'handoffs'."""
        service = HandoffsPillarService()
        assert service.name == "handoffs"

    @pytest.mark.asyncio
    async def test_check_health_db_only(self):
        """Health check with DB count and no files."""
        mock_pool = create_mock_pool(fetchval_return=5)

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = []
            health = await service.check_health()

        assert health.status == PillarStatus.ONLINE
        assert health.count == 5
        assert health.name == "handoffs"

    @pytest.mark.asyncio
    async def test_check_health_files_only(self):
        """Health check with files when DB table doesn't exist."""
        mock_pool = create_mock_pool(
            fetchval_side_effect=Exception("relation \"handoffs\" does not exist")
        )

        mock_file = MagicMock()
        mock_file.stat.return_value.st_mtime = datetime.now().timestamp()
        mock_files = [mock_file, mock_file, mock_file]

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = mock_files
            health = await service.check_health()

        assert health.status == PillarStatus.ONLINE
        assert health.count == 3
        assert health.error is None

    @pytest.mark.asyncio
    async def test_check_health_combined_count(self):
        """Health check combines DB count and file count."""
        mock_pool = create_mock_pool(fetchval_return=2)

        mock_file = MagicMock()
        mock_file.stat.return_value.st_mtime = datetime.now().timestamp()
        mock_files = [mock_file, mock_file]

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = mock_files
            health = await service.check_health()

        assert health.status == PillarStatus.ONLINE
        assert health.count == 4  # 2 from DB + 2 files

    @pytest.mark.asyncio
    async def test_check_health_offline_when_both_fail(self):
        """Health check returns OFFLINE when both sources fail."""
        mock_pool = create_mock_pool(
            fetchval_side_effect=Exception("DB connection failed")
        )

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.side_effect = Exception("File error")
            health = await service.check_health()

        assert health.status == PillarStatus.OFFLINE
        assert health.count == 0
        assert health.error is not None

    @pytest.mark.asyncio
    async def test_check_health_handles_missing_table_gracefully(self):
        """Health check handles missing handoffs table gracefully."""
        mock_pool = create_mock_pool(
            fetchval_side_effect=Exception("relation \"handoffs\" does not exist")
        )

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = []
            health = await service.check_health()

        assert health.status == PillarStatus.ONLINE
        assert health.count == 0
        assert health.error is None

    @pytest.mark.asyncio
    async def test_get_details_returns_recent_handoffs(self):
        """get_details returns list of recent handoffs."""
        mock_pool = create_mock_pool(
            fetch_return=[{"id": 1, "name": "test-handoff", "created_at": None}]
        )

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = []
            details = await service.get_details()

        assert "recent_handoffs" in details

    @pytest.mark.asyncio
    async def test_get_details_handles_errors(self):
        """get_details returns empty dict on error."""
        mock_pool = create_mock_pool(fetch_side_effect=Exception("Query failed"))

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.side_effect = Exception("File error")
            details = await service.get_details()

        assert details == {}

    @pytest.mark.asyncio
    async def test_get_details_includes_file_handoffs(self):
        """get_details includes file handoffs when present."""
        mock_pool = create_mock_pool(
            fetch_side_effect=Exception("relation \"handoffs\" does not exist")
        )

        mock_file = MagicMock()
        mock_file.name = "HANDOFF-test.md"
        mock_file.stat.return_value.st_mtime = datetime.now().timestamp()
        mock_file.__str__ = lambda self: "/path/to/HANDOFF-test.md"

        with patch("dashboard.services.handoffs.get_pool", AsyncMock(return_value=mock_pool)):
            service = HandoffsPillarService()
            service._claude_dir = MagicMock()
            service._claude_dir.glob.return_value = [mock_file]
            details = await service.get_details()

        assert "file_handoffs" in details
        assert len(details["file_handoffs"]) == 1
