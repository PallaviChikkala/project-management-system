import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mobileApi } from "../services/api";
import { TaskModal } from "../components/TaskModal";
import { ProjectModal } from "../components/ProjectModal";
import { NetworkErrorBanner } from "../components/NetworkErrorBanner";

export const ProjectDetailScreen = ({ projectId, onBack, onProjectDeleted }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editProjectVisible, setEditProjectVisible] = useState(false);

  const fetchProjectDetails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await mobileApi.projects.getById(projectId);
      if (res.success) {
        setProject(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const onRefresh = () => {
    fetchProjectDetails(true);
  };

  const handleToggleTask = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await mobileApi.tasks.update(task.id, { status: newStatus });
      fetchProjectDetails(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not update task.");
    }
  };

  const handleDeleteTask = (task) => {
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await mobileApi.tasks.delete(task.id);
              fetchProjectDetails(true);
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteProject = () => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project.name}"? All associated tasks will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await mobileApi.projects.delete(project.id);
              if (onProjectDeleted) onProjectDeleted();
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete project.");
            }
          },
        },
      ]
    );
  };

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      await mobileApi.tasks.update(editingTask.id, taskData);
    } else {
      await mobileApi.tasks.create(taskData);
    }
    fetchProjectDetails(true);
  };

  const handleSaveProject = async (projData) => {
    await mobileApi.projects.update(project.id, projData);
    fetchProjectDetails(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading && !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  const tasks = project?.tasks || [];
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          {project?.name || "Project"}
        </Text>
        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => setEditProjectVisible(true)}
          >
            <Ionicons name="create-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleDeleteProject}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
            colors={["#6366f1"]}
          />
        }
      >
        {error ? (
          <NetworkErrorBanner message={error} onRetry={() => fetchProjectDetails(false)} />
        ) : null}

        {/* Project Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                project?.status === "COMPLETED"
                  ? styles.badgeCompleted
                  : project?.status === "IN_PROGRESS"
                  ? styles.badgeInProgress
                  : styles.badgeNotStarted,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  project?.status === "COMPLETED"
                    ? styles.badgeTextCompleted
                    : project?.status === "IN_PROGRESS"
                    ? styles.badgeTextInProgress
                    : styles.badgeTextNotStarted,
                ]}
              >
                {project?.status?.replace("_", " ")}
              </Text>
            </View>
          </View>

          <Text style={styles.projectName}>{project?.name}</Text>
          {project?.description ? (
            <Text style={styles.projectDesc}>{project.description}</Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6366f1" />
              <Text style={styles.metaText}>Start: {formatDate(project?.startDate)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#6366f1" />
              <Text style={styles.metaText}>End: {formatDate(project?.endDate)}</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tasks Completed</Text>
              <Text style={styles.progressValue}>
                {completedCount} / {tasks.length} ({progressPct}%)
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksHeader}>
          <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
          <TouchableOpacity
            style={styles.addTaskBtn}
            onPress={() => {
              setEditingTask(null);
              setTaskModalVisible(true);
            }}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.addTaskText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {tasks.length === 0 ? (
          <View style={styles.emptyTasksBox}>
            <Ionicons name="checkbox-outline" size={32} color="#64748b" />
            <Text style={styles.emptyTasksText}>No tasks under this project yet.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => {
                setEditingTask(null);
                setTaskModalVisible(true);
              }}
            >
              <Text style={styles.emptyAddBtnText}>Add First Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tasks.map((task) => {
            const isDone = task.status === "COMPLETED";
            return (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => handleToggleTask(task)}
                >
                  <Ionicons
                    name={isDone ? "checkbox" : "square-outline"}
                    size={22}
                    color={isDone ? "#10b981" : "#64748b"}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                    {task.name}
                  </Text>
                  {task.description ? (
                    <Text style={styles.taskDesc}>{task.description}</Text>
                  ) : null}

                  <View style={styles.taskMetaRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        task.priority === "HIGH"
                          ? styles.priHigh
                          : task.priority === "MEDIUM"
                          ? styles.priMedium
                          : styles.priLow,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priText,
                          task.priority === "HIGH"
                            ? styles.priTextHigh
                            : task.priority === "MEDIUM"
                            ? styles.priTextMedium
                            : styles.priTextLow,
                        ]}
                      >
                        {task.priority}
                      </Text>
                    </View>
                    <Text style={styles.dueDateText}>Due: {formatDate(task.dueDate)}</Text>
                  </View>
                </View>

                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setEditingTask(task);
                      setTaskModalVisible(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDeleteTask(task)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Task Modal */}
      {project && (
        <TaskModal
          visible={taskModalVisible}
          onClose={() => {
            setTaskModalVisible(false);
            setEditingTask(null);
          }}
          onSubmit={handleSaveTask}
          task={editingTask}
          projects={[project]}
          defaultProjectId={project.id}
        />
      )}

      {/* Edit Project Modal */}
      {project && (
        <ProjectModal
          visible={editProjectVisible}
          onClose={() => setEditProjectVisible(false)}
          onSubmit={handleSaveProject}
          project={project}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  center: {
    flex: 1,
    backgroundColor: "#0b0f19",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
    fontSize: 14,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2d44",
    backgroundColor: "#111827",
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
    marginHorizontal: 12,
  },
  navActions: {
    flexDirection: "row",
    gap: 8,
  },
  navIconBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  badgeInProgress: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  badgeNotStarted: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badgeTextCompleted: {
    color: "#34d399",
  },
  badgeTextInProgress: {
    color: "#fbbf24",
  },
  badgeTextNotStarted: {
    color: "#94a3b8",
  },
  projectName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 6,
  },
  projectDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#64748b",
    fontSize: 12,
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  progressValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#162032",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366f1",
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addTaskText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyTasksBox: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyTasksText: {
    color: "#64748b",
    marginTop: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  emptyAddBtn: {
    backgroundColor: "#162032",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  emptyAddBtnText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
  taskCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxTouch: {
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
  },
  taskTitleDone: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  taskDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priHigh: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
  },
  priMedium: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  priLow: {
    backgroundColor: "rgba(100, 116, 139, 0.15)",
  },
  priText: {
    fontSize: 10,
    fontWeight: "700",
  },
  priTextHigh: {
    color: "#f87171",
  },
  priTextMedium: {
    color: "#fbbf24",
  },
  priTextLow: {
    color: "#94a3b8",
  },
  dueDateText: {
    fontSize: 11,
    color: "#64748b",
  },
  taskActions: {
    flexDirection: "row",
    gap: 4,
    marginLeft: 6,
  },
  actionBtn: {
    padding: 6,
  },
});
