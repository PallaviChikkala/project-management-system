import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FolderPlus,
  SlidersHorizontal,
} from "lucide-react";
import { projectsApi, tasksApi } from "../services/api";
import { ProjectModal } from "../components/ProjectModal";
import { ProjectDetailModal } from "../components/ProjectDetailModal";
import { TaskModal } from "../components/TaskModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { AlertBanner } from "../components/AlertBanner";

export const ProjectsPage = ({ initialSelectedProjectId = null, onClearInitialProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Task Modal from within project detail
  const [taskModalProject, setTaskModalProject] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await projectsApi.getAll({
        search,
        status: statusFilter,
        sortBy,
        order: sortOrder,
      });
      if (response.success) {
        setProjects(response.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Open initial project detail if navigated from Dashboard
  useEffect(() => {
    if (initialSelectedProjectId && projects.length > 0) {
      handleOpenDetail(initialSelectedProjectId);
      if (onClearInitialProject) onClearInitialProject();
    }
  }, [initialSelectedProjectId, projects]);

  const handleOpenDetail = async (projectId) => {
    try {
      const res = await projectsApi.getById(projectId);
      if (res.success) {
        setDetailProject(res.data);
      }
    } catch (err) {
      setError(err.message || "Could not fetch project details");
    }
  };

  const handleCreateOrUpdateProject = async (data) => {
    if (editingProject) {
      await projectsApi.update(editingProject.id, data);
      setSuccessMessage("Project updated successfully!");
      if (detailProject && detailProject.id === editingProject.id) {
        handleOpenDetail(editingProject.id);
      }
    } else {
      await projectsApi.create(data);
      setSuccessMessage("Project created successfully!");
    }
    fetchProjects();
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    setIsDeleting(true);
    try {
      await projectsApi.delete(deleteProjectId);
      setSuccessMessage("Project deleted successfully.");
      if (detailProject && detailProject.id === deleteProjectId) {
        setDetailProject(null);
      }
      setDeleteProjectId(null);
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  // Task actions from within project detail
  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await tasksApi.update(task.id, { status: newStatus });
      if (detailProject) {
        handleOpenDetail(detailProject.id);
      }
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to update task status");
    }
  };

  const handleSaveTask = async (data) => {
    if (editingTask) {
      await tasksApi.update(editingTask.id, data);
    } else {
      await tasksApi.create(data);
    }
    if (detailProject) {
      handleOpenDetail(detailProject.id);
    }
    fetchProjects();
  };

  const handleDeleteTaskConfirm = async () => {
    if (!deleteTaskId) return;
    try {
      await tasksApi.delete(deleteTaskId);
      setDeleteTaskId(null);
      if (detailProject) {
        handleOpenDetail(detailProject.id);
      }
      fetchProjects();
    } catch (err) {
      setError(err.message || "Failed to delete task");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return <span className="badge badge-completed">Completed</span>;
      case "IN_PROGRESS":
        return <span className="badge badge-in-progress">In Progress</span>;
      default:
        return <span className="badge badge-not-started">Not Started</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">
            Create, manage and track progress across your portfolio.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingProject(null);
            setIsCreateOpen(true);
          }}
        >
          <Plus size={16} /> New Project
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

      {/* Search & Filter Toolbar */}
      <div className="toolbar">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            className="filter-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              setSortBy(sb);
              setSortOrder(so);
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="endDate-asc">End Date (Soonest)</option>
          </select>
        </div>
      </div>

      {/* Projects List / Grid */}
      {loading ? (
        <LoadingSpinner text="Loading projects..." />
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FolderPlus size={28} />
          </div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>No projects found</h3>
          <p style={{ color: "var(--text-secondary)", maxWidth: 360, fontSize: "0.9rem" }}>
            {search || statusFilter
              ? "No projects match your current filters. Try resetting search or status filters."
              : "You haven't created any projects yet. Start by creating your first project!"}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProject(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus size={16} /> Create Project
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div>
                <div className="project-card-header">
                  <h3
                    className="project-name"
                    onClick={() => handleOpenDetail(project.id)}
                    title="Click to view details and tasks"
                  >
                    {project.name}
                  </h3>
                  {getStatusBadge(project.status)}
                </div>

                {project.description && (
                  <p className="project-desc" style={{ marginTop: "0.5rem" }}>
                    {project.description}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.775rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>Progress</span>
                  <span style={{ fontWeight: 600 }}>
                    {project.completedTasksCount} / {project.tasksCount} tasks ({project.progressPercentage}%)
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${project.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Dates & Footer Actions */}
              <div>
                <div className="project-dates" style={{ marginBottom: "0.75rem" }}>
                  <Calendar size={13} />
                  <span>
                    {formatDate(project.startDate)} &ndash; {formatDate(project.endDate)}
                  </span>
                </div>

                <div className="project-card-footer">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenDetail(project.id)}
                  >
                    View Details
                  </button>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={() => {
                        setEditingProject(project);
                        setIsCreateOpen(true);
                      }}
                      title="Edit Project"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-outline-danger btn-icon"
                      onClick={() => setDeleteProjectId(project.id)}
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleCreateOrUpdateProject}
        project={editingProject}
      />

      <ProjectDetailModal
        isOpen={!!detailProject}
        onClose={() => setDetailProject(null)}
        project={detailProject}
        onEditProject={(proj) => {
          setEditingProject(proj);
          setIsCreateOpen(true);
        }}
        onDeleteProject={(id) => setDeleteProjectId(id)}
        onAddTask={(projId) => {
          setEditingTask(null);
          setTaskModalProject(projId);
        }}
        onToggleTaskStatus={handleToggleTaskStatus}
        onEditTask={(task) => setEditingTask(task)}
        onDeleteTask={(id) => setDeleteTaskId(id)}
      />

      {/* Task Modal opened from project detail */}
      <TaskModal
        isOpen={!!taskModalProject || !!editingTask}
        onClose={() => {
          setTaskModalProject(null);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        task={editingTask}
        projects={projects}
        defaultProjectId={taskModalProject}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteProjectId}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks will also be permanently deleted."
        confirmText="Yes, Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectId(null)}
      />

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTaskId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleDeleteTaskConfirm}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
};
