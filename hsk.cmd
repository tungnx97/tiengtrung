@echo off
setlocal
rem Prefer the same Node runtime used to install this project's dependencies.
set "HSK_NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%HSK_NODE_EXE%" goto node_found
set "HSK_NODE_EXE="
for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined HSK_NODE_EXE set "HSK_NODE_EXE=%%N"
if defined HSK_NODE_EXE goto node_found
echo Node.js was not found. Install Node.js 22.13 or newer, then reopen PowerShell.
exit /b 1

:node_found
"%HSK_NODE_EXE%" -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major>22||(major===22&&minor>=13)?0:1)"
if errorlevel 1 (
  echo This project requires Node.js 22.13 or newer.
  exit /b 1
)
rem Make Node available to framework child processes for this command only.
for %%N in ("%HSK_NODE_EXE%") do set "PATH=%%~dpN;%PATH%"
pushd "%~dp0"
if /i "%~1"=="stop-db" goto stop_database
if not "%~1"=="" goto unknown_command
if not exist "node_modules\next\dist\bin\next" (
  echo Project dependencies are missing. Install them with npm ci first.
  popd
  exit /b 1
)
"%HSK_NODE_EXE%" scripts\local-postgres.mjs start
if errorlevel 1 (
  popd
  exit /b 1
)
echo Opening the web server at http://127.0.0.1:5173
echo Press Ctrl+C to stop the web server.
"%HSK_NODE_EXE%" node_modules\next\dist\bin\next dev --hostname 127.0.0.1 --port 5173 --webpack
set "HSK_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %HSK_EXIT_CODE%

:stop_database
"%HSK_NODE_EXE%" scripts\local-postgres.mjs stop
set "HSK_EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %HSK_EXIT_CODE%

:unknown_command
echo Usage: hsk.cmd [stop-db]
popd
exit /b 1
