import React from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export const AlertBanner = ({ type = "error", message, onClose }) => {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div className={`alert-banner ${isError ? "alert-banner-error" : "alert-banner-success"}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {isError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
          }}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
