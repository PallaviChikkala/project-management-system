import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { TasksPage } from "./pages/TasksPage";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ProjectModal } from "./components/ProjectModal";
import { TaskModal } from "./components/TaskModal";
import { projectsApi, tasksApi } from "./services/api";

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Global Quick Modals triggered from Dashboard
  const [globalProjectModalOpen, setGlobalProjectModalOpen] = useState(false);
  const [globalTaskModalOpen, setGlobalTaskModalOpen] = useState(false);
  const [cachedProjects, setCachedProjects] = useState([]);
  const [selectedProjectIdForDetail, setSelectedProjectIdForDetail] = useState(null);

  const handleOpenGlobalTask = async () => {
    try {
      const res = await projectsApi.getAll();
      if (res.success) {
        setCachedProjects(res.data);
      }
    } catch {
      // Ignore
    }
    setGlobalTaskModalOpen(true);
  };

  const handleCreateGlobalProject = async (data) => {
    await projectsApi.create(data);
    setGlobalProjectModalOpen(false);
    // Switch to projects tab to see it
    setCurrentTab("projects");
  };

  const handleCreateGlobalTask = async (data) => {
    await tasksApi.create(data);
    setGlobalTaskModalOpen(false);
    // Switch to tasks tab to see it
    setCurrentTab("tasks");
  };

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <LoadingSpinner size={36} text="Loading your workspace..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="app-container">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="main-content">
        {currentTab === "dashboard" && (
          <DashboardPage
            onOpenNewProject={() => setGlobalProjectModalOpen(true)}
            onOpenNewTask={handleOpenGlobalTask}
            onSelectTab={setCurrentTab}
            onSelectProject={(projId) => {
              setSelectedProjectIdForDetail(projId);
              setCurrentTab("projects");
            }}
          />
        )}

        {currentTab === "projects" && (
          <ProjectsPage
            initialSelectedProjectId={selectedProjectIdForDetail}
            onClearInitialProject={() => setSelectedProjectIdForDetail(null)}
          />
        )}

        {currentTab === "tasks" && (
          <TasksPage
            onOpenCreateProject={() => {
              setCurrentTab("projects");
              setGlobalProjectModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Global Project Modal */}
      <ProjectModal
        isOpen={globalProjectModalOpen}
        onClose={() => setGlobalProjectModalOpen(false)}
        onSubmit={handleCreateGlobalProject}
      />

      {/* Global Task Modal */}
      <TaskModal
        isOpen={globalTaskModalOpen}
        onClose={() => setGlobalTaskModalOpen(false)}
        onSubmit={handleCreateGlobalTask}
        projects={cachedProjects}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
