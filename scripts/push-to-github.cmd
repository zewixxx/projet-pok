@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo ========================================
echo  Projet-pok - commit + push GitHub
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo ERREUR: git introuvable. Installe Git for Windows.
  exit /b 1
)

where gh >nul 2>&1
if errorlevel 1 (
  echo ERREUR: GitHub CLI (gh) introuvable.
  echo Installe-le: https://cli.github.com/
  echo Puis: gh auth login
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo Tu n'es pas connecte a GitHub. Lancement de gh auth login...
  gh auth login
  if errorlevel 1 exit /b 1
)

echo.
echo --- Etat git ---
git status -sb
echo.

echo --- Staging ---
git add -A
git status -sb
echo.

git diff --cached --quiet
if errorlevel 1 (
  echo --- Commit ---
  git commit -m "Initial commit: Projet-pok app Electron + import Winamax + review"
  if errorlevel 1 (
    echo ERREUR: commit echoue.
    exit /b 1
  )
) else (
  echo Rien de nouveau a committer (working tree propre ou deja commite).
)

echo.
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo --- Creation du repo GitHub (PRIVE) ---
  echo Le repo sera prive car history/ contient des mains personnelles.
  gh repo create zewixxx/projet-pok --private --source=. --remote=origin --push
  if errorlevel 1 (
    echo.
    echo Si le nom est pris: gh repo create zewixxx/AUTRE-NOM --private --source=. --remote=origin --push
    exit /b 1
  )
) else (
  echo --- Remote origin deja configure ---
  git remote -v
  echo.
  echo --- Push ---
  git push -u origin HEAD
  if errorlevel 1 exit /b 1
)

echo.
echo ========================================
echo  OK - repo: https://github.com/zewixxx/projet-pok
echo ========================================
echo.
echo Sur l'autre PC:
echo   git clone https://github.com/zewixxx/projet-pok.git
echo   cd projet-pok
echo   npm install
echo   npm run electron:dev
echo.
exit /b 0
