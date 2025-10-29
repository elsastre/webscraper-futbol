param([switch]$FreshDriver)

# Forzar salida UTF-8 en la consola
chcp 65001 > $null
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

Write-Host "==> Activando/creando venv" -ForegroundColor Cyan
if (-not (Test-Path ".\.venv\Scripts\Activate")) { py -3 -m venv .venv }
.\.venv\Scripts\Activate

Write-Host "==> Instalando dependencias (si faltan)" -ForegroundColor Cyan
python -m pip install -U pip wheel setuptools | Out-Null
pip install -e . | Out-Null  # layout src/

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
