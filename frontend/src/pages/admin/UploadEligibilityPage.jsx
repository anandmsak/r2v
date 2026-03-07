// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { addEligibleVoter, uploadEligibilityCSV } from "../../api/adminApi";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function UploadEligibilityPage({ election }) {
  const [regNum, setRegNum]   = useState("");
  const [adding, setAdding]   = useState(false);
  const [msg, setMsg]         = useState("");
  const [error, setError]     = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [csvMsg, setCsvMsg]   = useState("");
  const [csvErr, setCsvErr]   = useState("");

  async function addOne(e) {
    e.preventDefault();
    if (!regNum.trim()) return;
    setAdding(true); setError(""); setMsg("");
    try {
      await addEligibleVoter(election.id, regNum.trim().toUpperCase());
      setMsg(`${regNum.toUpperCase()} enrolled successfully.`);
      setRegNum("");
    } catch (e) { setError(e.message); }
    finally { setAdding(false); }
  }

  async function uploadCSV(e) {
    e.preventDefault();
    if (!csvFile) return;
    setUploading(true); setCsvErr(""); setCsvMsg("");
    try {
      const res = await uploadEligibilityCSV(election.id, csvFile);
      setCsvMsg(`Enrolled ${res.data.enrolled || "?"} voters from CSV.`);
      setCsvFile(null);
    } catch (e) { setCsvErr(e.message); }
    finally { setUploading(false); }
  }

  return (
    <div style={s.root}>
      {/* Single voter */}
      <form onSubmit={addOne} style={s.form}>
        <h3 style={s.formTitle}>Enroll Single Voter</h3>
        <input style={s.input} placeholder="Register Number (e.g. CS2023001)" value={regNum} onChange={e => setRegNum(e.target.value)} />
        <ErrorMessage message={error} />
        {msg && <p style={s.success}>{msg}</p>}
        <button style={s.btn} type="submit" disabled={adding}>{adding ? "Enrolling…" : "+ Enroll Voter"}</button>
      </form>

      {/* CSV upload */}
      <form onSubmit={uploadCSV} style={s.form}>
        <h3 style={s.formTitle}>Bulk Upload via CSV</h3>
        <p style={s.hint}>CSV should have a column named <strong style={{ color: "#ccc" }}>register_number</strong> (one per row).</p>
        <input type="file" accept=".csv" style={s.fileInput} onChange={e => setCsvFile(e.target.files[0])} />
        <ErrorMessage message={csvErr} />
        {csvMsg && <p style={s.success}>{csvMsg}</p>}
        <button style={s.btn} type="submit" disabled={uploading || !csvFile}>{uploading ? "Uploading…" : "Upload CSV"}</button>
      </form>
    </div>
  );
}

const s = {
  root: { display: "flex", flexDirection: "column", gap: "20px" },
  form: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "10px" },
  formTitle: { fontSize: "0.72rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "11px 14px", fontSize: "0.85rem", fontFamily: "inherit", outline: "none" },
  fileInput: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#888", padding: "10px 14px", fontSize: "0.82rem", fontFamily: "inherit" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "11px", fontSize: "0.85rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  hint: { fontSize: "0.75rem", color: "#555", margin: 0 },
  success: { color: "#4ade80", fontSize: "0.78rem", margin: 0 },
};
