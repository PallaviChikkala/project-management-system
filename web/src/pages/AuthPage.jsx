import React, { useState } from "react";
import { Layers, Mail, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AlertBanner } from "../components/AlertBanner";

export const AuthPage = () => {
  const { login, register, sessionExpiredMessage, clearSessionMessage } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register'

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setErrors({});
    setErrorMessage("");
    clearSessionMessage();
  };

  const validate = () => {
    const newErrors = {};

    if (mode === "register") {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      } else if (formData.fullName.trim().length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
      } else {
        await register(formData.fullName, formData.email, formData.password);
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div
            className="brand-icon"
            style={{ margin: "0 auto 1rem auto", width: 48, height: 48, borderRadius: "var(--radius-lg)" }}
          >
            <Layers size={26} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>
            Project Management System
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Unified Web &amp; Mobile Workspace
          </p>
        </div>

        {/* Expired Session Notice */}
        {sessionExpiredMessage && (
          <AlertBanner
            type="error"
            message={sessionExpiredMessage}
            onClose={clearSessionMessage}
          />
        )}

        {/* General Error Notice */}
        {errorMessage && (
          <AlertBanner
            type="error"
            message={errorMessage}
            onClose={() => setErrorMessage("")}
          />
        )}

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => handleModeChange("login")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => handleModeChange("register")}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Rivera"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={loading}
                />
              </div>
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? (
              "Please wait..."
            ) : mode === "login" ? (
              <>
                Sign In <ArrowRight size={16} />
              </>
            ) : (
              <>
                Register Account <ArrowRight size={16} />
              </>
            )}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              marginTop: "1rem",
              fontSize: "0.775rem",
              color: "var(--text-muted)",
            }}
          >
            <ShieldCheck size={14} color="var(--success)" />
            <span>Secure JWT authentication &amp; encrypted bcrypt passwords</span>
          </div>
        </form>
      </div>
    </div>
  );
};
