// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/voter/ReceiptVerifyPage.jsx
// Route: /voter/verify-receipt
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyReceipt } from "../../api/ballotApi";
import Navbar from "../../components/common/Navbar";

export default function ReceiptVerifyPage() {
  const [receiptId, setReceiptId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    const id = receiptId.trim();
    if (!id) {
      setError("Please enter a Receipt ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await verifyReceipt(id);
      setResult({ found: true, ...res.data });
    } catch (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("not found") || msg.includes("404")) {
        setResult({ found: false });
      } else {
        setError(err.message || "Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <Navbar />
      <div style={s.container}>
        <button style={s.back} onClick={() => navigate("/voter/elections")}>
          ← Back to Elections
        </button>

        <span style={s.badge}>RECEIPT VERIFICATION</span>
        <h1 style={s.title}>Verify Your Vote</h1>
        <p style={s.sub}>
          Paste your Receipt ID below to confirm your vote is recorded in the
          tamper-proof chain.
        </p>

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>Receipt ID</label>
          <input
            style={s.input}
            placeholder="e.g. 98e29463-0c7d-427a-a76b-cc13802638e6"
            value={receiptId}
            onChange={(e) => {
              setReceiptId(e.target.value);
              setError("");
              setResult(null);
            }}
            autoFocus
            disabled={loading}
          />
          {error && (
            <div style={s.errorBox}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
          <button
            style={s.btn}
            type="submit"
            disabled={loading || !receiptId.trim()}
          >
            {loading ? "Verifying…" : "Verify Receipt →"}
          </button>
        </form>

        {/* Result */}
        {result &&
          (result.found === false ? (
            <div style={{ ...s.resultBox, ...s.resultFail }}>
              <div style={s.resultIcon}>✗</div>
              <p style={{ ...s.resultTitle, color: "#f87171" }}>
                Receipt Not Found
              </p>
              <p style={s.resultMsg}>
                No vote with this Receipt ID exists in the system. Please
                double-check the ID.
              </p>
            </div>
          ) : result.hash_valid === false ? (
            <div style={{ ...s.resultBox, borderColor: "#facc15" }}>
              <div style={{ ...s.resultIcon, color: "#facc15" }}>⚠</div>
              <p style={{ ...s.resultTitle, color: "#facc15" }}>
                Integrity Warning
              </p>
              <p style={s.resultMsg}>
                Receipt found but hash verification failed. Contact the election
                administrator immediately.
              </p>
            </div>
          ) : (
            <div style={{ ...s.resultBox, ...s.resultOk }}>
              <div style={{ ...s.resultIcon, color: "#4ade80" }}>✓</div>
              <p style={{ ...s.resultTitle, color: "#4ade80" }}>
                Vote Verified
              </p>
              <p style={s.resultMsg}>
                Your vote is recorded and intact in the tamper-proof chain.
              </p>
              <div style={s.metaGrid}>
                {result.sequence && (
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>SEQUENCE</span>
                    <span style={s.metaValue}>#{result.sequence}</span>
                  </div>
                )}
                {result.cast_at && (
                  <div style={s.metaItem}>
                    <span style={s.metaLabel}>CAST AT</span>
                    <span style={s.metaValue}>
                      {new Date(result.cast_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              {result.current_hash && (
                <div style={s.hashBox}>
                  <span style={s.metaLabel}>CHAIN HASH</span>
                  <div style={s.hash}>{result.current_hash}</div>
                </div>
              )}
              <p style={s.anonNote}>
                Your identity is never linked to this receipt.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'DM Mono', monospace",
    position: "relative",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    padding: "32px 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#444",
    fontSize: "0.78rem",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: 0,
    marginBottom: "28px",
    display: "block",
  },
  badge: {
    display: "inline-block",
    fontSize: "0.62rem",
    color: "#4ade80",
    letterSpacing: "0.15em",
    border: "1px solid #1a3a1a",
    borderRadius: "4px",
    padding: "3px 10px",
    background: "#0a1a0a",
    marginBottom: "14px",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
  },
  sub: {
    fontSize: "0.78rem",
    color: "#555",
    margin: "0 0 28px",
    lineHeight: "1.6",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
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
    fontSize: "0.82rem",
    fontFamily: "inherit",
    outline: "none",
  },
  errorBox: {
    display: "flex",
    gap: "10px",
    background: "#1a0a0a",
    border: "1px solid #3a1a1a",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#f87171",
    fontSize: "0.78rem",
    lineHeight: "1.5",
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
  },
  resultBox: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  resultOk: { border: "1px solid #1a3a1a", background: "#0a110a" },
  resultFail: { border: "1px solid #3a1a1a", background: "#110a0a" },
  resultIcon: { fontSize: "2rem", color: "#f87171", marginBottom: "12px" },
  resultTitle: { fontSize: "1rem", fontWeight: "700", margin: "0 0 8px" },
  resultMsg: {
    fontSize: "0.78rem",
    color: "#666",
    margin: "0 0 20px",
    lineHeight: "1.6",
  },
  metaGrid: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    marginBottom: "16px",
    textAlign: "center",
  },
  metaItem: { display: "flex", flexDirection: "column", gap: "4px" },
  metaLabel: {
    fontSize: "0.6rem",
    color: "#444",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  metaValue: { fontSize: "0.82rem", color: "#ccc" },
  hashBox: { textAlign: "left", marginBottom: "16px" },
  hash: {
    color: "#4ade80",
    fontSize: "0.72rem",
    wordBreak: "break-all",
    background: "#0a0a0a",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "6px",
  },
  anonNote: {
    fontSize: "0.7rem",
    color: "#333",
    borderTop: "1px solid #1a2a1a",
    paddingTop: "14px",
    marginTop: "8px",
  },
};
