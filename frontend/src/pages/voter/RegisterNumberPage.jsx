// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestOtp } from "../../api/authApi";

export default function RegisterNumberPage() {
  const [regNum, setRegNum]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (!regNum.trim()) return;
    setLoading(true); setError("");
    try {
      await requestOtp(regNum.trim().toUpperCase());
      navigate("/verify-otp", { state: { register_number: regNum.trim().toUpperCase() } });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
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
          <input style={s.input} placeholder="e.g. CS2023001" value={regNum} onChange={e => setRegNum(e.target.value)} autoFocus />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>{loading ? "Sending OTP…" : "Send OTP →"}</button>
        </form>
        <p style={s.footer}>© 2026 Anandha Krishnan P</p>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", position: "relative" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "48px", width: "100%", maxWidth: "420px", position: "relative", zIndex: 1, boxShadow: "0 0 60px rgba(74,222,128,0.05)" },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  logoDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80" },
  logoText: { fontSize: "1.2rem", fontWeight: "700", color: "#fff", letterSpacing: "0.15em" },
  title: { fontSize: "1.6rem", fontWeight: "700", color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.8rem", color: "#444", margin: "0 0 32px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontSize: "0.68rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "14px 16px", fontSize: "1rem", fontFamily: "inherit", outline: "none" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "0.9rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer", marginTop: "6px" },
  error: { color: "#f87171", fontSize: "0.78rem", margin: 0 },
  footer: { textAlign: "center", color: "#2a2a2a", fontSize: "0.68rem", marginTop: "32px", marginBottom: 0 },
};
