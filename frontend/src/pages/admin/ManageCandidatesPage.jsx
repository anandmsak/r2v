// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { addCandidate } from "../../api/electionApi";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function ManageCandidatesPage({ election, candidates, onRefresh }) {
  const [name, setName]     = useState("");
  const [pos, setPos]       = useState("");
  const [desc, setDesc]     = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError]   = useState("");
  const [msg, setMsg]       = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true); setError(""); setMsg("");
    try {
      await addCandidate({ election_id: election.id, full_name: name, position: pos || null, description: desc || null, display_order: candidates.length });
      setName(""); setPos(""); setDesc("");
      setMsg("Candidate added.");
      onRefresh();
    } catch (e) { setError(e.message); }
    finally { setAdding(false); }
  }

  return (
    <div>
      {election.status === "draft" && (
        <form onSubmit={submit} style={s.form}>
          <h3 style={s.formTitle}>Add Candidate</h3>
          <input style={s.input} placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} required />
          <input style={s.input} placeholder="Position (e.g. President)" value={pos} onChange={e => setPos(e.target.value)} />
          <input style={s.input} placeholder="Short description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <ErrorMessage message={error} />
          {msg && <p style={s.success}>{msg}</p>}
          <button style={s.btn} type="submit" disabled={adding}>{adding ? "Adding…" : "+ Add Candidate"}</button>
        </form>
      )}
      <div style={s.list}>
        {candidates.length === 0 ? (
          <p style={s.empty}>No candidates added yet.</p>
        ) : candidates.map((c, i) => (
          <div key={c.id} style={s.item}>
            <span style={s.num}>{i + 1}</span>
            <div>
              <p style={s.cName}>{c.full_name}</p>
              {c.position && <p style={s.cPos}>{c.position}</p>}
              {c.description && <p style={s.cDesc}>{c.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  form: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "24px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  formTitle: { fontSize: "0.72rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "11px 14px", fontSize: "0.85rem", fontFamily: "inherit", outline: "none" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "11px", fontSize: "0.85rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  success: { color: "#4ade80", fontSize: "0.78rem", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  empty: { color: "#444", fontSize: "0.82rem" },
  item: { display: "flex", gap: "14px", alignItems: "flex-start", background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "14px 18px" },
  num: { fontSize: "0.72rem", color: "#333", width: "18px", flexShrink: 0, paddingTop: "2px" },
  cName: { fontSize: "0.9rem", fontWeight: "600", color: "#fff", margin: "0 0 3px" },
  cPos: { fontSize: "0.72rem", color: "#4ade80", margin: "0 0 3px", letterSpacing: "0.04em" },
  cDesc: { fontSize: "0.75rem", color: "#555", margin: 0 },
};
