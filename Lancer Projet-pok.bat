@echo off
setlocal
cd /d "%~dp0"
title Projet-pok

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est introuvable. Installe-le depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b 1
)

if not exist "node_modules\electron\dist\electron.exe" (
  echo Premier lancement : installation des dependances, cela peut prendre quelques minutes...
  call npm install
  if errorlevel 1 goto :erreur
)

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\needs-build.ps1"
if errorlevel 1 (
  echo Preparation de l'application ^(premier lancement ou code modifie^)...
  call npm run build
  if errorlevel 1 goto :erreur
  call npm run electron:compile
  if errorlevel 1 goto :erreur
)

start "" "node_modules\electron\dist\electron.exe" .
exit /b 0

:erreur
echo.
echo Une erreur est survenue pendant la preparation. Regarde les messages ci-dessus.
pause
exit /b 1
