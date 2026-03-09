// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/voter/StudentLoginPage.jsx
// Route: /login/student
// Logic: check DB first → if found, send OTP and go to verify page
//        if not found, stay on this page and show error
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkUser, requestOtp } from "../../api/authApi";

export default function StudentLoginPage() {
  const [regNum, setRegNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    const val = regNum.trim().toUpperCase();
    if (!val) return;

    setLoading(true);
    setError("");

    try {
      // ── Step 1: Check if this register number exists in the database ──
      await checkUser(val);
      // If we reach here → user exists in DB

      // ── Step 2: Send OTP ──
      await requestOtp(val);

      // ── Step 3: Go to OTP verification page ──
      navigate("/verify-otp", { state: { register_number: val } });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (
        msg.includes("no account found") ||
        msg.includes("not found") ||
        err.message.includes("404")
      ) {
        setError(
          "No account found for this register number. Contact your election admin.",
        );
      } else if (msg.includes("locked") || msg.includes("too many")) {
        setError(
          "Account locked due to too many failed attempts. Try again in 15 minutes.",
        );
      } else if (msg.includes("network") || msg.includes("connection")) {
        setError("Network error. Please check your connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate("/")}>
          ← Back
        </button>
        <div style={s.logoRow}>
          <div style={s.logoDot} />
          <span style={s.logoText}>R2V</span>
          <span style={s.portalBadge}>STUDENT</span>
        </div>
        <h1 style={s.title}>Student Login</h1>
        <p style={s.subtitle}>Enter your register number to receive an OTP</p>

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Register Number</label>
          <input
            style={s.input}
            placeholder="e.g. CS2023001 or ADMIN001"
            value={regNum}
            onChange={(e) => {
              setRegNum(e.target.value);
              setError("");
            }}
            autoFocus
          />
          {error && (
            <div style={s.errorBox}>
              <span style={s.errorIcon}>⚠</span>
              <span>{error}</span>
            </div>
          )}
          <button
            style={s.btn}
            type="submit"
            disabled={loading || !regNum.trim()}
          >
            {loading ? "Checking…" : "Send OTP →"}
          </button>
        </form>

        <p style={s.footer}>© 2026 Anandha Krishnan P</p>
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
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "16px",
    padding: "40px 48px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    zIndex: 1,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)", // Subtle depth
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#444",
    fontSize: "0.78rem",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: 0,
    marginBottom: "24px",
    display: "block",
    transition: "color 0.2s ease", // Smooth hover
  },
  backHover: { color: "#4ade80" }, // Apply on hover if needed
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logoDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4ade80",
  },
  logoText: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.15em",
  },
  portalBadge: {
    fontSize: "0.58rem",
    color: "#4ade80",
    border: "1px solid #1a3a1a",
    background: "#0a1a0a",
    borderRadius: "4px",
    padding: "2px 8px",
    letterSpacing: "0.1em",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px",
    letterSpacing: "-0.02em", // Better kerning
  },
  subtitle: { fontSize: "0.78rem", color: "#555", margin: "0 0 28px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  label: {
    fontSize: "0.68rem",
    color: "#666",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  input: {
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#fff",
    padding: "14px 16px",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.2s ease", // Focus animation
  },
  inputFocus: { borderColor: "#4ade80" }, // Apply on focus
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    background: "#1a0a0a",
    border: "1px solid #3a1a1a",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#f87171",
    fontSize: "0.78rem",
    lineHeight: "1.5",
    animation: "fadeIn 0.3s ease", // Subtle entry
    opacity: 0.95, // Slight transparency for depth
  },
  errorIcon: {
    fontSize: "1rem",
    marginTop: "2px",
    flexShrink: 0,
  },
  btn: {
    background: "#4ade80",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "0.9rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "opacity 0.2s ease", // Disabled state
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  footer: {
    textAlign: "center",
    color: "#2a2a2a",
    fontSize: "0.68rem",
    marginTop: "32px",
    marginBottom: 0,
  },
};
