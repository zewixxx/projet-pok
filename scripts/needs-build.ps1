# Code de sortie 1 = il faut (re)construire l'application, 0 = à jour.
$root = Split-Path -Parent $PSScriptRoot
$targets = @(
  Join-Path $root "dist\index.html"
  Join-Path $root "electron-dist\main.js"
)
foreach ($t in $targets) { if (-not (Test-Path $t)) { exit 1 } }

$oldest = ($targets | ForEach-Object { (Get-Item $_).LastWriteTime } | Sort-Object | Select-Object -First 1)

$sources = @()
foreach ($dir in @("src", "electron")) {
  $p = Join-Path $root $dir
  if (Test-Path $p) {
    $sources += Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue
  }
}
foreach ($f in @("index.html", "package.json", "vite.config.ts")) {
  $p = Join-Path $root $f
  if (Test-Path $p) { $sources += Get-Item $p }
}

$newest = $sources | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($newest -and $newest.LastWriteTime -gt $oldest) { exit 1 }
exit 0
