// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/admin/AdminPortalPage.jsx
// Route: /login/admin
// Two modes: LOGIN (check DB → OTP) or CREATE ACCOUNT (register new admin with invite key)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkUser, requestOtp, adminRegister } from "../../api/authApi";

export default function AdminPortalPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "create"

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.card}>
        <button style={s.back} onClick={() => navigate("/")}>← Back</button>

        <div style={s.logoRow}>
          <div style={s.logoDot} />
          <span style={s.logoText}>R2V</span>
          <span style={s.portalBadge}>ADMIN</span>
        </div>

        {/* Mode toggle */}
        <div style={s.tabRow}>
          <button
            style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }}
            onClick={() => setMode("login")}
          >Login</button>
          <button
            style={{ ...s.tab, ...(mode === "create" ? s.tabActive : {}) }}
            onClick={() => setMode("create")}
          >Create Account</button>
        </div>

        {mode === "login"  && <AdminLoginForm navigate={navigate} />}
        {mode === "create" && <AdminCreateForm navigate={navigate} />}
      </div>
    </div>
  );
}

// ── Admin Login (same check-user → OTP flow) ──────────────────────────────
function AdminLoginForm({ navigate }) {
  const [regNum, setRegNum]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function submit(e) {
    e.preventDefault();
    const val = regNum.trim().toUpperCase();
    if (!val) return;
    setLoading(true); setError("");
    try {
      // Check user exists AND is admin role
      const res = await checkUser(val);
      if (res.data.role !== "admin") {
        setError("This account does not have admin access. Use the Student portal.");
        return;
      }
      await requestOtp(val);
      navigate("/verify-otp", { state: { register_number: val } });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("no account") || msg.includes("not found"))
        setError("No admin account found for this register number.");
      else if (msg.includes("locked") || msg.includes("too many"))
        setError("Account locked. Try again in 15 minutes.");
      else
        setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} style={s.form}>
      <label style={s.label}>Register Number</label>
      <input
        style={s.input} placeholder="e.g. ADMIN001"
        value={regNum}
        onChange={e => { setRegNum(e.target.value); setError(""); }}
        autoFocus
      />
      {error && <div style={s.errorBox}><span>⚠</span><span>{error}</span></div>}
      <button style={s.btnYellow} type="submit" disabled={loading || !regNum.trim()}>
        {loading ? "Checking…" : "Send OTP →"}
      </button>
    </form>
  );
}

// ── Admin Create Account ───────────────────────────────────────────────────
function AdminCreateForm({ navigate }) {
  const [form, setForm] = useState({
    register_number: "", full_name: "", email: "", department: "", invite_key: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  function update(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    const { register_number, full_name, email, invite_key } = form;
    if (!register_number.trim() || !full_name.trim() || !email.trim() || !invite_key.trim()) {
      setError("All fields except Department are required.");
      return;
    }
    setLoading(true); setError("");
    try {
      await adminRegister({
        register_number: register_number.trim().toUpperCase(),
        full_name:       full_name.trim(),
        email:           email.trim().toLowerCase(),
        department:      form.department.trim() || null,
        invite_key:      invite_key.trim(),
      });
      setSuccess(`Admin account created for ${register_number.toUpperCase()}. You can now login.`);
      setForm({ register_number: "", full_name: "", email: "", department: "", invite_key: "" });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("invalid invite key") || msg.includes("forbidden"))
        setError("Invalid invite key. Contact your system administrator.");
      else if (msg.includes("already registered") || msg.includes("conflict"))
        setError("This register number or email is already registered.");
      else
        setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={s.successBox}>
        <p style={s.successIcon}>✓</p>
        <p style={s.successMsg}>{success}</p>
        <button style={s.btnYellow} onClick={() => setSuccess("")}>← Back to Login</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={s.form}>
      <div style={s.infoNote}>
        ⚠ Admin registration requires an <strong style={{ color: "#facc15" }}>invite key</strong> from your system administrator.
      </div>

      <label style={s.label}>Register Number *</label>
      <input style={s.input} placeholder="e.g. ADMIN002"
        value={form.register_number} onChange={e => update("register_number", e.target.value)} />

      <label style={s.label}>Full Name *</label>
      <input style={s.input} placeholder="e.g. Dr. Rajesh Kumar"
        value={form.full_name} onChange={e => update("full_name", e.target.value)} />

      <label style={s.label}>Email Address *</label>
      <input style={s.input} type="email" placeholder="e.g. admin@college.edu"
        value={form.email} onChange={e => update("email", e.target.value)} />

      <label style={s.label}>Department</label>
      <input style={s.input} placeholder="e.g. Computer Science (optional)"
        value={form.department} onChange={e => update("department", e.target.value)} />

      <label style={s.label}>Invite Key *</label>
      <input style={s.input} type="password" placeholder="Secret key from system admin"
        value={form.invite_key} onChange={e => update("invite_key", e.target.value)} />

      {error && <div style={s.errorBox}><span>⚠</span><span>{error}</span></div>}

      <button style={s.btnYellow} type="submit" disabled={loading}>
        {loading ? "Creating Account…" : "Create Admin Account →"}
      </button>
    </form>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace", position: "relative" },
  grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(250,204,21,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(250,204,21,0.02) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  card: { background: "#111", border: "1px solid #2a2500", borderRadius: "16px", padding: "40px 48px", width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 },
  back: { background: "transparent", border: "none", color: "#444", fontSize: "0.78rem", fontFamily: "inherit", cursor: "pointer", padding: 0, marginBottom: "24px", display: "block" },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  logoDot: { width: "10px", height: "10px", borderRadius: "50%", background: "#facc15" },
  logoText: { fontSize: "1.1rem", fontWeight: "700", color: "#fff", letterSpacing: "0.15em" },
  portalBadge: { fontSize: "0.58rem", color: "#facc15", border: "1px solid #3a2a00", background: "#1a1400", borderRadius: "4px", padding: "2px 8px", letterSpacing: "0.1em" },
  tabRow: { display: "flex", gap: "0", marginBottom: "28px", background: "#0a0a0a", borderRadius: "8px", padding: "4px", border: "1px solid #1e1e1e" },
  tab: { flex: 1, background: "transparent", border: "none", color: "#555", padding: "10px", fontSize: "0.78rem", fontFamily: "'DM Mono', monospace", cursor: "pointer", borderRadius: "6px" },
  tabActive: { background: "#1a1400", color: "#facc15", fontWeight: "700" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "0.68rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "4px" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "12px 14px", fontSize: "0.88rem", fontFamily: "inherit", outline: "none" },
  errorBox: { display: "flex", alignItems: "flex-start", gap: "10px", background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "12px 14px", color: "#f87171", fontSize: "0.78rem", lineHeight: "1.5" },
  btnYellow: { background: "#facc15", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "0.9rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer", marginTop: "6px" },
  infoNote: { background: "#1a1400", border: "1px solid #3a2a00", borderRadius: "8px", padding: "12px 14px", fontSize: "0.75rem", color: "#888", lineHeight: "1.5", marginBottom: "4px" },
  successBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px 0", textAlign: "center" },
  successIcon: { fontSize: "2rem", color: "#4ade80", margin: 0 },
  successMsg: { fontSize: "0.82rem", color: "#888", lineHeight: "1.6", margin: 0 },
};
