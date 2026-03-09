// Copyright (c) 2026 Anandha Krishnan P — R2V (Right to Vote)
export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        background: "#1a0a0a",
        border: "1px solid #3a1a1a",
        borderRadius: "8px",
        padding: "12px 16px",
        color: "#f87171",
        fontSize: "0.8rem",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      ⚠ {message}
    </div>
  );
}
