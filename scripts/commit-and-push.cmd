@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

set "REPO_URL=https://github.com/zewixxx/projet-pok.git"

echo === Commit + push (sans GitHub CLI) ===
echo Repo cible: %REPO_URL%
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo ERREUR: git introuvable. Installe Git for Windows.
  exit /b 1
)

echo --- Staging code ---
git add -- ^
  .gitignore ^
  package.json ^
  package-lock.json ^
  tsconfig.json ^
  tsconfig.app.json ^
  tsconfig.node.json ^
  tsconfig.electron.json ^
  vite.config.ts ^
  vite-plugin-import-history.ts ^
  src ^
  electron ^
  scripts\run-checks.cmd ^
  scripts\push-to-github.cmd ^
  scripts\commit-and-push.cmd

git reset HEAD -- scripts\run-checks.log 2>nul

echo.
git status -sb
echo.

git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Refactor SOLID cleanup, fix EV scoring and typecheck issues"
  if errorlevel 1 (
    echo Commit echoue.
    exit /b 1
  )
) else (
  echo Rien de nouveau a committer.
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  echo Ajout remote origin...
  git remote add origin %REPO_URL%
) else (
  echo.
  echo Remote origin deja present:
  git remote -v
)

echo.
echo --- Push vers main ---
git branch -M main
git push -u origin main
if errorlevel 1 (
  echo.
  echo PUSH ECHOUE. Causes frequentes:
  echo  1. Le repo n'existe pas encore sur GitHub
  echo     - Va sur https://github.com/new
  echo     - Nom: projet-pok
  echo     - Prive
  echo     - SANS cocher "Add README"
  echo     - Create repository
  echo  2. Pas connecte a GitHub: Windows demandera login / Personal Access Token
  echo.
  exit /b 1
)

echo.
echo === OK ===
echo https://github.com/zewixxx/projet-pok
exit /b 0
