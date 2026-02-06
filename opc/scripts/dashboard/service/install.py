"""Windows service installer for Session Dashboard using NSSM."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SERVICE_NAME = "SessionDashboard"
DISPLAY_NAME = "Continuous Claude - Session Dashboard"
DESCRIPTION = "Real-time session monitoring dashboard on localhost:3434"


def find_nssm() -> Path | None:
    result = shutil.which("nssm")
    if result:
        return Path(result)
    return None


def get_python_path() -> Path:
    return Path(sys.executable)


def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent.parent


def get_logs_dir() -> Path:
    return Path(__file__).resolve().parent.parent / "logs"


def _run_nssm(nssm: Path, *args: str) -> bool:
    cmd = [str(nssm), *args]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"NSSM command failed: {' '.join(cmd)}")
        if result.stderr:
            print(f"  Error: {result.stderr.strip()}")
        return False
    return True


def install_service() -> bool:
    nssm = find_nssm()
    if nssm is None:
        print("ERROR: nssm not found on PATH. Install from https://nssm.cc/")
        return False

    python = get_python_path()
    project_root = get_project_root()
    logs_dir = get_logs_dir()
    logs_dir.mkdir(parents=True, exist_ok=True)

    result = subprocess.run(
        [str(nssm), "install", SERVICE_NAME, str(python), "-m", "opc.scripts.dashboard.main"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR: Failed to install service: {result.stderr}")
        return False

    print(f"Service '{SERVICE_NAME}' installed.")

    configs = [
        ("set", SERVICE_NAME, "DisplayName", DISPLAY_NAME),
        ("set", SERVICE_NAME, "Description", DESCRIPTION),
        ("set", SERVICE_NAME, "AppDirectory", str(project_root)),
        ("set", SERVICE_NAME, "AppStdout", str(logs_dir / "service-stdout.log")),
        ("set", SERVICE_NAME, "AppStderr", str(logs_dir / "service-stderr.log")),
        ("set", SERVICE_NAME, "AppRotateFiles", "1"),
        ("set", SERVICE_NAME, "AppRotateBytes", "5242880"),
        ("set", SERVICE_NAME, "AppExit", "Default", "Restart"),
        ("set", SERVICE_NAME, "AppRestartDelay", "5000"),
        ("set", SERVICE_NAME, "Start", "SERVICE_AUTO_START"),
    ]

    for cfg in configs:
        if not _run_nssm(nssm, *cfg):
            print(f"WARNING: Failed to set {cfg[2]}")

    print(f"Service '{SERVICE_NAME}' configured successfully.")
    print(f"  Working dir: {project_root}")
    print(f"  Logs: {logs_dir}")
    print(f"  Start: nssm start {SERVICE_NAME}")
    return True


def main() -> int:
    print(f"Installing {DISPLAY_NAME}...")
    if install_service():
        print("Done.")
        return 0
    print("Installation failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
