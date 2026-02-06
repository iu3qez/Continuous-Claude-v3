@echo off
setlocal

set SERVICE_NAME=SessionDashboard
set SCRIPT_DIR=%~dp0
for %%i in ("%SCRIPT_DIR%..\..\..") do set OPC_ROOT=%%~fi
set LOGS_DIR=%SCRIPT_DIR%..\logs

where nssm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: nssm not found on PATH. Install from https://nssm.cc/
    exit /b 1
)

if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo Configuring %SERVICE_NAME%...

nssm set %SERVICE_NAME% AppDirectory "%OPC_ROOT%"
nssm set %SERVICE_NAME% AppStdout "%LOGS_DIR%\service-stdout.log"
nssm set %SERVICE_NAME% AppStderr "%LOGS_DIR%\service-stderr.log"
nssm set %SERVICE_NAME% AppRotateFiles 1
nssm set %SERVICE_NAME% AppRotateBytes 5242880

nssm set %SERVICE_NAME% AppExit Default Restart
nssm set %SERVICE_NAME% AppRestartDelay 5000

nssm set %SERVICE_NAME% Start SERVICE_AUTO_START

echo %SERVICE_NAME% configured.
echo   Working dir: %OPC_ROOT%
echo   Logs: %LOGS_DIR%
echo   Start: nssm start %SERVICE_NAME%

endlocal
