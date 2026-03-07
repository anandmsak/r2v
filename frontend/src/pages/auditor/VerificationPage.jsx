// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { verifyReceipt, verifyChain } from "../../api/ballotApi";
import Navbar from "../../components/common/Navbar";

export default function VerificationPage() {
  const [receiptId, setReceiptId]   = useState("");
  const [electionId, setElectionId] = useState("");
  const [receiptRes, setReceiptRes] = useState(null);
  const [chainRes, setChainRes]     = useState(null);
  const [rLoading, setRLoading]     = useState(false);
  const [cLoading, setCLoading]     = useState(false);
  const [rErr, setRErr]             = useState("");
  const [cErr, setCErr]             = useState("");

  async function checkReceipt(e) {
    e.preventDefault();
    if (!receiptId.trim()) return;
    setRLoading(true); setRErr(""); setReceiptRes(null);
    try { const r = await verifyReceipt(receiptId.trim()); setReceiptRes(r.data); }
    catch (e) { setRErr(e.message); }
    finally { setRLoading(false); }
  }

  async function checkChain(e) {
    e.preventDefault();
    if (!electionId.trim()) return;
    setCLoading(true); setCErr(""); setChainRes(null);
    try { const r = await verifyChain(electionId.trim()); setChainRes(r.data); }
    catch (e) { setCErr(e.message); }
    finally { setCLoading(false); }
  }

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <Navbar />
      <div style={s.container}>
        <span style={s.badge}>VERIFICATION</span>
        <h1 style={s.title}>Audit & Verify</h1>
        <p style={s.sub}>Independently verify vote receipts and chain integrity.</p>

        <div style={s.grid2}>
          {/* Receipt verify */}
          <div style={s.panel}>
            <h2 style={s.panelTitle}>Verify Receipt</h2>
            <p style={s.panelSub}>Check if a specific vote receipt exists and is unaltered.</p>
            <form onSubmit={checkReceipt} style={s.form}>
              <input style={s.input} placeholder="Receipt UUID" value={receiptId} onChange={e => setReceiptId(e.target.value)} />
              {rErr && <p style={s.err}>{rErr}</p>}
              <button style={s.btn} type="submit" disabled={rLoading}>{rLoading ? "Checking…" : "Verify Receipt"}</button>
            </form>
            {receiptRes && (
              <div style={{ ...s.resultBox, borderColor: receiptRes.hash_valid ? "#4ade80" : "#f87171", background: receiptRes.hash_valid ? "#0d1a0d" : "#1a0d0d" }}>
                <p style={{ ...s.resultStatus, color: receiptRes.hash_valid ? "#4ade80" : "#f87171" }}>
                  {receiptRes.hash_valid ? "✓ Valid" : "✕ Invalid"}
                </p>
                <p style={s.resultMsg}>{receiptRes.message}</p>
                <p style={s.resultMeta}>Sequence #{receiptRes.sequence} · {new Date(receiptRes.cast_at).toLocaleString()}</p>
                <p style={s.hashText}>{receiptRes.current_hash}</p>
              </div>
            )}
          </div>

          {/* Chain verify */}
          <div style={s.panel}>
            <h2 style={s.panelTitle}>Verify Ballot Chain</h2>
            <p style={s.panelSub}>Validate the entire ballot chain for an election.</p>
            <form onSubmit={checkChain} style={s.form}>
              <input style={s.input} placeholder="Election UUID" value={electionId} onChange={e => setElectionId(e.target.value)} />
              {cErr && <p style={s.err}>{cErr}</p>}
              <button style={s.btn} type="submit" disabled={cLoading}>{cLoading ? "Verifying…" : "Verify Chain"}</button>
            </form>
            {chainRes && (
              <div style={{ ...s.resultBox, borderColor: chainRes.chain_valid ? "#4ade80" : "#f87171", background: chainRes.chain_valid ? "#0d1a0d" : "#1a0d0d" }}>
                <p style={{ ...s.resultStatus, color: chainRes.chain_valid ? "#4ade80" : "#f87171" }}>
                  {chainRes.chain_valid ? "✓ Chain Valid" : "✕ Chain Broken"}
                </p>
                <p style={s.resultMeta}>{chainRes.total_ballots} ballots · {chainRes.mismatches} mismatches</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Mono', monospace", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  container: { maxWidth: "900px", margin: "0 auto", padding: "48px 24px 80px", position: "relative", zIndex: 1 },
  badge: { display: "inline-block", fontSize: "0.62rem", color: "#60a5fa", letterSpacing: "0.15em", border: "1px solid #1a2a4a", borderRadius: "4px", padding: "3px 10px", background: "#0a1020", marginBottom: "14px" },
  title: { fontSize: "2rem", fontWeight: "700", color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em" },
  sub: { fontSize: "0.82rem", color: "#555", margin: "0 0 40px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  panel: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" },
  panelTitle: { fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: 0 },
  panelSub: { fontSize: "0.75rem", color: "#555", margin: 0, lineHeight: "1.5" },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  input: { background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#fff", padding: "11px 14px", fontSize: "0.82rem", fontFamily: "inherit", outline: "none" },
  btn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "11px", fontSize: "0.82rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer" },
  err: { color: "#f87171", fontSize: "0.75rem", margin: 0 },
  resultBox: { border: "1px solid", borderRadius: "8px", padding: "16px" },
  resultStatus: { fontSize: "1rem", fontWeight: "700", margin: "0 0 4px" },
  resultMsg: { fontSize: "0.78rem", color: "#888", margin: "0 0 6px" },
  resultMeta: { fontSize: "0.72rem", color: "#555", margin: "0 0 8px" },
  hashText: { fontSize: "0.62rem", color: "#4ade80", wordBreak: "break-all", margin: 0 },
};
