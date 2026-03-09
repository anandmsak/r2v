// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveElections } from "../../api/electionApi";
import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ActiveElectionsPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getActiveElections()
      .then((r) => setElections(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <Navbar />
      <div style={s.container}>
        <div style={s.hero}>
          <span style={s.badge}>VOTER PORTAL</span>
          <h1 style={s.title}>Active Elections</h1>
          <p style={s.sub}>
            Cast your vote securely. Every ballot is anonymous and tamper-proof.
          </p>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : elections.length === 0 ? (
          <div style={s.empty}>
            <div style={s.emptyIcon}>🗳️</div>
            <p style={s.emptyText}>No active elections right now.</p>
            <p style={s.emptySub}>Contact your election administrator.</p>
          </div>
        ) : (
          <div style={s.grid2}>
            {elections.map((e) => (
              <div key={e.id} style={s.card}>
                <div style={s.cardTop}>
                  <span style={s.liveDot} />
                  <span style={s.liveText}>LIVE</span>
                </div>
                <h2 style={s.cardTitle}>{e.title}</h2>
                {e.description && <p style={s.cardDesc}>{e.description}</p>}
                <button
                  style={s.voteBtn}
                  onClick={() => navigate(`/voter/ballot/${e.id}`)}
                >
                  Cast Your Vote →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'DM Mono', monospace",
    position: "relative",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "48px 24px",
    position: "relative",
    zIndex: 1,
  },
  hero: { marginBottom: "40px" },
  badge: {
    display: "inline-block",
    fontSize: "0.62rem",
    color: "#4ade80",
    letterSpacing: "0.15em",
    border: "1px solid #1a3a1a",
    borderRadius: "4px",
    padding: "3px 10px",
    background: "#0a1a0a",
    marginBottom: "14px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: "-0.03em",
  },
  sub: { fontSize: "0.82rem", color: "#555", margin: 0 },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyIcon: { fontSize: "2.5rem", marginBottom: "16px" },
  emptyText: { color: "#888", fontSize: "1rem", margin: "0 0 6px" },
  emptySub: { color: "#444", fontSize: "0.78rem", margin: 0 },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
    gap: "16px",
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    padding: "28px",
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
  },
  liveText: { fontSize: "0.6rem", color: "#4ade80", letterSpacing: "0.15em" },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
  },
  cardDesc: {
    fontSize: "0.78rem",
    color: "#555",
    margin: "0 0 20px",
    lineHeight: "1.5",
  },
  voteBtn: {
    background: "#4ade80",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontSize: "0.85rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
    width: "100%",
  },
};
