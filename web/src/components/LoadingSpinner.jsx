import React from "react";
import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ size = 24, text = "Loading..." }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "2rem",
        color: "var(--text-secondary)",
      }}
    >
      <Loader2 size={size} className="spinner" style={{ color: "var(--primary)" }} />
      {text && <span style={{ fontSize: "0.875rem" }}>{text}</span>}
    </div>
  );
};
