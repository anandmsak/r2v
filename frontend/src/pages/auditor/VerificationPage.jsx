// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
// File: src/pages/auditor/VerificationPage.jsx
import { useState, useEffect } from "react";
import { getAllElections } from "../../api/electionApi";
import { verifyChain } from "../../api/ballotApi";
import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function VerificationPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [results, setResults] = useState({}); // { [election_id]: { valid, mismatches, checked } }
  const [error, setError] = useState("");

  useEffect(() => {
    getAllElections()
      .then((r) => setElections(r.data))
      .catch(() => setError("Failed to load elections."))
      .finally(() => setLoading(false));
  }, []);

  async function verify(id) {
    setVerifyingId(id);
    try {
      const res = await verifyChain(id);
      setResults((prev) => ({ ...prev, [id]: res.data }));
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [id]: { valid: false, error: e.message || "Verification failed." },
      }));
    } finally {
      setVerifyingId(null);
    }
  }

  if (loading) {
    return (
      <div style={s.root}>
        <Navbar />
        <LoadingSpinner text="Loading elections…" />
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <Navbar />
      <div style={s.container}>
        {/* Header */}
        <div style={s.hero}>
          <span style={s.badge}>AUDITOR PORTAL</span>
          <h1 style={s.title}>Chain Verification</h1>
          <p style={s.sub}>
            Verify ballot chain integrity for any election. A valid chain means
            no votes have been tampered with.
          </p>
        </div>

        {error && <div style={s.errorBox}>⚠ {error}</div>}

        {elections.length === 0 ? (
          <div style={s.empty}>
            <p style={s.emptyText}>No elections found.</p>
          </div>
        ) : (
          <div style={s.list}>
            {elections.map((election) => {
              const result = results[election.id];
              const isVerifying = verifyingId === election.id;

              return (
                <div key={election.id} style={s.card}>
                  {/* Left — election info */}
                  <div style={s.cardLeft}>
                    <div style={s.cardTop}>
                      <span
                        style={{
                          ...s.statusDot,
                          background:
                            election.status === "active"
                              ? "#4ade80"
                              : election.status === "completed"
                                ? "#60a5fa"
                                : "#444",
                        }}
                      />
                      <span style={s.statusText}>
                        {(election.status || "draft").toUpperCase()}
                      </span>
                    </div>
                    <h2 style={s.electionTitle}>{election.title}</h2>
                    {election.description && (
                      <p style={s.electionDesc}>{election.description}</p>
                    )}
                    <p style={s.electionId}>ID: {election.id}</p>
                  </div>

                  {/* Right — verify button + result */}
                  <div style={s.cardRight}>
                    {/* Result banner */}
                    {result && !result.error && (
                      <div
                        style={{
                          ...s.resultBadge,
                          background: result.valid ? "#0a1a0a" : "#1a0a0a",
                          border: `1px solid ${result.valid ? "#1a3a1a" : "#3a1a1a"}`,
                          color: result.valid ? "#4ade80" : "#f87171",
                        }}
                      >
                        <span style={s.resultIcon}>
                          {result.valid ? "✓" : "✗"}
                        </span>
                        <div>
                          <div style={s.resultTitle}>
                            {result.valid ? "Chain Valid" : "Tamper Detected"}
                          </div>
                          <div style={s.resultSub}>
                            {result.valid
                              ? `${result.ballots_checked ?? ""} ballots checked · 0 mismatches`
                              : `${result.mismatches ?? "?"} mismatch(es) found`}
                          </div>
                        </div>
                      </div>
                    )}

                    {result?.error && (
                      <div style={s.resultError}>⚠ {result.error}</div>
                    )}

                    <button
                      style={{
                        ...s.verifyBtn,
                        opacity: isVerifying ? 0.6 : 1,
                        cursor: isVerifying ? "not-allowed" : "pointer",
                      }}
                      onClick={() => verify(election.id)}
                      disabled={isVerifying}
                    >
                      {isVerifying
                        ? "Verifying…"
                        : result
                          ? "Re-verify →"
                          : "Verify Chain →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    maxWidth: "900px",
    margin: "0 auto",
    padding: "48px 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  hero: { marginBottom: "40px" },
  badge: {
    display: "inline-block",
    fontSize: "0.62rem",
    color: "#60a5fa",
    letterSpacing: "0.15em",
    border: "1px solid #1a2a4a",
    borderRadius: "4px",
    padding: "3px 10px",
    background: "#0a0f1a",
    marginBottom: "14px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
    letterSpacing: "-0.03em",
  },
  sub: { fontSize: "0.82rem", color: "#555", margin: 0, lineHeight: "1.6" },
  errorBox: {
    background: "#1a0a0a",
    border: "1px solid #3a1a1a",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#f87171",
    fontSize: "0.8rem",
    marginBottom: "20px",
  },
  empty: { textAlign: "center", padding: "80px 0" },
  emptyText: { color: "#444", fontSize: "0.9rem" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    padding: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    flexWrap: "wrap",
  },
  cardLeft: { flex: 1, minWidth: "200px" },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  statusText: { fontSize: "0.6rem", color: "#555", letterSpacing: "0.12em" },
  electionTitle: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px",
  },
  electionDesc: {
    fontSize: "0.75rem",
    color: "#555",
    margin: "0 0 8px",
    lineHeight: "1.5",
  },
  electionId: {
    fontSize: "0.65rem",
    color: "#333",
    margin: 0,
    wordBreak: "break-all",
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
    flexShrink: 0,
  },
  resultBadge: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    borderRadius: "8px",
    padding: "10px 14px",
    minWidth: "200px",
  },
  resultIcon: { fontSize: "1rem", flexShrink: 0, marginTop: "1px" },
  resultTitle: { fontSize: "0.82rem", fontWeight: "700" },
  resultSub: { fontSize: "0.7rem", opacity: 0.7, marginTop: "2px" },
  resultError: {
    background: "#1a0808",
    border: "1px solid #3a1010",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f87171",
    fontSize: "0.75rem",
    minWidth: "200px",
  },
  verifyBtn: {
    background: "#60a5fa",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.82rem",
    fontWeight: "700",
    fontFamily: "'DM Mono', monospace",
    transition: "opacity 0.2s",
    whiteSpace: "nowrap",
  },
};
