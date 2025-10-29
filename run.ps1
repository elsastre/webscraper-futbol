param([switch]$FreshDriver)

$ErrorActionPreference = "Stop"
if ($PSScriptRoot) { Set-Location $PSScriptRoot } else { Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path) }

chcp 65001 > $null
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

Write-Host "==> ScriptRoot: $PSScriptRoot" -ForegroundColor DarkGray
Write-Host "==> PWD       : $(Get-Location)" -ForegroundColor DarkGray

$venv = Join-Path (Get-Location) ".venv"
if (-not (Test-Path (Join-Path $venv "Scripts\Activate.ps1"))) { py -3 -m venv $venv }
& (Join-Path $venv "Scripts\Activate.ps1")

python -m pip install -U pip wheel setuptools | Out-Null

if (Test-Path ".\requirements.txt") {
  Write-Host "==> Instalando requirements.txt" -ForegroundColor Cyan
  pip install -r requirements.txt
} else {
  Write-Host "==> Instalando dependencias mínimas" -ForegroundColor Cyan
  pip install selenium webdriver-manager beautifulsoup4 requests html5lib
}

if (-not (Test-Path ".\pyproject.toml") -and -not (Test-Path ".\setup.py")) {
  Throw "No se encontró pyproject.toml ni setup.py en: $(Get-Location)"
}
pip install -e . | Out-Null

if ($FreshDriver) {
  Write-Host "==> Limpiando cache de WebDriver" -ForegroundColor Yellow
  Remove-Item "$HOME\.wdm" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "==> Ejecutando scraper" -ForegroundColor Cyan
python -m webscraper_futbol

Write-Host "==> Archivos en /data" -ForegroundColor Green
if (Test-Path .\data) {
  Get-ChildItem .\data | Format-Table Name,Length,LastWriteTime
  if (Test-Path .\data\standings_uruguay.csv) {
    Write-Host "==> Preview UTF-8" -ForegroundColor Green
    Get-Content .\data\standings_uruguay.csv -Encoding utf8 -Head 10
  }
} else {
  Write-Warning "No se creó la carpeta data/. Revisa la salida anterior."
}
