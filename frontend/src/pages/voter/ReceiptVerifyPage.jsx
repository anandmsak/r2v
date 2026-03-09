// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// New page: src/pages/voter/ReceiptVerifyPage.jsx
// Route: /voter/verify-receipt  (add to App.jsx under ProtectedRoute role="voter")
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyReceipt } from "../../api/ballotApi";
import Navbar from "../../components/common/Navbar";

export default function ReceiptVerifyPage() {
  const navigate = useNavigate();
  const [receiptId, setReceiptId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");

  async function verify(e) {
    e.preventDefault();
    const id = receiptId.trim();
    if (!id) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await verifyReceipt(id);
      setResult(res.data);
    } catch (e) {
      setError(e.message || "Verification failed. Check the receipt ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() { setReceiptId(""); setResult(null); setError(""); }

  const valid = result?.hash_valid;

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <Navbar />
      <div style={s.container}>
        {/* Header */}
        <div style={s.hero}>
          <button style={s.backLink} onClick={() => navigate("/voter/elections")}>← Elections</button>
          <span style={s.badge}>RECEIPT VERIFICATION</span>
          <h1 style={s.title}>Verify Your Vote</h1>
          <p style={s.sub}>
            Paste the Receipt ID from your ballot confirmation to check that your vote
            is intact and unaltered in the chain.
          </p>
        </div>

        {/* Input card */}
        <div style={s.card}>
          <form onSubmit={verify} style={s.form}>
            <label style={s.label}>Receipt ID</label>
            <input
              style={s.input}
              placeholder="e.g. 3f8a2c1d-0000-0000-0000-abc123456789"
              value={receiptId}
              onChange={e => setReceiptId(e.target.value)}
              autoFocus
              spellCheck={false}
            />
            {error && (
              <div style={s.errorBox}>
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}
            <button style={s.btn} type="submit" disabled={loading || !receiptId.trim()}>
              {loading ? "Verifying…" : "Verify Receipt →"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div style={{ ...s.resultCard, borderColor: valid ? "#4ade80" : "#f87171", background: valid ? "#0d1a0d" : "#1a0d0d" }}>
            <div style={s.resultHeader}>
              <div style={{ ...s.statusCircle, borderColor: valid ? "#4ade80" : "#f87171", color: valid ? "#4ade80" : "#f87171" }}>
                {valid ? "✓" : "✕"}
              </div>
              <div>
                <p style={{ ...s.statusTitle, color: valid ? "#4ade80" : "#f87171" }}>
                  {valid ? "Vote Verified — Intact" : "Verification Failed — Tampered"}
                </p>
                <p style={s.statusSub}>
                  {valid
                    ? "Your vote exists in the chain and has not been altered."
                    : "The stored hash does not match. This receipt may have been tampered with."}
                </p>
              </div>
            </div>

            <div style={s.fields}>
              <div style={s.field}>
                <span style={s.fieldLabel}>MESSAGE</span>
                <span style={s.fieldVal}>{result.message}</span>
              </div>
              {result.sequence !== undefined && (
                <div style={s.field}>
                  <span style={s.fieldLabel}>SEQUENCE</span>
                  <span style={s.fieldVal}>#{result.sequence}</span>
                </div>
              )}
              {result.cast_at && (
                <div style={s.field}>
                  <span style={s.fieldLabel}>CAST AT</span>
                  <span style={s.fieldVal}>{new Date(result.cast_at).toLocaleString()}</span>
                </div>
              )}
              {result.current_hash && (
                <div style={s.field}>
                  <span style={s.fieldLabel}>CHAIN HASH</span>
                  <span style={{ ...s.fieldVal, color: valid ? "#4ade80" : "#f87171", wordBreak: "break-all", fontSize: "0.68rem" }}>
                    {result.current_hash}
                  </span>
                </div>
              )}
            </div>

            <button style={s.resetBtn} onClick={reset}>Verify Another Receipt</button>
          </div>
        )}

        {/* Info box */}
        {!result && (
          <div style={s.infoBox}>
            <p style={s.infoTitle}>How receipt verification works</p>
            <p style={s.infoText}>
              When you cast your vote, a unique Receipt ID and chain hash are generated.
              Verification re-computes the hash from the stored ballot data and checks it
              matches — if it does, your vote is provably unaltered. Your identity is never
              linked to the receipt.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Mono', monospace", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  container: { maxWidth: "640px", margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 },
  hero: { marginBottom: "32px" },
  backLink: { background: "transparent", border: "none", color: "#555", fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer", padding: 0, marginBottom: "20px", display: "block" },
  badge: { display: "inline-block", fontSize: "0.62rem", color: "#4ade80", letterSpacing: "0.15em", border: "1px solid #1a3a1a", borderRadius: "4px", padding: "3px 10px", background: "#0a1a0a", marginBottom: "14px" },
  title: { fontSize: "1.8rem", fontWeight: "700", color: "#fff", margin: "0 0 10px", letterSpacing: "-0.03em" },
  sub: { fontSize: "0.8rem", color: "#555", lineHeight: "1.6", margin: 0 },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "28px", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  label: { fontSize: "0.68rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "14px 16px", fontSize: "0.82rem", fontFamily: "inherit", outline: "none" },
  errorBox: { display: "flex", gap: "10px", background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "12px 14px", color: "#f87171", fontSize: "0.78rem" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px", fontSize: "0.88rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  resultCard: { border: "1px solid", borderRadius: "12px", padding: "28px", marginBottom: "20px" },
  resultHeader: { display: "flex", gap: "20px", alignItems: "flex-start", marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #1a1a1a" },
  statusCircle: { width: "44px", height: "44px", borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 },
  statusTitle: { fontSize: "0.95rem", fontWeight: "700", margin: "0 0 6px" },
  statusSub: { fontSize: "0.75rem", color: "#888", margin: 0, lineHeight: "1.5" },
  fields: { display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  fieldLabel: { fontSize: "0.58rem", color: "#444", letterSpacing: "0.12em" },
  fieldVal: { fontSize: "0.82rem", color: "#ccc" },
  resetBtn: { background: "transparent", border: "1px solid #2a2a2a", color: "#666", borderRadius: "8px", padding: "10px 20px", fontSize: "0.8rem", fontFamily: "inherit", cursor: "pointer" },
  infoBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "20px 24px" },
  infoTitle: { fontSize: "0.72rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" },
  infoText: { fontSize: "0.78rem", color: "#444", lineHeight: "1.7", margin: 0 },
};
