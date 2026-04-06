@echo off
setlocal

set "ROOT=%~dp0"

echo [SAIVO] Starting backend and whiteboard...
echo.

start "SAIVO Backend" cmd /k "cd /d "%ROOT%backend" && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000) else (python -m uvicorn main:app --reload --port 8000)"
start "SAIVO Whiteboard" cmd /k "cd /d "%ROOT%whiteboard" && npm run dev:room"

echo [SAIVO] Backend:   http://127.0.0.1:8000
echo [SAIVO] Whiteboard: http://127.0.0.1:3001
echo.
echo Close the opened terminal windows to stop services.

endlocal
