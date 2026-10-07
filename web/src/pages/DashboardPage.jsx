import React, { useState, useEffect, useCallback } from "react";
import {
  FolderKanban,
  CheckCircle,
  Clock,
  Layers,
  Activity,
  Plus,
  Calendar,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { dashboardApi, tasksApi } from "../services/api";
import { StatCard } from "../components/StatCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AlertBanner } from "../components/AlertBanner";
import { useAuth } from "../context/AuthContext";

export const DashboardPage = ({ onOpenNewProject, onOpenNewTask, onSelectTab, onSelectProject }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardApi.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleToggleTask = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await tasksApi.update(task.id, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !stats) {
    return <LoadingSpinner text="Loading dashboard metrics..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.fullName}! 👋</h1>
          <p className="page-subtitle">
            Here is what is happening across your projects and tasks today.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={onOpenNewTask}>
            <Plus size={16} /> New Task
          </button>
          <button className="btn btn-primary" onClick={onOpenNewProject}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError("")} />}

      {/* 5 Mandatory Dashboard Metric Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={FolderKanban}
          color="#6366f1"
          subtext={`${stats?.projectsCompleted ?? 0} completed`}
        />
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks ?? 0}
          icon={Layers}
          color="#8b5cf6"
          subtext={`${stats?.taskCompletionRate ?? 0}% completed`}
        />
        <StatCard
          title="Completed Tasks"
          value={stats?.completedTasks ?? 0}
          icon={CheckCircle}
          color="#10b981"
          subtext="Great job tracking progress"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks ?? 0}
          icon={Clock}
          color="#0ea5e9"
          subtext="Awaiting completion"
        />
        <StatCard
          title="Projects In Progress"
          value={stats?.projectsInProgress ?? 0}
          icon={Activity}
          color="#f59e0b"
          subtext="Actively moving forward"
        />
      </div>

      {/* Analytics & Breakdown Sections */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        {/* Recent Projects Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FolderKanban size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Recent Projects</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onSelectTab("projects")}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {stats?.recentProjects?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
              No projects created yet. Click &quot;New Project&quot; to begin!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats?.recentProjects?.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "var(--bg-input)",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.925rem" }}>{proj.name}</div>
                    <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {proj._count?.tasks || 0} tasks &bull; {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      proj.status === "COMPLETED"
                        ? "badge-completed"
                        : proj.status === "IN_PROGRESS"
                        ? "badge-in-progress"
                        : "badge-not-started"
                    }`}
                  >
                    {proj.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Tasks Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} color="var(--primary)" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Upcoming Tasks</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onSelectTab("tasks")}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {stats?.upcomingTasks?.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
              No pending tasks right now. You are all caught up!
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {stats?.upcomingTasks?.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem",
                    background: "var(--bg-input)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={task.status === "COMPLETED"}
                      onChange={() => handleToggleTask(task)}
                      title="Mark as completed"
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.925rem" }}>{task.name}</div>
                      <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {task.project?.name} &bull; Due {formatDate(task.dueDate)}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      task.priority === "HIGH"
                        ? "badge-priority-high"
                        : task.priority === "MEDIUM"
                        ? "badge-priority-medium"
                        : "badge-priority-low"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
