// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { getAuditChain } from "../../api/adminApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function AuditReportPage({ election }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchChain() {
    setLoading(true);
    setError("");
    try {
      const res = await getAuditChain(election.id);
      setReport(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {!report && !loading && (
        <div style={s.cta}>
          <p style={s.ctaText}>
            Verify the ballot chain integrity for this election.
          </p>
          <button style={s.verifyBtn} onClick={fetchChain}>
            Run Chain Verification
          </button>
        </div>
      )}
      {loading && <LoadingSpinner text="Verifying chain…" />}
      {error && <p style={s.err}>{error}</p>}
      {report && (
        <div>
          <div
            style={{
              ...s.statusBox,
              borderColor: report.chain_valid ? "#4ade80" : "#f87171",
              background: report.chain_valid ? "#0d1a0d" : "#1a0d0d",
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>
              {report.chain_valid ? "✓" : "✕"}
            </span>
            <div>
              <p
                style={{
                  ...s.statusTitle,
                  color: report.chain_valid ? "#4ade80" : "#f87171",
                }}
              >
                {report.chain_valid ? "Chain Valid" : "Chain Integrity Failed"}
              </p>
              <p style={s.statusSub}>
                {report.total_ballots} ballots checked · {report.mismatches}{" "}
                mismatches
              </p>
            </div>
          </div>
          <button style={s.rerunBtn} onClick={fetchChain}>
            Re-run Verification
          </button>
        </div>
      )}
    </div>
  );
}

const s = {
  cta: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "10px",
    padding: "32px",
    textAlign: "center",
  },
  ctaText: { color: "#555", fontSize: "0.82rem", marginBottom: "20px" },
  verifyBtn: {
    background: "#4ade80",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "0.85rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    border: "1px solid",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "16px",
  },
  statusTitle: { fontSize: "1rem", fontWeight: "700", margin: "0 0 4px" },
  statusSub: { fontSize: "0.78rem", color: "#666", margin: 0 },
  err: { color: "#f87171", fontSize: "0.8rem" },
  rerunBtn: {
    background: "transparent",
    border: "1px solid #2a2a2a",
    color: "#666",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.8rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
};
