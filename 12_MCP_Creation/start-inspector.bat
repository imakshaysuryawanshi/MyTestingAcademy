@echo off
REM Start MCP Inspector for VWO Test Case Server
REM This batch file ensures proper execution on Windows

cd /d "W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation"

echo ==========================================
echo Starting MCP Inspector...echo ==========================================
echo.
echo If browser does not open automatically, manually visit:
echo   http://localhost:6274
echo.
echo Press Ctrl+C to stop.
echo.

REM Use full path to node and npx if needed, or rely on PATH
set DANGEROUSLY_OMIT_AUTH=true

cmd /c npx @modelcontextprotocol/inspector -- python mcp_server.py

pause
