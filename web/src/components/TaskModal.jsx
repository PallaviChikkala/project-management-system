import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AlertBanner } from "./AlertBanner";

export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  projects = [],
  defaultProjectId = null,
}) => {
  const isEditing = !!task;

  const getFutureString = (days = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const [formData, setFormData] = useState({
    projectId: defaultProjectId || (projects[0]?.id ? String(projects[0].id) : ""),
    name: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: getFutureString(7),
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (task) {
      setFormData({
        projectId: String(task.projectId),
        name: task.name || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "PENDING",
        dueDate: formatDateForInput(task.dueDate) || getFutureString(7),
      });
    } else {
      setFormData({
        projectId: defaultProjectId
          ? String(defaultProjectId)
          : projects[0]?.id
          ? String(projects[0].id)
          : "",
        name: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: getFutureString(7),
      });
    }
    setErrors({});
    setServerError("");
  }, [task, defaultProjectId, projects, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.projectId) {
      newErrors.projectId = "Please select a project";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Task name is required";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        projectId: parseInt(formData.projectId, 10),
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      onClose();
    } catch (err) {
      setServerError(err.message || "Failed to save task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? "Edit Task" : "Create New Task"}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {serverError && <AlertBanner type="error" message={serverError} onClose={() => setServerError("")} />}

            <div className="form-group">
              <label className="form-label">Project *</label>
              <select
                className="form-select"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                disabled={isSubmitting || (isEditing && !!task.projectId)}
              >
                <option value="">Select a Project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.projectId && <span className="form-error">{errors.projectId}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Task Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Implement user login page"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                placeholder="Details, acceptance criteria, or links..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
