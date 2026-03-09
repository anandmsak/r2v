// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";

export default function ReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const receipt = location.state?.receipt;

  if (!receipt) {
    navigate("/voter/elections");
    return null;
  }

  function copy(text) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <Navbar />
      <div style={s.container}>
        <div style={s.checkCircle}>✓</div>
        <h1 style={s.title}>Vote Cast Successfully</h1>
        <p style={s.sub}>
          Your vote has been recorded in the tamper-proof chain.
        </p>

        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardLabel}>VOTE RECEIPT</span>
            <span style={s.seqBadge}>#{receipt.sequence}</span>
          </div>
          <div style={s.field}>
            <span style={s.fieldLabel}>Receipt ID</span>
            <div style={s.fieldRow}>
              <span style={s.mono}>{receipt.receipt_id}</span>
              <button
                style={s.copyBtn}
                onClick={() => copy(receipt.receipt_id)}
              >
                Copy
              </button>
            </div>
          </div>
          <div style={s.field}>
            <span style={s.fieldLabel}>Chain Hash</span>
            <span
              style={{
                ...s.mono,
                fontSize: "0.7rem",
                color: "#4ade80",
                wordBreak: "break-all",
                display: "block",
              }}
            >
              {receipt.current_hash}
            </span>
          </div>
          <div style={s.field}>
            <span style={s.fieldLabel}>Cast At</span>
            <span style={s.mono}>
              {new Date(receipt.cast_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={s.infoBox}>
          Save your Receipt ID. You can verify your vote remains intact anytime.
          Your identity is never linked to this receipt.
        </div>

        <button style={s.backBtn} onClick={() => navigate("/voter/elections")}>
          ← Back to Elections
        </button>
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
  gridBg: {
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
    padding: "48px 24px 80px",
    position: "relative",
    zIndex: 1,
    textAlign: "center",
  },
  checkCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#0d1a0d",
    border: "2px solid #4ade80",
    color: "#4ade80",
    fontSize: "1.6rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
    boxShadow: "0 0 30px rgba(74,222,128,0.12)",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
  },
  sub: { fontSize: "0.8rem", color: "#555", margin: "0 0 32px" },
  card: {
    background: "#111",
    border: "1px solid #4ade80",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
    textAlign: "left",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    paddingBottom: "14px",
    borderBottom: "1px solid #1a1a1a",
  },
  cardLabel: { fontSize: "0.62rem", color: "#4ade80", letterSpacing: "0.15em" },
  seqBadge: {
    fontSize: "0.72rem",
    color: "#555",
    background: "#0a0a0a",
    border: "1px solid #1e1e1e",
    borderRadius: "4px",
    padding: "2px 10px",
  },
  field: { marginBottom: "18px" },
  fieldLabel: {
    display: "block",
    fontSize: "0.62rem",
    color: "#444",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "6px",
  },
  fieldRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  mono: { fontSize: "0.78rem", color: "#ccc", wordBreak: "break-all" },
  copyBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#666",
    borderRadius: "4px",
    padding: "3px 10px",
    fontSize: "0.68rem",
    fontFamily: "inherit",
    cursor: "pointer",
    flexShrink: 0,
  },
  infoBox: {
    background: "#0f0f0f",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "14px 18px",
    marginBottom: "24px",
    textAlign: "left",
    fontSize: "0.75rem",
    color: "#555",
    lineHeight: "1.6",
  },
  backBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#666",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
};
