import React from "react";

export const StatCard = ({ title, value, icon: Icon, color = "var(--primary)", subtext }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-title">{title}</span>
        {Icon && (
          <div
            className="stat-icon"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
};
