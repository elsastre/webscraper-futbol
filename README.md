# AUF Analyzer

Proyecto de análisis de la Primera División Uruguaya (AUF) construido como obligatorio:

- **Scraper** en Python sobre FBref para obtener la tabla de posiciones.
- **API** en FastAPI que expone standings y filtros (ranking, mejores ataques, búsqueda por equipo, etc.).
- **Frontend** en React (Vite) con un panel interactivo que consume la API.

## Estructura del proyecto

- \ackend/\
  - Código Python del scraper (\webscraper_futbol\).
  - Módulo de análisis \uf_analyzer\.
  - API FastAPI en \pi.py\.
- \uf-frontend/\
  - Proyecto React (Vite) con la interfaz de AUF Analyzer.
- \un_dev.ps1\
  - Script de ayuda en PowerShell para configurar y levantar todo.
- \README.md\
  - Este archivo.

## Requisitos

- **Python** 3.10 o superior en el \PATH\  
  Verificar con:
  \\\powershell
  python --version
  \\\
- **Node.js** 18+ y npm
  \\\powershell
  node -v
  npm -v
  \\\
- **PowerShell** (Windows)

## Puesta en marcha (para quien descarga el ZIP)

1. **Descargar o clonar** el repositorio.
2. **Abrir PowerShell** en la carpeta raíz del proyecto (donde están backend, auf-frontend y run_dev.ps1).
3. **Ejecutar una sola vez la instalación inicial**:
   \\\powershell
   .\run_dev.ps1 -Install
   \\\
   Esto va a:
   - Crear y configurar el entorno virtual de Python en \ackend\.venv\.
   - Instalar dependencias del scraper + FastAPI + Uvicorn.
   - Instalar dependencias de React en \uf-frontend\node_modules\.
4. **Para levantar el sistema** (API + frontend), ejecutar:
   \\\powershell
   .\run_dev.ps1
   \\\
   Se abrirán dos ventanas de PowerShell:
   - Backend (FastAPI) en http://127.0.0.1:8000/docs
   - Frontend (React) en http://localhost:5173/

## Uso de la aplicación

1. **Abrir el navegador** en http://localhost:5173/ 
2. **Usar el panel interactivo**:
   - **Tabla cruda**: tabla de standings tal cual FBref.
   - **Equipos con stats**: PJ, G, E, P, GF, GA, DG, puntos.
   - **Ranking por puntos**.
   - **Mejores ataques** (top N por goles a favor).
   - **Buscar equipo** (logo, apodo, estadio, stats).
3. **Nota**: Si no hay datos todavía, usar primero el botón "Refrescar standings desde FBref" para que el scraper genere el CSV.

## Notas de implementación (para docentes / revisión técnica)

- El scraper obtiene y guarda los datos en \data/standings_uruguay.csv\.
- El módulo \uf_analyzer.services\:
  - Lee el CSV y normaliza columnas.
  - Enriquecen los equipos con apodo (nickname) y estadio (stadium).
  - Proveen funciones de filtros: ranking, mejores ataques, búsqueda por equipo.
- La API FastAPI (\ackend/api.py\) expone, entre otros:
  - \GET /standings\
  - \GET /standings/refresh\
  - \GET /torneo/equipos\
  - \GET /torneo/equipos/buscar?nombre=...\
  - \GET /torneo/ranking\
  - \GET /torneo/mejores-ataques?top=N\
- El frontend en React consume esos endpoints y muestra:
  - Tablas enriquecidas con logos.
  - Vista de búsqueda con nombre, apodo, estadio y stats del club.

Este README está pensado para que cualquier persona que reciba el ZIP (docente, corrector, compañero) pueda levantar el proyecto completo únicamente con PowerShell, Python y Node instalados.
