// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllElections, createElection } from "../../api/electionApi";
import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function DashboardPage() {
  const [elections, setElections]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [newDesc, setNewDesc]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [createErr, setCreateErr]   = useState("");
  const navigate = useNavigate();

  function load() {
    getAllElections().then(r => setElections(r.data)).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true); setCreateErr("");
    try {
      await createElection({ title: newTitle.trim(), description: newDesc.trim() || null });
      setShowModal(false); setNewTitle(""); setNewDesc("");
      load();
    } catch (e) { setCreateErr(e.message); }
    finally { setCreating(false); }
  }

  const statusColor = { draft: "#555", scheduled: "#facc15", active: "#4ade80", completed: "#60a5fa", archived: "#333" };

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <Navbar />
      <div style={s.container}>
        <div style={s.hero}>
          <h1 style={s.title}>Election Dashboard</h1>
          <p style={s.sub}>Manage elections, candidates, and voter eligibility.</p>
        </div>

        <div style={s.statsRow}>
          {["draft","active","completed"].map(st => (
            <div key={st} style={s.statCard}>
              <span style={{ ...s.statNum, color: statusColor[st] }}>{elections.filter(e => e.status === st).length}</span>
              <span style={s.statLabel}>{st.toUpperCase()}</span>
            </div>
          ))}
          <button style={s.newBtn} onClick={() => setShowModal(true)}>+ New Election</button>
        </div>

        {loading ? <LoadingSpinner /> : elections.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>No elections yet.</p>
            <button style={s.newBtnLg} onClick={() => setShowModal(true)}>Create First Election →</button>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead><tr>{["Title","Status","Created",""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {elections.map(e => (
                  <tr key={e.id} style={s.tr}>
                    <td style={s.td}><span style={s.elTitle}>{e.title}</span></td>
                    <td style={s.td}><span style={{ ...s.statusBadge, color: statusColor[e.status] || "#555", borderColor: statusColor[e.status] || "#333" }}>{e.status.toUpperCase()}</span></td>
                    <td style={{ ...s.td, color: "#444", fontSize: "0.72rem" }}>{new Date(e.created_at).toLocaleDateString()}</td>
                    <td style={s.td}><button style={s.manageBtn} onClick={() => navigate(`/admin/election/${e.id}`)}>Manage →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>New Election</h2>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={s.form}>
              <label style={s.label}>Title *</label>
              <input style={s.input} placeholder="e.g. Student Union Election 2026" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus required />
              <label style={s.label}>Description</label>
              <textarea style={{ ...s.input, minHeight: "72px", resize: "vertical" }} placeholder="Optional…" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              {createErr && <p style={s.err}>{createErr}</p>}
              <div style={s.btnRow}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={s.greenBtn} disabled={creating}>{creating ? "Creating…" : "Create →"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Mono', monospace", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  container: { maxWidth: "1000px", margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 },
  hero: { marginBottom: "32px" },
  title: { fontSize: "1.8rem", fontWeight: "700", color: "#fff", margin: "0 0 6px", letterSpacing: "-0.03em" },
  sub: { fontSize: "0.8rem", color: "#555", margin: 0 },
  statsRow: { display: "flex", alignItems: "center", gap: "28px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "20px 24px", marginBottom: "20px" },
  statCard: { display: "flex", flexDirection: "column", gap: "4px" },
  statNum: { fontSize: "1.5rem", fontWeight: "700", letterSpacing: "-0.03em" },
  statLabel: { fontSize: "0.58rem", color: "#333", letterSpacing: "0.1em" },
  newBtn: { marginLeft: "auto", background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "0.82rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyText: { color: "#555", marginBottom: "20px" },
  newBtnLg: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px 28px", fontSize: "0.9rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  tableWrap: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: "0.6rem", color: "#333", letterSpacing: "0.1em", padding: "12px 20px", borderBottom: "1px solid #181818" },
  tr: { borderBottom: "1px solid #141414" },
  td: { padding: "14px 20px", fontSize: "0.85rem", color: "#bbb" },
  elTitle: { fontWeight: "600", color: "#fff" },
  statusBadge: { fontSize: "0.6rem", border: "1px solid", borderRadius: "4px", padding: "2px 8px", letterSpacing: "0.1em" },
  manageBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#777", borderRadius: "6px", padding: "5px 12px", fontSize: "0.75rem", fontFamily: "inherit", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#111", border: "1px solid #2a2a2a", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "480px" },
  modalHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  modalTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: 0 },
  closeBtn: { background: "transparent", border: "none", color: "#555", fontSize: "1rem", cursor: "pointer", fontFamily: "inherit" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  label: { fontSize: "0.68rem", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "12px 14px", fontSize: "0.88rem", fontFamily: "inherit", outline: "none" },
  err: { color: "#f87171", fontSize: "0.78rem", margin: 0 },
  btnRow: { display: "flex", gap: "10px", marginTop: "6px" },
  cancelBtn: { flex: 1, background: "transparent", border: "1px solid #2a2a2a", color: "#555", borderRadius: "8px", padding: "12px", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" },
  greenBtn: { flex: 2, background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "12px", fontSize: "0.82rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
};
