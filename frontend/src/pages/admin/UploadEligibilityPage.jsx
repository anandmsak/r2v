// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/admin/UploadEligibilityPage.jsx
import { useState } from "react";
import { addEligibleVoter, uploadEligibilityCSV } from "../../api/adminApi";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function UploadEligibilityPage({ election }) {
  // Single add
  const [regNum, setRegNum] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [addErr, setAddErr] = useState("");

  // CSV upload
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadErr, setUploadErr] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    if (!regNum.trim()) return;
    setAdding(true);
    setAddMsg("");
    setAddErr("");
    try {
      await addEligibleVoter(election.id, regNum.trim().toUpperCase());
      setAddMsg(`${regNum.trim().toUpperCase()} added as eligible voter.`);
      setRegNum("");
    } catch (err) {
      setAddErr(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    setUploadErr("");
    try {
      const res = await uploadEligibilityCSV(election.id, file);
      setUploadMsg(
        res.data?.message ||
          `CSV uploaded. ${res.data?.added ?? ""} voters added.`,
      );
      setFile(null);
      // Reset file input visually
      const input = document.getElementById("csv-input");
      if (input) input.value = "";
    } catch (err) {
      setUploadErr(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={s.root}>
      {/* ── Single Voter ── */}
      <div style={s.panel}>
        <h3 style={s.panelTitle}>Add Single Voter</h3>
        <p style={s.panelSub}>
          Enter a register number to mark one student as eligible.
        </p>
        <form onSubmit={handleAdd} style={s.form}>
          <input
            style={s.input}
            placeholder="e.g. CS2023004"
            value={regNum}
            onChange={(e) => {
              setRegNum(e.target.value);
              setAddMsg("");
              setAddErr("");
            }}
            disabled={adding}
          />
          <ErrorMessage message={addErr} />
          {addMsg && <p style={s.success}>{addMsg}</p>}
          <button
            style={s.btn}
            type="submit"
            disabled={adding || !regNum.trim()}
          >
            {adding ? "Adding…" : "+ Add Voter"}
          </button>
        </form>
      </div>

      {/* ── CSV Upload ── */}
      <div style={s.panel}>
        <h3 style={s.panelTitle}>Bulk Upload via CSV</h3>
        <p style={s.panelSub}>
          Upload a CSV file with one register number per line. The first column
          is used; header row is optional.
        </p>
        <div style={s.csvFormat}>
          <span style={s.csvLabel}>Expected format:</span>
          <code style={s.csvCode}>
            CS2023001{"\n"}CS2023002{"\n"}CS2023003
          </code>
        </div>
        <form onSubmit={handleUpload} style={s.form}>
          <input
            id="csv-input"
            style={s.fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setUploadMsg("");
              setUploadErr("");
            }}
            disabled={uploading}
          />
          {file && (
            <p style={s.fileName}>
              📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <ErrorMessage message={uploadErr} />
          {uploadMsg && <p style={s.success}>{uploadMsg}</p>}
          <button style={s.btn} type="submit" disabled={uploading || !file}>
            {uploading ? "Uploading…" : "Upload CSV →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  panel: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "10px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  panelTitle: {
    fontSize: "0.72rem",
    color: "#666",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: 0,
  },
  panelSub: {
    fontSize: "0.75rem",
    color: "#444",
    margin: 0,
    lineHeight: "1.6",
  },
  csvFormat: {
    background: "#0a0a0a",
    border: "1px solid #1e1e1e",
    borderRadius: "6px",
    padding: "10px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  csvLabel: { fontSize: "0.62rem", color: "#444", letterSpacing: "0.08em" },
  csvCode: {
    fontSize: "0.78rem",
    color: "#4ade80",
    fontFamily: "inherit",
    whiteSpace: "pre",
  },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  input: {
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#fff",
    padding: "11px 14px",
    fontSize: "0.88rem",
    fontFamily: "inherit",
    outline: "none",
  },
  fileInput: {
    background: "#0a0a0a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#aaa",
    padding: "10px 14px",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  fileName: {
    fontSize: "0.72rem",
    color: "#555",
    margin: 0,
  },
  btn: {
    background: "#4ade80",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "11px",
    fontSize: "0.85rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  success: { color: "#4ade80", fontSize: "0.78rem", margin: 0 },
};
