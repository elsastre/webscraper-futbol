from __future__ import annotations

from pathlib import Path
import csv

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from webscraper_futbol.scrapers.fbref_scraper import get_table
from auf_analyzer.services import (
    CSV_STANDINGS,
    get_team_table,
    buscar_equipo_por_nombre,
    ranking_equipos_por_puntos,
    mejores_ataques,
    top_scorers,
)

API_TITLE = "AUF Analyzer API"
URL = "https://fbref.com/en/comps/45/table/Primera-Division-Uruguay-Stats"

DATA_DIR = Path("data")

app = FastAPI(title=API_TITLE)

# CORS para que el frontend pueda llamar a la API sin drama
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # si querés, después limitás a http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_rows_from_soup(soup):
    """
    Extrae encabezados y filas de la tabla HTML de FBref.
    """
    table = soup.find("table")
    if table is None:
        return []

    headers = [th.get_text(strip=True) for th in table.select("thead tr th")]
    rows: list[list[str]] = []
    if headers:
        rows.append(headers)

    for tr in table.select("tbody tr"):
        cells = [c.get_text(strip=True) for c in tr.select("th,td")]
        if cells:
            rows.append(cells)

    return rows


def refresh_standings():
    """
    Ejecuta el scraper, arma la tabla completa y la guarda en CSV_STANDINGS.
    Devuelve la matriz de filas crudas.
    """
    soup = get_table(URL)
    rows = _build_rows_from_soup(soup)

    if not rows:
        raise RuntimeError("No se pudo encontrar la tabla de posiciones en FBref.")

    DATA_DIR.mkdir(exist_ok=True)
    with CSV_STANDINGS.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    return rows


def load_standings():
    """
    Lee el CSV local (si existe) y devuelve la matriz de filas crudas.
    """
    if not CSV_STANDINGS.exists():
        return []

    with CSV_STANDINGS.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        return list(reader)


@app.get("/standings/refresh")
def api_refresh_standings():
    """
    Refresca desde FBref, guarda CSV y devuelve filas crudas de la tabla.
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


@app.get("/torneo/equipos")
def api_list_equipos():
    """
    Devuelve la tabla de equipos con stats básicas
    (mp, w, d, l, gf, ga, pts, gd).
    """
    try:
        equipos = get_team_table()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "count": len(equipos),
        "equipos": equipos,
    }


@app.get("/torneo/equipos/buscar")
def api_buscar_equipo(nombre: str):
    """
    Busca un equipo por nombre (búsqueda parcial, case-insensitive).
    """
    try:
        equipo = buscar_equipo_por_nombre(nombre)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if equipo is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró ningún equipo que coincida con '{nombre}'.",
        )

    return equipo


@app.get("/torneo/ranking")
def api_ranking_equipos():
    """
    Devuelve todos los equipos ordenados por puntos
    (y diferencia de goles como desempate).
    """
    try:
        ranking = ranking_equipos_por_puntos()
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "count": len(ranking),
        "equipos": ranking,
    }


@app.get("/torneo/mejores-ataques")
def api_mejores_ataques(top: int = 5):
    """
    Devuelve los equipos con más goles a favor.
    """
    if top <= 0:
        top = 5

    try:
        equipos = mejores_ataques(top=top)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "count": len(equipos),
        "equipos": equipos,
    }


@app.get("/goleadores")
def api_goleadores(top: int = Query(20, ge=1, le=100)):
    """
    Devuelve la tabla de goleadores, calculada a partir del CSV de standings.
    También genera/actualiza backend/data/top_scorers_uruguay.csv.
    """
    try:
        return top_scorers(limit=top)
    except Exception as exc:  # pragma: no cover - defensa básica
        raise HTTPException(
            status_code=500,
            detail=f"No se pudieron calcular los goleadores: {exc}",
<<<<<<< HEAD
        )# --- Healthcheck para despliegue ---
try:
    from fastapi import FastAPI
except Exception:
    pass

try:
    app  # noqa: F821 (usar la misma instancia existente)
    @app.get("/health")
    def health():
        return {"status": "ok"}
except NameError:
    # Si no hay "app" global (caso muy raro), creamos una mínima para cumplir health
    tmp_app = FastAPI()
    @tmp_app.get("/health")
    def health_tmp():
        return {"status": "ok"}
=======
        )
>>>>>>> 1a7c7bb0fb656dee7058c4459df5e93d9a056725
