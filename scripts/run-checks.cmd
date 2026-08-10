@echo off
setlocal
cd /d "%~dp0.."
set "LOG=%~dp0run-checks.log"
echo Running checks... > "%LOG%"
echo Working dir: %CD% >> "%LOG%"
echo. >> "%LOG%"

echo === npm install ===
echo === npm install === >> "%LOG%"
call npm install >> "%LOG%" 2>&1
set "E1=%ERRORLEVEL%"
echo exit:%E1% >> "%LOG%"
echo. >> "%LOG%"
if not "%E1%"=="0" goto fail

echo === npm test ===
echo === npm test === >> "%LOG%"
call npm test >> "%LOG%" 2>&1
set "E2=%ERRORLEVEL%"
echo exit:%E2% >> "%LOG%"
echo. >> "%LOG%"
if not "%E2%"=="0" goto fail

echo === tsc app ===
echo === tsc app === >> "%LOG%"
call npx tsc -b --pretty false >> "%LOG%" 2>&1
set "E3=%ERRORLEVEL%"
echo exit:%E3% >> "%LOG%"
echo. >> "%LOG%"
if not "%E3%"=="0" goto fail

echo === tsc electron ===
echo === tsc electron === >> "%LOG%"
call npx tsc -p tsconfig.electron.json --pretty false >> "%LOG%" 2>&1
set "E4=%ERRORLEVEL%"
echo exit:%E4% >> "%LOG%"
echo. >> "%LOG%"
if not "%E4%"=="0" goto fail

echo === ALL OK === >> "%LOG%"
echo ALL OK
echo Log: %LOG%
exit /b 0

:fail
echo === FAILED === >> "%LOG%"
echo FAILED - see %LOG%
exit /b 1
