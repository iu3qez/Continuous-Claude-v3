"""Tests for PageIndex pillar service (dashboard)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

from dashboard.models import PillarHealth, PillarStatus
from dashboard.services.pageindex import PageIndexPillarService


class TestPageIndexPillarService:
    """Test suite for PageIndexPillarService."""

    def test_name_property(self):
        """Service name should be 'pageindex'."""
        service = PageIndexPillarService()
        assert service.name == "pageindex"

    @pytest.mark.asyncio
    async def test_check_health_online(self):
        """Returns ONLINE with count when table is accessible."""
        mock_conn = AsyncMock()
        mock_conn.fetchval.return_value = 42

        mock_pool = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value = mock_conn
        mock_ctx.__aexit__.return_value = None
        mock_pool.acquire.return_value = mock_ctx

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.services.pageindex.get_pool", mock_get_pool):
            service = PageIndexPillarService()
            result = await service.check_health()

        assert result.name == "pageindex"
        assert result.status == PillarStatus.ONLINE
        assert result.count == 42
        assert result.error is None

    @pytest.mark.asyncio
    async def test_check_health_offline_on_error(self):
        """Returns OFFLINE with error when database fails."""
        mock_pool = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.side_effect = Exception("Connection failed")
        mock_pool.acquire.return_value = mock_ctx

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.services.pageindex.get_pool", mock_get_pool):
            service = PageIndexPillarService()
            result = await service.check_health()

        assert result.name == "pageindex"
        assert result.status == PillarStatus.OFFLINE
        assert result.count == 0
        assert "Connection failed" in result.error

    @pytest.mark.asyncio
    async def test_check_health_offline_table_missing(self):
        """Returns OFFLINE when pageindex_trees table does not exist."""
        mock_conn = AsyncMock()
        mock_conn.fetchval.side_effect = Exception('relation "pageindex_trees" does not exist')

        mock_pool = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value = mock_conn
        mock_ctx.__aexit__.return_value = None
        mock_pool.acquire.return_value = mock_ctx

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.services.pageindex.get_pool", mock_get_pool):
            service = PageIndexPillarService()
            result = await service.check_health()

        assert result.status == PillarStatus.OFFLINE
        assert "pageindex_trees" in result.error

    @pytest.mark.asyncio
    async def test_get_details_returns_documents(self):
        """get_details returns list of indexed documents."""
        mock_rows = [
            {"doc_path": "ROADMAP.md", "doc_type": "ROADMAP", "updated_at": None},
            {"doc_path": "ARCHITECTURE.md", "doc_type": "ARCHITECTURE", "updated_at": None},
        ]
        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = mock_rows

        mock_pool = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.return_value = mock_conn
        mock_ctx.__aexit__.return_value = None
        mock_pool.acquire.return_value = mock_ctx

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.services.pageindex.get_pool", mock_get_pool):
            service = PageIndexPillarService()
            result = await service.get_details()

        assert "documents" in result
        assert len(result["documents"]) == 2
        assert result["documents"][0]["doc_path"] == "ROADMAP.md"

    @pytest.mark.asyncio
    async def test_get_details_handles_error(self):
        """get_details returns empty list on error."""
        mock_pool = MagicMock()
        mock_ctx = AsyncMock()
        mock_ctx.__aenter__.side_effect = Exception("DB error")
        mock_pool.acquire.return_value = mock_ctx

        async def mock_get_pool():
            return mock_pool

        with patch("dashboard.services.pageindex.get_pool", mock_get_pool):
            service = PageIndexPillarService()
            result = await service.get_details()

        assert "documents" in result
        assert result["documents"] == []
        assert "error" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
