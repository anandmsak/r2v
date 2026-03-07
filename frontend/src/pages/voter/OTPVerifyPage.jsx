// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

export default function OTPVerifyPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const register_number = location.state?.register_number || "";

  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!otp.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await verifyOtp(register_number, otp.trim());
      login(res.data);
      if (res.data.role === "admin")    navigate("/admin/dashboard");
      else if (res.data.role === "auditor") navigate("/auditor/verify");
      else navigate("/voter/elections");
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
        <h1 style={s.title}>Enter OTP</h1>
        <div style={s.infoBox}>
          OTP sent to email for <strong style={{ color: "#4ade80" }}>{register_number}</strong>
        </div>
        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>6-digit OTP</label>
          <input
            style={{ ...s.input, letterSpacing: "0.5em", fontSize: "1.6rem", textAlign: "center" }}
            type="text" maxLength={6} placeholder="——————"
            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
            autoFocus
          />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>{loading ? "Verifying…" : "Verify & Login →"}</button>
        </form>
        <button style={s.back} onClick={() => navigate("/")}>← Back</button>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", position: "relative" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "16px", padding: "48px", width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  logoDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#4ade80" },
  logoText: { fontSize: "1.2rem", fontWeight: "700", color: "#fff", letterSpacing: "0.15em" },
  title: { fontSize: "1.4rem", fontWeight: "700", color: "#fff", margin: "0 0 16px" },
  infoBox: { background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "10px 14px", fontSize: "0.78rem", color: "#666", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontSize: "0.68rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "14px 16px", fontFamily: "inherit", outline: "none" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "0.9rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  error: { color: "#f87171", fontSize: "0.78rem", margin: 0 },
  back: { background: "transparent", border: "none", color: "#444", fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer", marginTop: "16px", display: "block" },
};
