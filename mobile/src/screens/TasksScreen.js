import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mobileApi } from "../services/api";
import { TaskModal } from "../components/TaskModal";
import { NetworkErrorBanner } from "../components/NetworkErrorBanner";

export const TasksScreen = ({ onNavigateProjects }) => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasksAndProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [tasksRes, projsRes] = await Promise.all([
        mobileApi.tasks.getAll({
          search,
          status: statusFilter,
          priority: priorityFilter,
          projectId: selectedProjectId,
        }),
        mobileApi.projects.getAll(),
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
      setRefreshing(false);
    }
  }, [search, statusFilter, priorityFilter, selectedProjectId]);

  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  const onRefresh = () => {
    fetchTasksAndProjects(true);
  };

  const handleToggleTask = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await mobileApi.tasks.update(task.id, { status: newStatus });
      fetchTasksAndProjects(true);
    } catch (err) {
      Alert.alert("Error", err.message || "Could not update task.");
    }
  };

  const handleSaveTask = async (data) => {
    if (editingTask) {
      await mobileApi.tasks.update(editingTask.id, data);
    } else {
      await mobileApi.tasks.create(data);
    }
    fetchTasksAndProjects(true);
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
              fetchTasksAndProjects(true);
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to delete task.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (projects.length === 0) {
              Alert.alert(
                "Create Project First",
                "You need to create at least one project before adding tasks.",
                [
                  { text: "Go to Projects", onPress: onNavigateProjects },
                  { text: "Cancel", style: "cancel" },
                ]
              );
              return;
            }
            setEditingTask(null);
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Row - Status */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Text style={styles.filterLabel}>Status:</Text>
        {[
          { id: "", label: "All" },
          { id: "PENDING", label: "Pending" },
          { id: "IN_PROGRESS", label: "In Progress" },
          { id: "COMPLETED", label: "Completed" },
        ].map((tab) => {
          const isSelected = statusFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setStatusFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter Row - Priority */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterRow, { marginTop: 4, marginBottom: 10 }]}
      >
        <Text style={styles.filterLabel}>Priority:</Text>
        {[
          { id: "", label: "All" },
          { id: "HIGH", label: "High" },
          { id: "MEDIUM", label: "Medium" },
          { id: "LOW", label: "Low" },
        ].map((tab) => {
          const isSelected = priorityFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setPriorityFilter(tab.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error ? (
        <NetworkErrorBanner message={error} onRetry={() => fetchTasksAndProjects(false)} />
      ) : null}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
              colors={["#6366f1"]}
            />
          }
        >
          {tasks.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkbox-outline" size={44} color="#64748b" />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySub}>
                {search || statusFilter || priorityFilter
                  ? "No tasks match your filters. Try clearing them."
                  : projects.length === 0
                  ? "Create a project first, then add tasks."
                  : "Tap '+ New' to create a task."}
              </Text>
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
                      <Text style={styles.taskDesc} numberOfLines={2}>
                        {task.description}
                      </Text>
                    ) : null}

                    <View style={styles.taskMetaRow}>
                      {task.project?.name && (
                        <Text style={styles.projectNameText} numberOfLines={1}>
                          📁 {task.project.name}
                        </Text>
                      )}

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

                      <Text style={styles.dueDateText}>
                        Due: {formatDate(task.dueDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        setEditingTask(task);
                        setModalVisible(true);
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
      )}

      {/* Task Modal */}
      <TaskModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        task={editingTask}
        projects={projects}
      />
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
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111827",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  searchInput: {
    flex: 1,
    color: "#f8fafc",
    fontSize: 14,
  },
  filterRow: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 6,
  },
  filterLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginRight: 4,
    textTransform: "uppercase",
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  filterChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#4f46e5",
  },
  filterChipText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySub: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
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
    flexWrap: "wrap",
  },
  projectNameText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
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
