from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import csv

from webscraper_futbol.scrapers.fbref_scraper import get_table

API_TITLE = "AUF Analyzer API"
URL = "https://fbref.com/en/comps/45/table/Primera-Division-Uruguay-Stats"

DATA_DIR = Path("data")
CSV_PATH = DATA_DIR / "standings_uruguay.csv"

app = FastAPI(title=API_TITLE)

# Habilitar CORS para que el frontend en React pueda llamar a la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # si después querés, limitás a http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_rows_from_soup(soup):
    """
    Arma una matriz [fila][columna] con:
    - primera fila = encabezados
    - resto = filas de equipos
    """
    table = soup.find("table")
    if table is None:
        return []

    # Encabezados
    headers = [th.get_text(strip=True) for th in table.select("thead tr th")]
    rows = []
    if headers:
        rows.append(headers)

    # Cuerpo
    for tr in table.select("tbody tr"):
        cells = [c.get_text(strip=True) for c in tr.select("th,td")]
        if cells:
            rows.append(cells)

    return rows


def refresh_standings():
    """
    Ejecuta el scraper, arma la tabla completa y la guarda en CSV.
    Devuelve la matriz de filas.
    """
    soup = get_table(URL)
    rows = _build_rows_from_soup(soup)

    if not rows:
        raise RuntimeError("No se pudo encontrar la tabla de posiciones en FBref.")

    DATA_DIR.mkdir(exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    return rows


def load_standings():
    """
    Lee el CSV local (si existe) y devuelve la matriz de filas.
    """
    if not CSV_PATH.exists():
        return []

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        return list(reader)


@app.get("/standings/refresh")
def api_refresh_standings():
    """
    Refresca desde FBref, guarda CSV y devuelve filas.
    """
    try:
        rows = refresh_standings()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "count": len(rows),
        "rows": rows,
        "source": "fbref",
    }


@app.get("/standings")
def api_get_standings():
    """
    Devuelve la tabla de posiciones tal como está en el CSV local.
    Si no existe, devuelve lista vacía.
    """
    rows = load_standings()
    return {
        "count": len(rows),
        "rows": rows,
        "source": "local_csv",
    }
