import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

const VIEWS = {
  STANDINGS: "standings",
  TEAMS: "teams",
  RANKING: "ranking",
  ATTACKS: "attacks",
  SEARCH: "search",
};

// Mapea nombre del equipo → ruta de logo en /public/logos
const TEAM_LOGOS = {
  "Nacional": "/logos/nacional.png",
  "Peñarol": "/logos/penarol.png",
  "Liverpool": "/logos/liverpool.png",
  "Juventud de Las Piedras": "/logos/juventud-las-piedras.png",
  "Defensor": "/logos/defensor.png",
  "Boston River": "/logos/boston-river.png",
  "Racing": "/logos/racing.png",
  "Torque": "/logos/torque.png",
  "Cerro Largo": "/logos/cerro-largo.png",
  "Cerro": "/logos/cerro.png",
  "Danubio": "/logos/danubio.png",
  "Progreso": "/logos/progreso.png",
  "Plaza Colonia": "/logos/plaza-colonia.png",
  "Wanderers": "/logos/wanderers.png",
  "Miramar Misiones": "/logos/miramar-misiones.png",
  "River Plate": "/logos/river-plate.png",
};

async function callApi(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`);
  }
  return res.json();
}

function App() {
  const [activeView, setActiveView] = useState(VIEWS.STANDINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rawRows, setRawRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [topAttacks, setTopAttacks] = useState(5);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // ---------- STANDINGS (tabla cruda) ----------

  async function loadStandings(refresh = false) {
    try {
      setLoading(true);
      setError("");

      const endpoint = refresh ? "/standings/refresh" : "/standings";
      const data = await callApi(endpoint);
      setRawRows(data.rows || []);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo cargar la tabla de posiciones. ¿Está levantada la API en el puerto 8000?"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStandings(false);
  }, []);

  // ---------- TEAMS (equipos con stats) ----------

  async function loadTeams() {
    try {
      setLoading(true);
      setError("");
      const data = await callApi("/torneo/equipos");
      setTeams(data.equipos || []);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar los equipos. Asegurate de haber refrescado standings primero."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- RANKING POR PUNTOS ----------

  async function loadRanking() {
    try {
      setLoading(true);
      setError("");
      const data = await callApi("/torneo/ranking");
      setRanking(data.equipos || []);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo cargar el ranking. Asegurate de haber refrescado standings primero."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- MEJORES ATAQUES ----------

  async function loadAttacks() {
    try {
      setLoading(true);
      setError("");
      const top = Number(topAttacks) > 0 ? Number(topAttacks) : 5;
      const data = await callApi(`/torneo/mejores-ataques?top=${top}`);
      setAttacks(data.equipos || []);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar los mejores ataques. Asegurate de haber refrescado standings primero."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- BUSCAR EQUIPO ----------

  async function performSearch(e) {
    if (e) {
      e.preventDefault();
    }

    const q = searchQuery.trim();
    if (!q) {
      setSearchResult(null);
      setError("");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/torneo/equipos/buscar?nombre=${encodeURIComponent(q)}`
      );

      if (res.status === 404) {
        setSearchResult(null);
        setError(`No se encontró ningún equipo que coincida con "${q}".`);
        return;
      }

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.error(err);
      setError(
        "Ocurrió un error al buscar el equipo. Verifica que la API esté corriendo."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------- Cambios de vista ----------

  function handleChangeView(view) {
    setActiveView(view);

    if (view === VIEWS.TEAMS && teams.length === 0) {
      loadTeams();
    } else if (view === VIEWS.RANKING && ranking.length === 0) {
      loadRanking();
    } else if (view === VIEWS.ATTACKS && attacks.length === 0) {
      loadAttacks();
    }
  }

  const hasStandings = rawRows && rawRows.length > 0;

  // ---------- Render helpers ----------

  function renderStandingsTable() {
    if (!hasStandings) {
      return (
        <p style={{ color: "#9ca3af" }}>
          No hay datos todavía. Probá con{" "}
          <strong>"Refrescar standings desde FBref"</strong>.
        </p>
      );
    }

    const headers = rawRows[0];
    const body = rawRows.slice(1);

    // Columna "Squad" (nombre del equipo)
    const squadColIndex = headers.findIndex((h) =>
      h.toString().toLowerCase().includes("squad")
    );

    return (
      <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "700px",
            background: "#020617",
          }}
        >
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} style={thStyle}>
                  {idx === squadColIndex ? "Equipo" : header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, i) => (
              <tr key={i} style={trStyle}>
                {row.map((cell, j) => (
                  <td key={j} style={tdStyle}>
                    {j === squadColIndex ? (
                      <TeamName name={cell} />
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderTeamsTable(data) {
    if (!data || data.length === 0) {
      return (
        <p style={{ color: "#9ca3af" }}>
          No hay datos de equipos. Refrescá los standings primero.
        </p>
      );
    }

    return (
      <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "600px",
            background: "#020617",
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Equipo</th>
              <th style={thStyle}>PJ</th>
              <th style={thStyle}>G</th>
              <th style={thStyle}>E</th>
              <th style={thStyle}>P</th>
              <th style={thStyle}>GF</th>
              <th style={thStyle}>GA</th>
              <th style={thStyle}>DG</th>
              <th style={thStyle}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {data.map((team, idx) => (
              <tr key={idx} style={trStyle}>
                <td style={tdStyle}>
                  <TeamName name={team.name} />
                </td>
                <td style={tdStyle}>{team.mp}</td>
                <td style={tdStyle}>{team.w}</td>
                <td style={tdStyle}>{team.d}</td>
                <td style={tdStyle}>{team.l}</td>
                <td style={tdStyle}>{team.gf}</td>
                <td style={tdStyle}>{team.ga}</td>
                <td style={tdStyle}>{team.gd}</td>
                <td style={tdStyle}>{team.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function renderSearchResult() {
    if (!searchResult) {
      return null;
    }

    const team = searchResult;

    return (
      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          borderRadius: "0.75rem",
          border: "1px solid #1f2937",
          background: "#020617",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <TeamName name={team.name} size="lg" />
          <div>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "0.15rem",
              }}
            >
              {team.name}
            </h3>
            {(team.nickname || team.stadium) && (
              <p
                style={{
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                  marginBottom: "0.15rem",
                }}
              >
                {team.nickname && (
                  <>
                    Apodo: <strong>{team.nickname}</strong>
                  </>
                )}
                {team.nickname && team.stadium && " · "}
                {team.stadium && (
                  <>
                    Estadio: <strong>{team.stadium}</strong>
                  </>
                )}
              </p>
            )}
            <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
              Resumen de temporada (según standings actuales):
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
            gap: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
          <div>Partidos: {team.mp}</div>
          <div>G: {team.w}</div>
          <div>E: {team.d}</div>
          <div>P: {team.l}</div>
          <div>GF: {team.gf}</div>
          <div>GA: {team.ga}</div>
          <div>DG: {team.gd}</div>
          <div>Puntos: {team.pts}</div>
        </div>
      </div>
    );
  }

  // ---------- Render principal ----------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "100%",
          margin: "0 auto",
          padding: "1.75rem 2rem",
        }}
      >
        <header style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}
          >
            AUF Analyzer – Panel interactivo
          </h1>
          <p style={{ color: "#9ca3af", maxWidth: "40rem" }}>
            Esta interfaz usa tu API FastAPI encima del scraper de FBref y los
            servicios de análisis para explorar la Primera División Uruguaya.
          </p>
        </header>

        {/* Barra de acciones generales */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <button
            onClick={() => loadStandings(false)}
            disabled={loading}
            style={pillButtonStyle}
          >
            🔄 Cargar standings desde CSV
          </button>

          <button
            onClick={() => loadStandings(true)}
            disabled={loading}
            style={pillButtonStyle}
          >
            🌐 Refrescar standings desde FBref
          </button>
        </div>

        {/* Tabs / vistas */}
        <nav
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <TabButton
            label="Tabla cruda"
            active={activeView === VIEWS.STANDINGS}
            onClick={() => handleChangeView(VIEWS.STANDINGS)}
          />
          <TabButton
            label="Equipos con stats"
            active={activeView === VIEWS.TEAMS}
            onClick={() => handleChangeView(VIEWS.TEAMS)}
          />
          <TabButton
            label="Ranking por puntos"
            active={activeView === VIEWS.RANKING}
            onClick={() => handleChangeView(VIEWS.RANKING)}
          />
          <TabButton
            label="Mejores ataques"
            active={activeView === VIEWS.ATTACKS}
            onClick={() => handleChangeView(VIEWS.ATTACKS)}
          />
          <TabButton
            label="Buscar equipo"
            active={activeView === VIEWS.SEARCH}
            onClick={() => handleChangeView(VIEWS.SEARCH)}
          />
        </nav>

        {loading && (
          <p style={{ marginBottom: "0.75rem" }}>Cargando datos de la API...</p>
        )}

        {error && (
          <p style={{ color: "#fb923c", marginBottom: "0.75rem" }}>{error}</p>
        )}

        {/* Contenido según vista activa */}
        <main>
          {activeView === VIEWS.STANDINGS && renderStandingsTable()}

          {activeView === VIEWS.TEAMS && renderTeamsTable(teams)}

          {activeView === VIEWS.RANKING && renderTeamsTable(ranking)}

          {activeView === VIEWS.ATTACKS && (
            <div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ fontSize: "0.9rem", marginRight: "0.5rem" }}>
                  Top ataques:
                </label>
                <input
                  type="number"
                  min="1"
                  value={topAttacks}
                  onChange={(e) => setTopAttacks(e.target.value)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    width: "80px",
                    marginRight: "0.5rem",
                  }}
                />
                <button
                  onClick={loadAttacks}
                  disabled={loading}
                  style={{
                    ...pillButtonStyle,
                    padding: "0.35rem 0.9rem",
                  }}
                >
                  Cargar
                </button>
              </div>
              {renderTeamsTable(attacks)}
            </div>
          )}

          {activeView === VIEWS.SEARCH && (
            <section>
              <form
                onSubmit={performSearch}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginBottom: "0.5rem",
                }}
              >
                <input
                  type="text"
                  placeholder="Nombre del equipo (Peñarol, Nacional, etc.)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: "1 1 220px",
                    padding: "0.4rem 0.6rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...pillButtonStyle,
                    padding: "0.4rem 0.9rem",
                  }}
                >
                  Buscar
                </button>
              </form>
              {renderSearchResult()}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

const pillButtonStyle = {
  padding: "0.5rem 1rem",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
};

const thStyle = {
  textAlign: "left",
  padding: "0.5rem",
  borderBottom: "1px solid #1f2937",
  background: "#020617",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const tdStyle = {
  padding: "0.5rem",
  fontSize: "0.9rem",
  whiteSpace: "nowrap",
};

const trStyle = {
  borderBottom: "1px solid #111827",
};

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.4rem 0.9rem",
        borderRadius: "999px",
        border: "1px solid",
        borderColor: active ? "#e5e7eb" : "#4b5563",
        background: active ? "#e5e7eb" : "transparent",
        color: active ? "#020617" : "#e5e7eb",
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// Componente para mostrar nombre + logo / inicial
function TeamName({ name, size = "md" }) {
  const logoSrc = TEAM_LOGOS[name];
  const circleSize = size === "lg" ? 40 : 28;
  const fontSize = size === "lg" ? "1rem" : "0.85rem";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={name}
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: "999px",
            objectFit: "cover",
            border: "1px solid #1f2937",
            background: "#020617",
          }}
        />
      ) : (
        <div
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: "999px",
            border: "1px solid #1f2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize,
            fontWeight: 600,
            background:
              "radial-gradient(circle at 30% 20%, #1f2937, #020617 70%)",
          }}
        >
          {name.charAt(0)}
        </div>
      )}
      <span>{name}</span>
    </div>
  );
}

export default App;
