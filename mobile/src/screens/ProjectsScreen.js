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
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mobileApi } from "../services/api";
import { ProjectModal } from "../components/ProjectModal";
import { NetworkErrorBanner } from "../components/NetworkErrorBanner";

export const ProjectsScreen = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await mobileApi.projects.getAll({
        search,
        status: statusFilter,
      });
      if (res.success) {
        setProjects(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const onRefresh = () => {
    fetchProjects(true);
  };

  const handleCreateProject = async (data) => {
    await mobileApi.projects.create(data);
    fetchProjects(true);
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
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
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

      {/* Status Filter Horizontal Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {[
          { id: "", label: "All" },
          { id: "NOT_STARTED", label: "Not Started" },
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

      {error ? (
        <NetworkErrorBanner message={error} onRetry={() => fetchProjects(false)} />
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
          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={44} color="#64748b" />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySub}>
                {search || statusFilter
                  ? "Try adjusting your search or filters."
                  : "Tap '+ New' to create your first project."}
              </Text>
            </View>
          ) : (
            projects.map((proj) => {
              return (
                <TouchableOpacity
                  key={proj.id}
                  style={styles.card}
                  onPress={() => onSelectProject(proj.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{proj.name}</Text>
                    <View
                      style={[
                        styles.badge,
                        proj.status === "COMPLETED"
                          ? styles.badgeCompleted
                          : proj.status === "IN_PROGRESS"
                          ? styles.badgeInProgress
                          : styles.badgeNotStarted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          proj.status === "COMPLETED"
                            ? styles.badgeTextCompleted
                            : proj.status === "IN_PROGRESS"
                            ? styles.badgeTextInProgress
                            : styles.badgeTextNotStarted,
                        ]}
                      >
                        {proj.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>

                  {proj.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {proj.description}
                    </Text>
                  ) : null}

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Progress</Text>
                      <Text style={styles.progressText}>
                        {proj.completedTasksCount} / {proj.tasksCount} tasks ({proj.progressPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${proj.progressPercentage}%` },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                      {formatDate(proj.startDate)} &ndash; {formatDate(proj.endDate)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#64748b" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Create Modal */}
      <ProjectModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateProject}
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
    marginBottom: 10,
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
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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
    fontSize: 12,
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
  card: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
    marginRight: 8,
  },
  cardDesc: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2d44",
  },
  dateText: {
    color: "#64748b",
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
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
    fontSize: 10,
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
});
