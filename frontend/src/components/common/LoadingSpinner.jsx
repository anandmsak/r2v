// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
export default function LoadingSpinner({ text = "Loading…" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "2px solid #1e1e1e",
          borderTop: "2px solid #4ade80",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          color: "#555",
          fontSize: "0.8rem",
          fontFamily: "'DM Mono', monospace",
          margin: 0,
        }}
      >
        {text}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
