"""Tests for dashboard main module."""

import pytest
from unittest.mock import AsyncMock, patch


class TestAppCreation:
    """Test FastAPI app creation and configuration."""

    def test_app_exists(self):
        """App module should be importable."""
        from scripts.dashboard import main
        assert hasattr(main, 'app')

    def test_app_is_fastapi(self):
        """App should be a FastAPI instance."""
        from scripts.dashboard.main import app
        from fastapi import FastAPI
        assert isinstance(app, FastAPI)

    def test_app_title(self):
        """App should have title 'Session Dashboard'."""
        from scripts.dashboard.main import app
        assert app.title == "Session Dashboard"


class TestLifespan:
    """Test lifespan context manager behavior."""

    @pytest.mark.asyncio
    async def test_lifespan_initializes_pool(self):
        """Lifespan should call get_pool on startup."""
        from scripts.dashboard.main import lifespan, app

        with patch('scripts.dashboard.main.get_pool', new_callable=AsyncMock) as mock_get_pool:
            with patch('scripts.dashboard.main.close_pool', new_callable=AsyncMock):
                async with lifespan(app):
                    mock_get_pool.assert_called_once()

    @pytest.mark.asyncio
    async def test_lifespan_closes_pool_on_shutdown(self):
        """Lifespan should call close_pool on shutdown."""
        from scripts.dashboard.main import lifespan, app

        with patch('scripts.dashboard.main.get_pool', new_callable=AsyncMock):
            with patch('scripts.dashboard.main.close_pool', new_callable=AsyncMock) as mock_close_pool:
                async with lifespan(app):
                    pass
                mock_close_pool.assert_called_once()

    @pytest.mark.asyncio
    async def test_lifespan_handles_pool_init_failure_gracefully(self):
        """Lifespan should not crash if pool initialization fails."""
        from scripts.dashboard.main import lifespan, app

        with patch('scripts.dashboard.main.get_pool', new_callable=AsyncMock) as mock_get_pool:
            mock_get_pool.side_effect = Exception("DB unavailable")
            with patch('scripts.dashboard.main.close_pool', new_callable=AsyncMock):
                async with lifespan(app):
                    pass


class TestRunFunction:
    """Test the run function for uvicorn startup."""

    def test_run_function_exists(self):
        """Run function should exist."""
        from scripts.dashboard import main
        assert hasattr(main, 'run')
        assert callable(main.run)

    def test_run_calls_uvicorn_with_correct_params(self):
        """Run should call uvicorn.run with config values."""
        from scripts.dashboard.main import run
        from scripts.dashboard.config import settings

        with patch('scripts.dashboard.main.uvicorn.run') as mock_uvicorn:
            run()
            mock_uvicorn.assert_called_once()
            call_kwargs = mock_uvicorn.call_args
            assert call_kwargs.kwargs.get('host') == settings.HOST or call_kwargs[1].get('host') == settings.HOST
            assert call_kwargs.kwargs.get('port') == settings.PORT or call_kwargs[1].get('port') == settings.PORT


class TestStaticFilesAndSPA:
    """Test static file serving and SPA fallback."""

    def test_assets_route_mounted(self):
        """Assets should be mounted at /assets path."""
        from scripts.dashboard.main import app
        routes = [route.path for route in app.routes]
        assert "/assets" in routes or any("/assets" in str(r) for r in app.routes)

    def test_static_dir_path_configured(self):
        """Static directory path should be configured."""
        from scripts.dashboard.main import STATIC_DIR
        assert STATIC_DIR.name == "static"

    def test_spa_fallback_route_exists(self):
        """SPA fallback route should exist for client-side routing."""
        from scripts.dashboard.main import app
        path_routes = [r for r in app.routes if hasattr(r, 'path')]
        spa_route = [r for r in path_routes if hasattr(r, 'path') and r.path == "/{full_path:path}"]
        assert len(spa_route) == 1, "SPA fallback route /{full_path:path} should exist"


class TestStaticFilesIntegration:
    """Integration tests for static file serving."""

    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from scripts.dashboard.main import app
        with patch('scripts.dashboard.main.get_pool', new_callable=AsyncMock):
            with patch('scripts.dashboard.main.close_pool', new_callable=AsyncMock):
                with TestClient(app) as client:
                    yield client

    def test_root_serves_index_html(self, client):
        """Root path should serve index.html."""
        response = client.get("/")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

    def test_spa_fallback_serves_index_html(self, client):
        """Non-API paths should serve index.html for SPA routing."""
        response = client.get("/sessions")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

    def test_spa_fallback_nested_route(self, client):
        """Nested non-API paths should serve index.html."""
        response = client.get("/sessions/123/details")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

    def test_api_routes_not_affected_by_spa_fallback(self, client):
        """API routes should not be affected by SPA fallback."""
        response = client.get("/api/health")
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "application/json" in content_type, "API routes should return JSON, not HTML"
