// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function ResultsPage({ results, loading }) {
  if (loading) return <LoadingSpinner />;
  if (!results) return <p style={{ color: "#444", fontSize: "0.82rem" }}>Results available once election starts.</p>;

  return (
    <div>
      <div style={s.meta}>
        <div style={s.metaItem}><span style={s.metaLabel}>Total Votes</span><span style={s.metaVal}>{results.total_votes}</span></div>
        <div style={s.metaItem}><span style={s.metaLabel}>Eligible</span><span style={s.metaVal}>{results.total_eligible}</span></div>
        <div style={s.metaItem}><span style={s.metaLabel}>Turnout</span><span style={{ ...s.metaVal, color: "#4ade80" }}>{results.turnout_percent}%</span></div>
        {results.winner && <div style={s.metaItem}><span style={s.metaLabel}>Winner</span><span style={{ ...s.metaVal, color: "#facc15" }}>{results.winner}</span></div>}
      </div>
      <div style={s.list}>
        {results.results.map(r => (
          <div key={r.candidate_id} style={s.row}>
            <div style={s.rowTop}>
              <span style={s.cName}>{r.full_name}</span>
              <span style={s.votes}>{r.votes} votes ({r.percentage}%)</span>
            </div>
            <div style={s.barBg}><div style={{ ...s.barFill, width: `${r.percentage}%` }} /></div>
          </div>
        ))}
      </div>
      {results.tallied_at && <p style={s.timestamp}>Last tallied: {new Date(results.tallied_at).toLocaleString()}</p>}
    </div>
  );
}

const s = {
  meta: { display: "flex", gap: "20px", flexWrap: "wrap", background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "16px 20px", marginBottom: "20px" },
  metaItem: { display: "flex", flexDirection: "column", gap: "3px" },
  metaLabel: { fontSize: "0.6rem", color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" },
  metaVal: { fontSize: "1.1rem", fontWeight: "700", color: "#fff" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  row: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "16px 20px" },
  rowTop: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  cName: { fontSize: "0.9rem", fontWeight: "600", color: "#fff" },
  votes: { fontSize: "0.78rem", color: "#4ade80" },
  barBg: { background: "#1a1a1a", borderRadius: "4px", height: "5px", overflow: "hidden" },
  barFill: { background: "#4ade80", height: "100%", borderRadius: "4px" },
  timestamp: { fontSize: "0.7rem", color: "#333", marginTop: "12px", textAlign: "right" },
};
