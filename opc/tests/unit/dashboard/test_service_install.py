"""Tests for Windows service installer using NSSM."""
from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

opc_scripts = os.path.join(os.path.dirname(__file__), "..", "..", "..", "scripts")
sys.path.insert(0, opc_scripts)

from dashboard.service.install import (
    SERVICE_NAME,
    DISPLAY_NAME,
    DESCRIPTION,
    find_nssm,
    get_python_path,
    get_project_root,
    get_logs_dir,
    install_service,
    main,
)


class TestConstants:
    def test_service_name(self):
        assert SERVICE_NAME == "SessionDashboard"

    def test_display_name(self):
        assert DISPLAY_NAME == "Continuous Claude - Session Dashboard"

    def test_description(self):
        assert DESCRIPTION == "Real-time session monitoring dashboard on localhost:3434"


class TestFindNssm:
    @patch("shutil.which")
    def test_returns_path_when_found(self, mock_which):
        mock_which.return_value = r"C:\tools\nssm.exe"
        result = find_nssm()
        assert result == Path(r"C:\tools\nssm.exe")
        mock_which.assert_called_once_with("nssm")

    @patch("shutil.which")
    def test_returns_none_when_not_found(self, mock_which):
        mock_which.return_value = None
        result = find_nssm()
        assert result is None


class TestGetPythonPath:
    @patch("sys.executable", r"C:\Python313\python.exe")
    def test_returns_sys_executable(self):
        result = get_python_path()
        assert result == Path(r"C:\Python313\python.exe")


class TestGetProjectRoot:
    def test_returns_opc_parent(self):
        root = get_project_root()
        assert root.name == "opc"
        assert root.is_absolute()


class TestGetLogsDir:
    def test_returns_dashboard_logs_dir(self):
        logs = get_logs_dir()
        assert logs.name == "logs"
        assert "dashboard" in str(logs)


class TestInstallService:
    @patch("dashboard.service.install.find_nssm")
    def test_fails_when_nssm_not_found(self, mock_find):
        mock_find.return_value = None
        result = install_service()
        assert result is False

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_calls_nssm_install(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        result = install_service()
        assert result is True

        install_call = mock_run.call_args_list[0]
        args = install_call[0][0]
        assert args[0] == str(Path(r"C:\tools\nssm.exe"))
        assert args[1] == "install"
        assert args[2] == "SessionDashboard"

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_display_name(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        nssm = str(Path(r"C:\tools\nssm.exe"))
        all_calls = [c[0][0] for c in mock_run.call_args_list]
        display_call = [c for c in all_calls if "DisplayName" in c]
        assert len(display_call) == 1
        assert "Continuous Claude - Session Dashboard" in display_call[0]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_description(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        desc_call = [c for c in all_calls if "Description" in c]
        assert len(desc_call) == 1
        assert "Real-time session monitoring dashboard" in desc_call[0][-1]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_app_directory(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        dir_call = [c for c in all_calls if "AppDirectory" in c]
        assert len(dir_call) == 1

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_stdout_log(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        stdout_call = [c for c in all_calls if "AppStdout" in c]
        assert len(stdout_call) == 1
        assert "service-stdout.log" in stdout_call[0][-1]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_stderr_log(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        stderr_call = [c for c in all_calls if "AppStderr" in c]
        assert len(stderr_call) == 1
        assert "service-stderr.log" in stderr_call[0][-1]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_auto_start(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        start_call = [c for c in all_calls if "Start" in c and "SERVICE_AUTO_START" in c]
        assert len(start_call) == 1

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_restart_on_failure(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        exit_call = [c for c in all_calls if "AppExit" in c]
        assert len(exit_call) == 1
        assert "Restart" in exit_call[0]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_restart_delay(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        delay_call = [c for c in all_calls if "AppRestartDelay" in c]
        assert len(delay_call) == 1
        assert "5000" in delay_call[0]

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_returns_false_on_install_failure(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=1, stderr="Access denied")

        result = install_service()
        assert result is False

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_uses_python_m_module_invocation(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        install_call = mock_run.call_args_list[0][0][0]
        python_path = install_call[3]
        assert python_path.endswith("python.exe") or "python" in python_path
        app_args = install_call[4:]
        assert "-m" in app_args
        assert "opc.scripts.dashboard.main" in " ".join(app_args)

    @patch("subprocess.run")
    @patch("dashboard.service.install.find_nssm")
    def test_sets_log_rotation(self, mock_find, mock_run):
        mock_find.return_value = Path(r"C:\tools\nssm.exe")
        mock_run.return_value = MagicMock(returncode=0)

        install_service()

        all_calls = [c[0][0] for c in mock_run.call_args_list]
        rotate_call = [c for c in all_calls if "AppRotateFiles" in c]
        assert len(rotate_call) == 1
        assert "1" in rotate_call[0]

        rotate_bytes_call = [c for c in all_calls if "AppRotateBytes" in c]
        assert len(rotate_bytes_call) == 1
        assert "5242880" in rotate_bytes_call[0]


class TestMain:
    @patch("dashboard.service.install.install_service")
    def test_main_calls_install(self, mock_install):
        mock_install.return_value = True
        result = main()
        assert result == 0
        mock_install.assert_called_once()

    @patch("dashboard.service.install.install_service")
    def test_main_returns_1_on_failure(self, mock_install):
        mock_install.return_value = False
        result = main()
        assert result == 1
