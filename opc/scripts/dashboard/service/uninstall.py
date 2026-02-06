"""Windows service uninstaller for Session Dashboard using NSSM."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SERVICE_NAME = "SessionDashboard"


def find_nssm() -> Path | None:
    result = shutil.which("nssm")
    if result:
        return Path(result)
    return None


def stop_service(nssm: Path) -> bool:
    result = subprocess.run(
        [str(nssm), "stop", SERVICE_NAME],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        if "SERVICE_STOPPED" in (result.stdout + result.stderr):
            print(f"Service '{SERVICE_NAME}' already stopped.")
            return True
        print(f"WARNING: Could not stop service: {result.stderr.strip()}")
        return False
    print(f"Service '{SERVICE_NAME}' stopped.")
    return True


def remove_service(nssm: Path) -> bool:
    result = subprocess.run(
        [str(nssm), "remove", SERVICE_NAME, "confirm"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"ERROR: Failed to remove service: {result.stderr.strip()}")
        return False
    print(f"Service '{SERVICE_NAME}' removed.")
    return True


def uninstall_service() -> bool:
    nssm = find_nssm()
    if nssm is None:
        print("ERROR: nssm not found on PATH. Install from https://nssm.cc/")
        return False

    stop_service(nssm)
    return remove_service(nssm)


def main() -> int:
    print(f"Uninstalling {SERVICE_NAME}...")
    if uninstall_service():
        print("Done.")
        return 0
    print("Uninstall failed.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
