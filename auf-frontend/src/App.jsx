import { useEffect, useState } from "react";

function App() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost:8000";

  async function loadStandings(refresh = false) {
    try {
      setLoading(true);
      setError("");

      const endpoint = refresh ? "/standings/refresh" : "/standings";
      const res = await fetch(`${API_BASE}${endpoint}`);

      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }

      const data = await res.json();
      setRows(data.rows || []);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la tabla. ¿Está levantada la API en el puerto 8000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStandings(false);
  }, []);

  const hasData = rows && rows.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#020617",
        color: "#e5e7eb",
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
          AUF Analyzer – Tabla de posiciones
        </h1>
        <p style={{ color: "#9ca3af", maxWidth: "40rem" }}>
          Frontend en React que consume la API FastAPI construida sobre tu
          backend de scraping de FBref.
        </p>
      </header>

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
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🔄 Cargar desde CSV
        </button>

        <button
          onClick={() => loadStandings(true)}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🌐 Refrescar desde FBref
        </button>
      </div>

      {loading && <p>Cargando datos de la API...</p>}

      {error && (
        <p style={{ color: "#fb923c", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {!loading && hasData && (
        <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "900px",
              background: "#020617",
            }}
          >
            <thead>
              <tr>
                {rows[0].map((header, idx) => (
                  <th
                    key={idx}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem",
                      borderBottom: "1px solid #1f2937",
                      background: "#020617",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #111827" }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "0.5rem",
                        fontSize: "0.9rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !hasData && !error && (
        <p style={{ color: "#9ca3af" }}>
          No hay datos todavía. Probá con{" "}
          <strong>“Refrescar desde FBref”</strong>.
        </p>
      )}
    </div>
  );
}

export default App;
