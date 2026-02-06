"""Tests for KnowledgePillarService."""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

opc_scripts = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts")
sys.path.insert(0, opc_scripts)

from dashboard.models import PillarHealth, PillarStatus
from dashboard.services.knowledge import KnowledgePillarService


class TestKnowledgePillarServiceName:
    """Tests for KnowledgePillarService.name property."""

    def test_name_returns_knowledge(self):
        """Should return 'knowledge' as the pillar name."""
        service = KnowledgePillarService()
        assert service.name == "knowledge"


class TestKnowledgePillarServiceCheckHealth:
    """Tests for KnowledgePillarService.check_health()."""

    @pytest.mark.asyncio
    async def test_check_health_returns_online_when_file_exists_and_recent(self, tmp_path):
        """Should return ONLINE status when knowledge tree exists and was modified <24h ago."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_data = {
            "version": "1.0",
            "structure": {"directories": {}},
            "components": [],
        }
        tree_file.write_text(json.dumps(tree_data))

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert isinstance(result, PillarHealth)
        assert result.name == "knowledge"
        assert result.status == PillarStatus.ONLINE
        assert result.count == 3
        assert result.error is None

    @pytest.mark.asyncio
    async def test_check_health_returns_degraded_when_file_old(self, tmp_path):
        """Should return DEGRADED status when knowledge tree is >24h old."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_data = {"version": "1.0", "components": []}
        tree_file.write_text(json.dumps(tree_data))

        old_time = (datetime.now() - timedelta(hours=25)).timestamp()
        os.utime(tree_file, (old_time, old_time))

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert result.status == PillarStatus.DEGRADED
        assert result.name == "knowledge"
        assert result.count == 2

    @pytest.mark.asyncio
    async def test_check_health_returns_offline_when_file_missing(self, tmp_path):
        """Should return OFFLINE status when knowledge tree file doesn't exist."""
        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert result.status == PillarStatus.OFFLINE
        assert result.name == "knowledge"
        assert result.count == 0
        assert result.error is not None

    @pytest.mark.asyncio
    async def test_check_health_returns_offline_on_invalid_json(self, tmp_path):
        """Should return OFFLINE status when file contains invalid JSON."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_file.write_text("not valid json {{{")

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert result.status == PillarStatus.OFFLINE
        assert result.error is not None

    @pytest.mark.asyncio
    async def test_check_health_counts_top_level_keys(self, tmp_path):
        """Should count top-level keys in the tree structure."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_data = {
            "version": "1.0",
            "updated_at": "2026-02-04",
            "project": {},
            "structure": {},
            "components": [],
            "navigation": {},
            "goals": {},
            "critical_info": {},
        }
        tree_file.write_text(json.dumps(tree_data))

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert result.count == 8

    @pytest.mark.asyncio
    async def test_check_health_sets_last_activity_from_file_mtime(self, tmp_path):
        """Should set last_activity to the file modification time."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_file.write_text(json.dumps({"version": "1.0"}))

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.check_health()

        assert result.last_activity is not None
        assert isinstance(result.last_activity, datetime)


class TestKnowledgePillarServiceGetDetails:
    """Tests for KnowledgePillarService.get_details()."""

    @pytest.mark.asyncio
    async def test_get_details_returns_tree_structure(self, tmp_path):
        """Should return the parsed tree structure."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_data = {
            "version": "1.0",
            "project": {"name": "test-project"},
            "structure": {"root": "/test"},
        }
        tree_file.write_text(json.dumps(tree_data))

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.get_details()

        assert result["version"] == "1.0"
        assert result["project"]["name"] == "test-project"
        assert result["structure"]["root"] == "/test"

    @pytest.mark.asyncio
    async def test_get_details_returns_empty_on_missing_file(self, tmp_path):
        """Should return empty dict when file doesn't exist."""
        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.get_details()

        assert result == {}

    @pytest.mark.asyncio
    async def test_get_details_returns_empty_on_invalid_json(self, tmp_path):
        """Should return empty dict on JSON parse error."""
        tree_file = tmp_path / ".claude" / "knowledge-tree.json"
        tree_file.parent.mkdir(parents=True, exist_ok=True)
        tree_file.write_text("invalid json")

        service = KnowledgePillarService(project_root=tmp_path)
        result = await service.get_details()

        assert result == {}
