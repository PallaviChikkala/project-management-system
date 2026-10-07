import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mobileApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { NetworkErrorBanner } from "../components/NetworkErrorBanner";

export const DashboardScreen = ({ onNavigateTab, onSelectProject }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const res = await mobileApi.dashboard.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    fetchDashboard(true);
  };

  const handleToggleTask = async (task) => {
    try {
      const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
      await mobileApi.tasks.update(task.id, { status: newStatus });
      fetchDashboard(true);
    } catch (err) {
      setError(err.message || "Failed to update task");
    }
  };

  if (loading && !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Welcome header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.fullName || "User"}</Text>
          <Text style={styles.subGreeting}>Project &amp; Task Performance Overview</Text>
        </View>

        {error ? (
          <NetworkErrorBanner message={error} onRetry={() => fetchDashboard(false)} />
        ) : null}

        {/* 5 Mandatory Metrics */}
        <View style={styles.statsGrid}>
          {/* Total Projects */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Total Projects</Text>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
                <Ionicons name="folder" size={18} color="#6366f1" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats?.totalProjects ?? 0}</Text>
            <Text style={styles.statSub}>
              {stats?.projectsCompleted ?? 0} Completed
            </Text>
          </View>

          {/* Total Tasks */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Total Tasks</Text>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                <Ionicons name="layers" size={18} color="#8b5cf6" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats?.totalTasks ?? 0}</Text>
            <Text style={styles.statSub}>
              {stats?.taskCompletionRate ?? 0}% Finished
            </Text>
          </View>

          {/* Completed Tasks */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Completed Tasks</Text>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats?.completedTasks ?? 0}</Text>
            <Text style={[styles.statSub, { color: "#10b981" }]}>Done</Text>
          </View>

          {/* Pending Tasks */}
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Pending Tasks</Text>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(14, 165, 233, 0.15)" }]}>
                <Ionicons name="time" size={18} color="#0ea5e9" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats?.pendingTasks ?? 0}</Text>
            <Text style={[styles.statSub, { color: "#0ea5e9" }]}>Action Required</Text>
          </View>

          {/* Projects In Progress (Full Width Card) */}
          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statTop}>
              <Text style={styles.statLabel}>Projects In Progress</Text>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Ionicons name="pulse" size={18} color="#f59e0b" />
              </View>
            </View>
            <Text style={styles.statValue}>{stats?.projectsInProgress ?? 0}</Text>
            <Text style={[styles.statSub, { color: "#f59e0b" }]}>
              Active &amp; tracking deliverables
            </Text>
          </View>
        </View>

        {/* Recent Projects */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity onPress={() => onNavigateTab("projects")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {stats?.recentProjects?.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No projects created yet.</Text>
            </View>
          ) : (
            stats?.recentProjects?.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.recentItem}
                onPress={() => onSelectProject(p.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{p.name}</Text>
                  <Text style={styles.recentMeta}>
                    {p._count?.tasks || 0} tasks &bull; {p.status.replace("_", " ")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#64748b" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => onNavigateTab("tasks")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {stats?.upcomingTasks?.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No urgent tasks pending.</Text>
            </View>
          ) : (
            stats?.upcomingTasks?.map((t) => {
              const isDone = t.status === "COMPLETED";
              return (
                <View key={t.id} style={styles.taskItem}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleToggleTask(t)}
                  >
                    <Ionicons
                      name={isDone ? "checkbox" : "square-outline"}
                      size={20}
                      color={isDone ? "#10b981" : "#64748b"}
                    />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitle, isDone && styles.taskDone]}>
                      {t.name}
                    </Text>
                    <Text style={styles.taskMeta}>
                      {t.project?.name} &bull; Priority: {t.priority}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
  },
  subGreeting: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 14,
    padding: 14,
    width: "48%",
  },
  statCardWide: {
    width: "100%",
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#f8fafc",
  },
  statSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
  },
  viewAllText: {
    color: "#6366f1",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyBox: {
    backgroundColor: "#111827",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2d44",
    padding: 16,
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 13,
  },
  recentItem: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  recentMeta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  taskItem: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    marginRight: 10,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f8fafc",
  },
  taskDone: {
    textDecorationLine: "line-through",
    color: "#64748b",
  },
  taskMeta: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});
