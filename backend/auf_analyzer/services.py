from __future__ import annotations

from pathlib import Path
import csv
from typing import Any, Optional

# Ruta centralizada del CSV generado por el scraper
CSV_STANDINGS = Path("data") / "standings_uruguay.csv"

# Metadatos de clubes (apodo + estadio).
# Si en el CSV aparece con ese nombre, se enriquecen con estos datos.
TEAM_META: dict[str, dict[str, str]] = {
    "Nacional": {
        "nickname": "Bolso",
        "stadium": "Gran Parque Central",
    },
    "Peñarol": {
        "nickname": "Carbonero",
        "stadium": "Campeón del Siglo",
    },
    "Liverpool": {
        "nickname": "Negriazul",
        "stadium": "Belvedere",
    },
    "Juventud de Las Piedras": {
        "nickname": "Juve",
        "stadium": "Parque Artigas Las Piedras",
    },
    "Defensor": {
        "nickname": "Violeta",
        "stadium": "Luis Franzini",
    },
    "Boston River": {
        "nickname": "Boston",
        "stadium": "Parque Artigas",
    },
    "Racing": {
        "nickname": "Cervecero",
        "stadium": "Osvaldo Roberto",
    },
    "Torque": {
        "nickname": "Ciudadano",
        "stadium": "Parque Viera (localía compartida)",
    },
    "Cerro Largo": {
        "nickname": "Arachán",
        "stadium": "Arquitecto Antonio Ubilla",
    },
    "Cerro": {
        "nickname": "Villero",
        "stadium": "Luis Tróccoli",
    },
    "Danubio": {
        "nickname": "La Franja",
        "stadium": "Jardines del Hipódromo",
    },
    "Progreso": {
        "nickname": "Gaucho del Pantanoso",
        "stadium": "Abraham Paladino",
    },
    "Plaza Colonia": {
        "nickname": "Patablanca",
        "stadium": "Profesor Alberto Suppici",
    },
    "Wanderers": {
        "nickname": "Bohemio",
        "stadium": "Parque Viera",
    },
    "Miramar Misiones": {
        "nickname": "Cebrita",
        "stadium": "Méndez Piana",
    },
    "River Plate": {
        "nickname": "Darsenero",
        "stadium": "Parque Saroldi",
    },
}


def _load_rows(csv_path: Path | None = None) -> tuple[list[str], list[list[str]]]:
    """
    Lee el CSV y devuelve (headers, filas).
    """
    if csv_path is None:
        csv_path = CSV_STANDINGS

    if not csv_path.exists():
        raise FileNotFoundError(
            f"No se encontró el archivo de standings en {csv_path}. "
            "Ejecutá primero /standings/refresh desde la API."
        )

    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        raise ValueError("El CSV de standings está vacío.")

    headers = rows[0]
    data_rows = rows[1:]
    return headers, data_rows


def _build_index(headers: list[str]) -> dict[str, int]:
    """
    Construye un índice de columnas buscando nombres típicos
    (FBref, español, etc.).
    """
    norm_headers = [h.strip().lower() for h in headers]

    def find_column(posibles: list[str]) -> Optional[int]:
        for name in posibles:
            name_norm = name.strip().lower()
            if name_norm in norm_headers:
                return norm_headers.index(name_norm)
        return None

    mapping: dict[str, list[str]] = {
        "team": ["squad", "equipo", "team"],
        "mp": ["mp", "pj", "matches"],
        "w": ["w", "g", "wins"],
        "d": ["d", "e", "draws"],
        "l": ["l", "p", "losses"],
        "gf": ["gf", "f", "goles a favor"],
        "ga": ["ga", "a", "goles en contra"],
        "pts": ["pts", "puntos"],
    }

    index: dict[str, int] = {}
    for key, posibles in mapping.items():
        col_idx = find_column(posibles)
        if col_idx is None:
            raise KeyError(
                f"No se encontró ninguna columna {posibles} en los encabezados del CSV: {headers}"
            )
        index[key] = col_idx

    return index


def _to_int(value: str) -> int:
    try:
        return int(value.replace(",", ""))
    except (TypeError, ValueError, AttributeError):
        return 0


def get_team_table(csv_path: Path | None = None) -> list[dict[str, Any]]:
    """
    Devuelve una lista de dicts con stats básicas por equipo.

    Cada elemento tiene la forma:
    {
        "name": str,
        "mp": int,
        "w": int,
        "d": int,
        "l": int,
        "gf": int,
        "ga": int,
        "pts": int,
        "gd": int,
        "nickname": str | None,
        "stadium": str | None,
    }
    """
    headers, rows = _load_rows(csv_path)
    idx = _build_index(headers)

    equipos: list[dict[str, Any]] = []

    for row in rows:
        if not row:
            continue

        nombre = row[idx["team"]].strip()
        if not nombre:
            continue

        mp = _to_int(row[idx["mp"]])
        w = _to_int(row[idx["w"]])
        d = _to_int(row[idx["d"]])
        l = _to_int(row[idx["l"]])
        gf = _to_int(row[idx["gf"]])
        ga = _to_int(row[idx["ga"]])
        pts = _to_int(row[idx["pts"]])

        meta = TEAM_META.get(nombre, {})

        equipos.append(
            {
                "name": nombre,
                "mp": mp,
                "w": w,
                "d": d,
                "l": l,
                "gf": gf,
                "ga": ga,
                "pts": pts,
                "gd": gf - ga,
                "nickname": meta.get("nickname"),
                "stadium": meta.get("stadium"),
            }
        )

    return equipos


def buscar_equipo_por_nombre(nombre: str, csv_path: Path | None = None) -> Optional[dict[str, Any]]:
    """
    Devuelve el primer equipo cuyo nombre contenga el texto buscado (case-insensitive).
    """
    nombre_norm = nombre.strip().lower()
    if not nombre_norm:
        return None

    equipos = get_team_table(csv_path)
    for equipo in equipos:
        if nombre_norm in equipo["name"].lower():
            return equipo

    return None


def ranking_equipos_por_puntos(csv_path: Path | None = None) -> list[dict[str, Any]]:
    """
    Devuelve todos los equipos ordenados por puntos (y diferencia de goles como desempate).
    """
    equipos = get_team_table(csv_path)
    return sorted(
        equipos,
        key=lambda e: (e["pts"], e["gd"], e["gf"]),
        reverse=True,
    )


def mejores_ataques(top: int = 5, csv_path: Path | None = None) -> list[dict[str, Any]]:
    """
    Devuelve los equipos con más goles a favor.
    """
    equipos = get_team_table(csv_path)
    equipos_ordenados = sorted(equipos, key=lambda e: e["gf"], reverse=True)
    return equipos_ordenados[:max(top, 1)]
