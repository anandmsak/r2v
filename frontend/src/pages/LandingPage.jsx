// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/LandingPage.jsx
// Route: /  (public)
// This is the first screen — user chooses Student or Admin portal.
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function LandingPage() {
  const { auth, ready } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect straight to their portal
  useEffect(() => {
    if (!ready) return;
    if (!auth) return;
    if (auth.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (auth.role === "auditor")
      navigate("/auditor/verify", { replace: true });
    else navigate("/voter/elections", { replace: true });
  }, [auth, ready]);

  return (
    <div style={s.root}>
      <div style={s.gridBg} />

      <div style={s.container}>
        {/* Logo */}
        <div style={s.logoRow}>
          <div style={s.logoDot} />
          <span style={s.logoText}>R2V</span>
        </div>

        {/* Hero */}
        <div style={s.hero}>
          <h1 style={s.title}>Right to Vote</h1>
          <p style={s.sub}>
            Tamper-proof · Anonymous · Cryptographically verified
          </p>
        </div>

        {/* Portal cards */}
        <div style={s.cards}>
          {/* Student */}
          <button style={s.card} onClick={() => navigate("/login/student")}>
            <div style={s.cardIcon}>🎓</div>
            <p style={s.cardTitle}>Student Portal</p>
            <p style={s.cardDesc}>
              Cast your vote in active elections securely.
            </p>
            <span style={s.cardArrow}>Enter →</span>
          </button>

          {/* Admin */}
          <button
            style={{ ...s.card, ...s.cardAdmin }}
            onClick={() => navigate("/login/admin")}
          >
            <div style={s.cardIcon}>⚙️</div>
            <p style={s.cardTitle}>Admin Portal</p>
            <p style={s.cardDesc}>
              Manage elections, candidates, and audit logs.
            </p>
            <span style={{ ...s.cardArrow, color: "#facc15" }}>Enter →</span>
          </button>
        </div>

        <p style={s.footer}>© 2026 Anandha Krishnan P — R2V Platform</p>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', monospace",
    position: "relative",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "600px",
    padding: "40px 24px",
    textAlign: "center",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "40px",
  },
  logoDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 10px #4ade80",
  },
  logoText: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.2em",
  },
  hero: { marginBottom: "48px" },
  title: {
    fontSize: "2.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 12px",
    letterSpacing: "-0.04em",
  },
  sub: { fontSize: "0.78rem", color: "#444", letterSpacing: "0.05em" },
  cards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "40px",
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "16px",
    padding: "32px 20px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "'DM Mono', monospace",
    transition: "border-color 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  cardAdmin: { borderColor: "#2a2500" },
  cardIcon: { fontSize: "1.6rem", marginBottom: "4px" },
  cardTitle: { fontSize: "1rem", fontWeight: "700", color: "#fff", margin: 0 },
  cardDesc: {
    fontSize: "0.72rem",
    color: "#555",
    margin: 0,
    lineHeight: "1.5",
  },
  cardArrow: {
    fontSize: "0.8rem",
    color: "#4ade80",
    marginTop: "8px",
    fontWeight: "700",
  },
  footer: { fontSize: "0.65rem", color: "#2a2a2a" },
};
