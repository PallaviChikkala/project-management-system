import React from "react";
import { X, Calendar, Plus, CheckCircle2, Clock, Edit2, Trash2 } from "lucide-react";

export const ProjectDetailModal = ({
  isOpen,
  onClose,
  project,
  onEditProject,
  onDeleteProject,
  onAddTask,
  onToggleTaskStatus,
  onEditTask,
  onDeleteTask,
}) => {
  if (!isOpen || !project) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "badge-completed";
      case "IN_PROGRESS":
        return "badge-in-progress";
      default:
        return "badge-not-started";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "HIGH":
        return "badge-priority-high";
      case "MEDIUM":
        return "badge-priority-medium";
      default:
        return "badge-priority-low";
    }
  };

  const tasks = project.tasks || [];
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h3 className="modal-title">{project.name}</h3>
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>
              {project.status.replace("_", " ")}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {project.description && (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {project.description}
            </p>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              background: "var(--bg-input)",
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Calendar size={15} color="var(--primary)" />
              <span>Start: <strong>{formatDate(project.startDate)}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Calendar size={15} color="var(--primary)" />
              <span>End: <strong>{formatDate(project.endDate)}</strong></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Clock size={15} color="var(--text-muted)" />
              <span>Created: {formatDate(project.createdAt)}</span>
            </div>
          </div>

          {/* Progress Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Task Completion</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {completedCount} / {tasks.length} ({progressPercent}%)
              </span>
            </div>
            <div className="progress-bar-bg" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Tasks Section Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "0.5rem",
            }}
          >
            <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Project Tasks ({tasks.length})</h4>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onAddTask(project.id)}
            >
              <Plus size={15} /> Add Task
            </button>
          </div>

          {/* Tasks List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {tasks.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "1.5rem",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px dashed var(--border-subtle)",
                }}
              >
                No tasks added to this project yet. Click &quot;Add Task&quot; to begin!
              </div>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                return (
                  <div key={task.id} className="task-item" style={{ padding: "0.75rem 1rem" }}>
                    <div className="task-left">
                      <input
                        type="checkbox"
                        className="task-checkbox"
                        checked={isCompleted}
                        onChange={() => onToggleTaskStatus(task)}
                        title={isCompleted ? "Mark pending" : "Mark completed"}
                      />
                      <div>
                        <div className={`task-title ${isCompleted ? "completed" : ""}`}>
                          {task.name}
                        </div>
                        <div className="task-details">
                          <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Calendar size={13} />
                            Due: {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="task-actions">
                      <button
                        className="btn btn-secondary btn-icon"
                        onClick={() => onEditTask(task)}
                        title="Edit Task"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-outline-danger btn-icon"
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditProject(project)}
            >
              <Edit2 size={14} /> Edit Project
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onDeleteProject(project.id)}
            >
              <Trash2 size={14} /> Delete Project
            </button>
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
