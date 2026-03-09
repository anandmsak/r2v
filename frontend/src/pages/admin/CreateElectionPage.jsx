// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useElection } from "../../hooks/useElection";
import {
  startElection,
  endElection,
  archiveElection,
} from "../../api/electionApi";
import Navbar from "../../components/common/Navbar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ManageCandidatesPage from "./ManageCandidatesPage";
import UploadEligibilityPage from "./UploadEligibilityPage";
import ResultsPage from "./ResultsPage";
import AuditReportPage from "./AuditReportPage";

export default function CreateElectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { election, candidates, results, loading, error, refresh } =
    useElection(id);
  const [tab, setTab] = useState("overview");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [actLoading, setActLoading] = useState(false);

  async function transition(fn, label) {
    setActLoading(true);
    setErr("");
    setMsg("");
    try {
      await fn(id);
      setMsg(`Election ${label}.`);
      refresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setActLoading(false);
    }
  }

  const statusColor = {
    draft: "#555",
    active: "#4ade80",
    completed: "#60a5fa",
    archived: "#333",
  };

  if (loading)
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  if (error || !election)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          fontFamily: "'DM Mono', monospace",
          color: "#f87171",
          padding: "80px 32px",
        }}
      >
        {error || "Election not found."}
      </div>
    );

  const sc = statusColor[election.status] || "#555";

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <Navbar />
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.back} onClick={() => navigate("/admin/dashboard")}>
            ← Dashboard
          </button>
          <span style={{ ...s.statusBadge, color: sc, borderColor: sc }}>
            {election.status.toUpperCase()}
          </span>
        </div>

        <h1 style={s.title}>{election.title}</h1>
        {election.description && <p style={s.desc}>{election.description}</p>}

        <div style={s.actions}>
          {election.status === "draft" && (
            <button
              style={s.greenBtn}
              disabled={actLoading}
              onClick={() => transition(startElection, "started")}
            >
              ▶ Start Election
            </button>
          )}
          {election.status === "active" && (
            <button
              style={s.redBtn}
              disabled={actLoading}
              onClick={() => transition(endElection, "ended")}
            >
              ■ End Election
            </button>
          )}
          {election.status === "completed" && (
            <button
              style={s.grayBtn}
              disabled={actLoading}
              onClick={() => transition(archiveElection, "archived")}
            >
              Archive
            </button>
          )}
        </div>

        {msg && <p style={s.success}>{msg}</p>}
        {err && <p style={s.err}>{err}</p>}

        <div style={s.tabs}>
          {["overview", "candidates", "voters", "results", "audit"].map((t) => (
            <button
              key={t}
              style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={s.grid2}>
            {[
              ["Election ID", election.id],
              ["Status", election.status],
              ["Created", new Date(election.created_at).toLocaleString()],
              [
                "Started",
                election.published_at
                  ? new Date(election.published_at).toLocaleString()
                  : "—",
              ],
              [
                "Ended",
                election.closed_at
                  ? new Date(election.closed_at).toLocaleString()
                  : "—",
              ],
              ["Candidates", candidates.length],
            ].map(([label, val]) => (
              <div key={label} style={s.infoCard}>
                <span style={s.infoLabel}>{label}</span>
                <span style={s.infoVal}>{val}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "candidates" && (
          <ManageCandidatesPage
            election={election}
            candidates={candidates}
            onRefresh={refresh}
          />
        )}
        {tab === "voters" && <UploadEligibilityPage election={election} />}
        {tab === "results" && <ResultsPage results={results} loading={false} />}
        {tab === "audit" && <AuditReportPage election={election} />}
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
    maxWidth: "900px",
    margin: "0 auto",
    padding: "0 24px 80px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 0",
    marginBottom: "16px",
  },
  back: {
    background: "transparent",
    border: "none",
    color: "#555",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  statusBadge: {
    fontSize: "0.6rem",
    border: "1px solid",
    borderRadius: "4px",
    padding: "3px 10px",
    letterSpacing: "0.1em",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 8px",
  },
  desc: { fontSize: "0.8rem", color: "#555", margin: "0 0 20px" },
  actions: { display: "flex", gap: "10px", marginBottom: "12px" },
  greenBtn: {
    background: "#4ade80",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.82rem",
    fontWeight: "700",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  redBtn: {
    background: "#1a0a0a",
    color: "#f87171",
    border: "1px solid #3a1a1a",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  grayBtn: {
    background: "transparent",
    color: "#555",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "0.82rem",
    fontFamily: "inherit",
    cursor: "pointer",
  },
  success: { color: "#4ade80", fontSize: "0.78rem", margin: "0 0 12px" },
  err: { color: "#f87171", fontSize: "0.78rem", margin: "0 0 12px" },
  tabs: {
    display: "flex",
    gap: "2px",
    borderBottom: "1px solid #1a1a1a",
    margin: "16px 0 24px",
  },
  tab: {
    background: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#444",
    fontSize: "0.8rem",
    fontFamily: "inherit",
    cursor: "pointer",
    padding: "10px 16px",
    marginBottom: "-1px",
  },
  tabActive: { color: "#4ade80", borderBottomColor: "#4ade80" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  infoCard: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "8px",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  infoLabel: {
    fontSize: "0.6rem",
    color: "#444",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  infoVal: { fontSize: "0.82rem", color: "#ccc", wordBreak: "break-all" },
};
