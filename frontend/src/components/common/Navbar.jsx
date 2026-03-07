// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useAuth } from "../../context/AuthContext";


export default function Navbar() {
  const { auth, logout } = useAuth();
  return (
    <nav style={s.nav}>
      <div style={s.left}>
        <div style={s.dot} />
        <span style={s.logo}>R2V</span>
        {auth?.role === "admin" && <span style={s.roleBadge}>ADMIN</span>}
        {auth?.role === "auditor" && <span style={{ ...s.roleBadge, color: "#60a5fa", borderColor: "#1a3060", background: "#0a1030" }}>AUDITOR</span>}
      </div>
      <div style={s.right}>
        {auth && <span style={s.name}>{auth.name}</span>}
        {auth && <button style={s.logoutBtn} onClick={logout}>Logout</button>}
      </div>
    </nav>
  );
}

const s = {
  nav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d", position: "sticky", top: 0, zIndex: 50 },
  left: { display: "flex", alignItems: "center", gap: "10px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" },
  logo: { fontSize: "1rem", fontWeight: "700", color: "#fff", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace" },
  roleBadge: { fontSize: "0.58rem", color: "#facc15", border: "1px solid #3a3000", background: "#1a1500", borderRadius: "4px", padding: "2px 8px", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" },
  right: { display: "flex", alignItems: "center", gap: "16px" },
  name: { fontSize: "0.78rem", color: "#555", fontFamily: "'DM Mono', monospace" },
  logoutBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: "6px", padding: "6px 14px", fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", cursor: "pointer" },
};
