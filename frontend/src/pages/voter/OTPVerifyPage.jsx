// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes

export default function OTPVerifyPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const register_number = location.state?.register_number || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState(""); // "wrong" | "locked" | "expired" | "other"

  // Countdown timer
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0;

  function timerColor() {
    if (secondsLeft > 120) return "#4ade80";
    if (secondsLeft > 45) return "#facc15";
    return "#f87171";
  }

  function parseError(raw) {
    const msg = (raw || "").toLowerCase();

    // ── Pydantic / validation errors from backend ──────────────────────
    if (
      msg.includes("string should have") ||
      msg.includes("at least") ||
      msg.includes("too short") ||
      msg.includes("min_length")
    ) {
      setErrorType("wrong");
      return "OTP must be between 4 and 6 digits. Please enter a valid OTP.";
    }
    // ──────────────────────────────────────────────────────────────────

    if (msg.includes("locked") || msg.includes("too many")) {
      setErrorType("locked");
      return "Account locked after too many failed attempts. Try again in 15 minutes.";
    }
    if (msg.includes("expired") || msg.includes("otp has expired")) {
      setErrorType("expired");
      return "OTP has expired. Go back and request a new one.";
    }
    if (
      msg.includes("invalid") ||
      msg.includes("incorrect") ||
      msg.includes("wrong") ||
      msg.includes("otp")
    ) {
      setErrorType("wrong");
      return "Incorrect OTP. Please check and try again.";
    }
    setErrorType("other");
    return raw || "Verification failed. Please try again.";
  }

  async function submit(e) {
    e.preventDefault();
    if (!otp.trim() || expired) return;

    // ── Client-side length check before even calling the API ──────────
    if (otp.trim().length < 4 || otp.trim().length > 6) {
      setErrorType("wrong");
      setError("OTP must be between 4 and 6 digits. Please enter a valid OTP.");
      return;
    }
    // ─────────────────────────────────────────────────────────────────

    setLoading(true);
    setError("");
    setErrorType("");
    try {
      const res = await verifyOtp(register_number, otp.trim());
      login(res.data);
      if (res.data.role === "admin") navigate("/admin/dashboard");
      else if (res.data.role === "auditor") navigate("/auditor/verify");
      else navigate("/voter/elections");
    } catch (e) {
      setError(parseError(e.message));
    } finally {
      setLoading(false);
    }
  }

  const errorBg = errorType === "locked" ? "#1a1000" : "#1a0a0a";
  const errorBord = errorType === "locked" ? "#3a2a00" : "#3a1a1a";
  const errorColor = errorType === "locked" ? "#facc15" : "#f87171";
  const errorEmoji =
    errorType === "locked" ? "🔒" : errorType === "expired" ? "⏰" : "⚠";

  return (
    <div style={s.root}>
      <div style={s.grid} />
      <div style={s.card}>
        <div style={s.logoRow}>
          <div style={s.logoDot} />
          <span style={s.logoText}>R2V</span>
        </div>
        <h1 style={s.title}>Enter OTP</h1>
        <div style={s.infoBox}>
          OTP sent to email for{" "}
          <strong style={{ color: "#4ade80" }}>{register_number}</strong>
        </div>

        {/* Countdown timer */}
        <div style={{ ...s.timerRow, color: timerColor() }}>
          {expired ? (
            <span style={s.timerExpired}>
              ⏰ OTP expired — go back and request a new one
            </span>
          ) : (
            <>
              <span style={s.timerDot} />
              <span>
                OTP expires in{" "}
                <strong>
                  {minutes}:{secs}
                </strong>
              </span>
            </>
          )}
        </div>

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>6-digit OTP</label>
          <input
            style={{
              ...s.input,
              letterSpacing: "0.5em",
              fontSize: "1.6rem",
              textAlign: "center",
              ...(expired ? { opacity: 0.4, pointerEvents: "none" } : {}),
            }}
            type="text"
            maxLength={6}
            placeholder="——————"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ""));
              setError("");
              setErrorType("");
            }}
            autoFocus
            disabled={expired}
          />
          {error && (
            <div
              style={{
                ...s.errorBox,
                background: errorBg,
                borderColor: errorBord,
                color: errorColor,
              }}
            >
              <span style={s.errorIcon}>{errorEmoji}</span>
              <span>{error}</span>
            </div>
          )}
          <button
            style={{ ...s.btn, ...(expired ? s.btnDisabled : {}) }}
            type="submit"
            disabled={loading || expired}
          >
            {loading ? "Verifying…" : "Verify & Login →"}
          </button>
        </form>
        <button style={s.back} onClick={() => navigate("/")}>
          ← Back to login
        </button>
      </div>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Mono', monospace",
    position: "relative",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(74,222,128,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(74,222,128,0.04) 1px,transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  card: {
    background: "#111",
    border: "1px solid #1e1e1e",
    borderRadius: "16px",
    padding: "48px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "24px",
  },
  logoDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#4ade80",
  },
  logoText: {
    fontSize: "1.2rem",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.15em",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 16px",
  },
  infoBox: {
    background: "#0a0a0a",
    border: "1px solid #1e1e1e",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.78rem",
    color: "#666",
    marginBottom: "16px",
  },
  timerRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.78rem",
    marginBottom: "20px",
  },
  timerDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "currentColor",
    flexShrink: 0,
  },
  timerExpired: { fontSize: "0.78rem" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
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
    fontFamily: "inherit",
    outline: "none",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "0.78rem",
    lineHeight: "1.5",
  },
  errorIcon: { flexShrink: 0 },
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
  btnDisabled: { background: "#1a1a1a", color: "#444", cursor: "not-allowed" },
  back: {
    background: "transparent",
    border: "none",
    color: "#444",
    fontSize: "0.8rem",
    fontFamily: "inherit",
    cursor: "pointer",
    marginTop: "16px",
    display: "block",
  },
};
