"""Tests for the Roadmap pillar service."""

import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))

from dashboard.services.roadmap import RoadmapPillarService
from dashboard.models import PillarHealth, PillarStatus


class TestRoadmapPillarService:
    """Tests for RoadmapPillarService."""

    def test_name_property_returns_roadmap(self):
        """Service name should be 'roadmap'."""
        service = RoadmapPillarService()
        assert service.name == "roadmap"

    @pytest.mark.asyncio
    async def test_check_health_file_exists_with_completed_items(self, tmp_path):
        """Health check returns ONLINE with count of completed items."""
        roadmap_content = """# Project Roadmap

## Completed
- [x] Task one (2026-01-01)
- [x] Task two (2026-01-02)
- [x] Task three (2026-01-03)

## Planned
- [ ] Planned task one
- [ ] Planned task two
"""
        roadmap_file = tmp_path / "ROADMAP.md"
        roadmap_file.write_text(roadmap_content)

        service = RoadmapPillarService(project_root=tmp_path)
        health = await service.check_health()

        assert health.name == "roadmap"
        assert health.status == PillarStatus.ONLINE
        assert health.count == 3
        assert health.error is None

    @pytest.mark.asyncio
    async def test_check_health_file_not_found(self, tmp_path):
        """Health check returns OFFLINE when ROADMAP.md doesn't exist."""
        service = RoadmapPillarService(project_root=tmp_path)
        health = await service.check_health()

        assert health.name == "roadmap"
        assert health.status == PillarStatus.OFFLINE
        assert health.count == 0
        assert health.error is not None
        assert "not found" in health.error.lower()

    @pytest.mark.asyncio
    async def test_check_health_empty_roadmap(self, tmp_path):
        """Health check with empty roadmap returns ONLINE with count 0."""
        roadmap_file = tmp_path / "ROADMAP.md"
        roadmap_file.write_text("# Roadmap\n\nNo tasks yet.\n")

        service = RoadmapPillarService(project_root=tmp_path)
        health = await service.check_health()

        assert health.status == PillarStatus.ONLINE
        assert health.count == 0

    @pytest.mark.asyncio
    async def test_get_details_returns_breakdown(self, tmp_path):
        """get_details returns completed vs planned breakdown."""
        roadmap_content = """# Project Roadmap

## Completed
- [x] Task one (2026-01-01)
- [x] Task two (2026-01-02)

## Planned
- [ ] Planned task one
- [ ] Planned task two
- [ ] Planned task three
"""
        roadmap_file = tmp_path / "ROADMAP.md"
        roadmap_file.write_text(roadmap_content)

        service = RoadmapPillarService(project_root=tmp_path)
        details = await service.get_details()

        assert "completed" in details
        assert "planned" in details
        assert details["completed"] == 2
        assert details["planned"] == 3

    @pytest.mark.asyncio
    async def test_get_details_file_not_found(self, tmp_path):
        """get_details returns error info when file not found."""
        service = RoadmapPillarService(project_root=tmp_path)
        details = await service.get_details()

        assert "error" in details
        assert details["completed"] == 0
        assert details["planned"] == 0

    @pytest.mark.asyncio
    async def test_check_health_with_nested_items(self, tmp_path):
        """Health check correctly counts items with nested content."""
        roadmap_content = """# Project Roadmap

## Completed
- [x] Task one (2026-01-01)
  - Sub-bullet that shouldn't count
  - Another sub-bullet
- [x] Task two (2026-01-02)

## Planned
- [ ] Planned task
  - Sub-item
"""
        roadmap_file = tmp_path / "ROADMAP.md"
        roadmap_file.write_text(roadmap_content)

        service = RoadmapPillarService(project_root=tmp_path)
        health = await service.check_health()

        assert health.count == 2

    @pytest.mark.asyncio
    async def test_default_project_root(self):
        """Service uses project root from env if not specified."""
        service = RoadmapPillarService()
        assert service._project_root is not None
