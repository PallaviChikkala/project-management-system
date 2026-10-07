import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  CheckSquare,
  AlertCircle,
  Filter,
} from "lucide-react";
import { tasksApi, projectsApi } from "../services/api";
import { TaskModal } from "../components/TaskModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AlertBanner } from "../components/AlertBanner";

export const TasksPage = ({ onOpenCreateProject }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasksAndProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, projsRes] = await Promise.all([
        tasksApi.getAll({
          search,
          status: statusFilter,
          priority: priorityFilter,
          projectId: projectFilter,
          sortBy,
          order: sortOrder,
        }),
        projectsApi.getAll(),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.data);
      }
      if (projsRes.success) {
        setProjects(projsRes.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, projectFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  const handleToggleStatus = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await tasksApi.update(task.id, { status: newStatus });
      fetchTasksAndProjects();
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  const handleSaveTask = async (data) => {
    if (editingTask) {
      await tasksApi.update(editingTask.id, data);
      setSuccessMessage("Task updated successfully!");
    } else {
      await tasksApi.create(data);
      setSuccessMessage("Task created successfully!");
    }
    fetchTasksAndProjects();
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    setIsDeleting(true);
    try {
      await tasksApi.delete(deleteTaskId);
      setSuccessMessage("Task deleted successfully.");
      setDeleteTaskId(null);
      fetchTasksAndProjects();
    } catch (err) {
      setError(err.message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
        return <span className="badge badge-priority-high">High</span>;
      case "MEDIUM":
        return <span className="badge badge-priority-medium">Medium</span>;
      default:
        return <span className="badge badge-priority-low">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return <span className="badge badge-completed">Completed</span>;
      case "IN_PROGRESS":
        return <span className="badge badge-in-progress">In Progress</span>;
      default:
        return <span className="badge badge-pending">Pending</span>;
    }
  };

  const isOverdue = (dateString, status) => {
    if (status === "COMPLETED") return false;
    return new Date(dateString) < new Date();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">
            Track deliverables, assign priorities, and hit deadlines.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (projects.length === 0) {
              setError("Please create at least one project before creating tasks.");
              return;
            }
            setEditingTask(null);
            setIsModalOpen(true);
          }}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {successMessage && (
        <AlertBanner
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}
      {error && (
        <AlertBanner type="error" message={error} onClose={() => setError("")} />
      )}

      {/* Filter and Search Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          {/* Project Filter */}
          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort order */}
          <select
            className="filter-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
            }}
          >
            <option value="dueDate-asc">Due Date (Earliest)</option>
            <option value="dueDate-desc">Due Date (Latest)</option>
            <option value="createdAt-desc">Newest Added</option>
            <option value="name-asc">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <LoadingSpinner text="Loading tasks..." />
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CheckSquare size={28} />
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>No tasks found</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: 360, fontSize: "0.9rem" }}>
            {search || statusFilter || priorityFilter || projectFilter
              ? "No tasks match your current filters. Try resetting search or filter options."
              : projects.length === 0
              ? "Create a project first, then add tasks to start tracking your work."
              : "No tasks created yet. Click 'New Task' to add your first item!"}
          </p>
          {projects.length === 0 ? (
            <button className="btn btn-primary" onClick={onOpenCreateProject}>
              <Plus size={16} /> Create Project First
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
            >
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {tasks.map((task) => {
            const isCompleted = task.status === "COMPLETED";
            const overdue = isOverdue(task.dueDate, task.status);

            return (
              <div key={task.id} className="task-item">
                <div className="task-left">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleStatus(task)}
                    title={isCompleted ? "Mark pending" : "Mark completed"}
                  />
                  <div>
                    <div className={`task-title ${isCompleted ? "completed" : ""}`}>
                      {task.name}
                    </div>

                    {task.description && (
                      <div
                        style={{
                          fontSize: "0.825rem",
                          color: "var(--text-secondary)",
                          marginTop: "2px",
                        }}
                      >
                        {task.description}
                      </div>
                    )}

                    <div className="task-details">
                      {task.project?.name && (
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                          📁 {task.project.name}
                        </span>
                      )}
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: overdue ? "var(--danger)" : "var(--text-muted)",
                          fontWeight: overdue ? 600 : 400,
                        }}
                      >
                        <Calendar size={13} />
                        Due: {formatDate(task.dueDate)}
                        {overdue && " (Overdue)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => {
                      setEditingTask(task);
                      setIsModalOpen(true);
                    }}
                    title="Edit Task"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    className="btn btn-outline-danger btn-icon"
                    onClick={() => setDeleteTaskId(task.id)}
                    title="Delete Task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        task={editingTask}
        projects={projects}
        defaultProjectId={projectFilter ? parseInt(projectFilter, 10) : null}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTaskId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
};
