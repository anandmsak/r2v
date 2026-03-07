// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCandidates } from "../../api/electionApi";
import { issueToken, castVote } from "../../api/ballotApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function BallotPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [token, setToken]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [step, setStep]             = useState("loading"); // loading|select|confirm|casting|error
  const [error, setError]           = useState("");

  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    Promise.all([getCandidates(id), issueToken(id)])
      .then(([c, t]) => { setCandidates(c.data); setToken(t.data.token); setStep("select"); })
      .catch(e => { setError(e.message); setStep("error"); });
  }, []);
  async function cast() {
    setStep("casting");
    try {
      const res = await castVote(id, selected, token);
      navigate("/voter/receipt", { state: { receipt: res.data } });
    } catch (e) { setError(e.message); setStep("error"); }
  }

  const selC = candidates.find(c => c.id === selected);

  if (step === "loading") return <FullPage><LoadingSpinner text="Securing ballot token…" /></FullPage>;
  if (step === "casting") return <FullPage><LoadingSpinner text="Recording vote in chain…" /></FullPage>;
  if (step === "error")   return (
    <FullPage>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠</p>
        <p style={{ color: "#fff", fontSize: "1rem", marginBottom: "8px" }}>Unable to proceed</p>
        <p style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "24px" }}>{error}</p>
        <button style={s.backBtn} onClick={() => navigate("/voter/elections")}>← Back to Elections</button>
      </div>
    </FullPage>
  );

  return (
    <div style={s.root}>
      <div style={s.gridBg} />
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.backLink} onClick={() => navigate("/voter/elections")}>← Back</button>
          <span style={s.tokenBadge}>🔒 Token secured</span>
        </div>
        <span style={s.badge}>BALLOT</span>
        <h1 style={s.title}>Cast Your Vote</h1>

        {step === "select" && (
          <>
            <p style={s.instruction}>Select one candidate. This action is permanent.</p>
            <div style={s.list}>
              {candidates.map(c => (
                <div key={c.id} style={{ ...s.cCard, ...(selected === c.id ? s.cSelected : {}) }} onClick={() => setSelected(c.id)}>
                  <div style={{ ...s.radio, ...(selected === c.id ? s.radioOn : {}) }}>
                    {selected === c.id && <div style={s.radioDot} />}
                  </div>
                  <div>
                    <p style={s.cName}>{c.full_name}</p>
                    {c.position && <p style={s.cPos}>{c.position}</p>}
                    {c.description && <p style={s.cDesc}>{c.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            <button style={{ ...s.castBtn, ...(selected ? {} : s.disabled) }} disabled={!selected} onClick={() => setStep("confirm")}>
              Review Vote →
            </button>
          </>
        )}

        {step === "confirm" && (
          <div style={s.confirmBox}>
            <p style={s.confirmLabel}>You are voting for:</p>
            <div style={s.confirmC}>
              <p style={s.confirmName}>{selC?.full_name}</p>
              {selC?.position && <p style={s.confirmPos}>{selC.position}</p>}
            </div>
            <div style={s.warning}>⚠ Your vote is anonymous and permanent. Once cast, it cannot be changed.</div>
            <div style={s.confirmBtns}>
              <button style={s.changeBtn} onClick={() => setStep("select")}>Change</button>
              <button style={s.castBtn} onClick={cast}>Confirm & Cast Vote →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FullPage({ children }) {
  return <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>{children}</div>;
}

const s = {
  root: { minHeight: "100vh", background: "#0a0a0a", fontFamily: "'DM Mono', monospace", position: "relative" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(74,222,128,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.03) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  container: { maxWidth: "680px", margin: "0 auto", padding: "32px 24px 80px", position: "relative", zIndex: 1 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  backLink: { background: "transparent", border: "none", color: "#555", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" },
  tokenBadge: { fontSize: "0.7rem", color: "#4ade80", background: "#0a1a0a", border: "1px solid #1a3a1a", borderRadius: "6px", padding: "4px 12px" },
  badge: { display: "inline-block", fontSize: "0.62rem", color: "#4ade80", letterSpacing: "0.15em", border: "1px solid #1a3a1a", borderRadius: "4px", padding: "3px 8px", background: "#0a1a0a", marginBottom: "12px" },
  title: { fontSize: "1.6rem", fontWeight: "700", color: "#fff", margin: "0 0 8px" },
  instruction: { fontSize: "0.78rem", color: "#555", marginBottom: "20px" },
  list: { display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" },
  cCard: { display: "flex", gap: "16px", background: "#111", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "18px 20px", cursor: "pointer" },
  cSelected: { border: "1px solid #4ade80", background: "#0d1a0d" },
  radio: { width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #333", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" },
  radioOn: { border: "2px solid #4ade80" },
  radioDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80" },
  cName: { fontSize: "0.95rem", fontWeight: "700", color: "#fff", margin: "0 0 4px" },
  cPos: { fontSize: "0.72rem", color: "#4ade80", margin: "0 0 4px", letterSpacing: "0.05em" },
  cDesc: { fontSize: "0.75rem", color: "#555", margin: 0, lineHeight: "1.5" },
  castBtn: { background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "14px 24px", fontSize: "0.88rem", fontWeight: "700", fontFamily: "inherit", cursor: "pointer", width: "100%" },
  disabled: { opacity: 0.3, cursor: "not-allowed" },
  confirmBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "32px" },
  confirmLabel: { fontSize: "0.68rem", color: "#555", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" },
  confirmC: { background: "#0a0a0a", border: "1px solid #4ade80", borderRadius: "8px", padding: "18px", marginBottom: "18px" },
  confirmName: { fontSize: "1.1rem", fontWeight: "700", color: "#fff", margin: "0 0 4px" },
  confirmPos: { fontSize: "0.75rem", color: "#4ade80", margin: 0 },
  warning: { background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: "8px", padding: "12px 16px", fontSize: "0.75rem", color: "#f87171", marginBottom: "20px", lineHeight: "1.5" },
  confirmBtns: { display: "flex", gap: "10px" },
  changeBtn: { background: "transparent", border: "1px solid #333", color: "#888", borderRadius: "8px", padding: "12px 20px", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" },
  backBtn: { background: "transparent", border: "1px solid #333", color: "#888", borderRadius: "8px", padding: "10px 20px", fontSize: "0.82rem", fontFamily: "inherit", cursor: "pointer" },
};
