import React, { useState } from "react";
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, Layers } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
  ];

  const handleTabClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a
          href="#dashboard"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            handleTabClick("dashboard");
          }}
        >
          <div className="brand-icon">
            <Layers size={20} />
          </div>
          <span>PMS Portal</span>
        </a>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* User Pill & Logout */}
        <div className="nav-user">
          {user && (
            <div className="user-badge" title={user.email}>
              <div className="user-avatar">{getInitials(user.fullName)}</div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.fullName}
              </span>
            </div>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            title="Sign out of your account"
          >
            <LogOut size={16} />
            <span style={{ display: "none" }}>Logout</span>
          </button>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick(item.id)}
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div
            style={{
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{user?.email}</span>
            <button className="btn btn-danger btn-sm" onClick={logout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
