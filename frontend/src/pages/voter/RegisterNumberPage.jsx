// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOtp } from "../../api/authApi";

// ── Adjust this regex to match your college register number format ──
// Default: 2-4 uppercase letters followed by 4+ digits  e.g. CS2023001
//const REGISTER_NUMBER_REGEX = /^[A-Z]{2,4}\d{4,}$/;

export default function RegisterNumberPage() {
  const [regNum, setRegNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function friendlyError(raw) {
    const msg = (raw || "").toLowerCase();
    if (
      msg.includes("no user found") ||
      msg.includes("not found") ||
      msg.includes("not registered") ||
      msg.includes("user not found") ||
      msg.includes("does not exist")
    )
      return "No account found for this register number. Contact your election admin.";
    if (msg.includes("locked") || msg.includes("too many"))
      return "Account locked due to too many failed attempts. Try again in 15 minutes.";
    if (msg.includes("network") || msg.includes("failed to fetch"))
      return "Cannot reach server. Check your connection and try again.";
    return raw || "Something went wrong. Please try again.";
  }

  async function submit(e) {
    e.preventDefault();
    const val = regNum.trim().toUpperCase();
    if (!val) return;
    if (val.length < 3) {
      setError("Please enter your full register number.");
      return;
    }

    // ── Client-side format validation — blocks obviously wrong inputs ──

    setLoading(true);
    setError("");
    try {
      await requestOtp(val);
      navigate("/verify-otp", { state: { register_number: val } });
    } catch (e) {
      setError(friendlyError(e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoDot} />
          <span style={s.logoText}>R2V</span>
        </div>
        <h1 style={s.title}>Right to Vote</h1>
        <p style={s.subtitle}>Secure college elections platform</p>
        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Register Number</label>
          <input
            style={s.input}
            placeholder="e.g. CS2023001"
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
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Sending OTP…" : "Send OTP →"}
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
    padding: "48px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    zIndex: 1,
  },
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
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.15em",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px",
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
  },
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
  },
  errorIcon: { flexShrink: 0, fontSize: "0.9rem" },
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
  },
  footer: {
    textAlign: "center",
    color: "#2a2a2a",
    fontSize: "0.68rem",
    marginTop: "32px",
    marginBottom: 0,
  },
};
