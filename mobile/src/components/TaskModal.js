import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const TaskModal = ({
  visible,
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

  const [projectId, setProjectId] = useState(
    defaultProjectId || (projects[0]?.id ? String(projects[0].id) : "")
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("PENDING");
  const [dueDate, setDueDate] = useState(getFutureString(7));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setProjectId(String(task.projectId));
      setName(task.name || "");
      setDescription(task.description || "");
      setPriority(task.priority || "MEDIUM");
      setStatus(task.status || "PENDING");
      setDueDate(formatDateForInput(task.dueDate) || getFutureString(7));
    } else {
      setProjectId(
        defaultProjectId
          ? String(defaultProjectId)
          : projects[0]?.id
          ? String(projects[0].id)
          : ""
      );
      setName("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus("PENDING");
      setDueDate(getFutureString(7));
    }
    setError("");
  }, [task, defaultProjectId, projects, visible]);

  const handleSave = async () => {
    if (!projectId) {
      setError("Please select a project.");
      return;
    }
    if (!name.trim()) {
      setError("Task name is required.");
      return;
    }
    if (!dueDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
      setError("Please enter a valid due date (YYYY-MM-DD).");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        projectId: parseInt(projectId, 10),
        name: name.trim(),
        description: description.trim() || null,
        priority,
        status,
        dueDate: new Date(dueDate.trim()).toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? "Edit Task" : "New Task"}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Select Project */}
            <Text style={styles.label}>Project *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {projects.map((p) => {
                const isSelected = String(p.id) === String(projectId);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setProjectId(String(p.id))}
                    disabled={isEditing}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Task Name */}
            <Text style={styles.label}>Task Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Design app mockup"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Task details and instructions..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Priority */}
            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {["LOW", "MEDIUM", "HIGH"].map((p) => {
                const isSelected = priority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.choicePill,
                      isSelected &&
                        (p === "HIGH"
                          ? styles.choiceHigh
                          : p === "MEDIUM"
                          ? styles.choiceMedium
                          : styles.choiceLow),
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isSelected && { color: "#ffffff", fontWeight: "700" },
                      ]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Status */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.row}>
              {[
                { id: "PENDING", label: "Pending" },
                { id: "IN_PROGRESS", label: "In Progress" },
                { id: "COMPLETED", label: "Completed" },
              ].map((s) => {
                const isSelected = status === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.choicePill, isSelected && styles.choiceStatusSelected]}
                    onPress={() => setStatus(s.id)}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        isSelected && { color: "#ffffff", fontWeight: "700" },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Due Date */}
            <Text style={styles.label}>Due Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={dueDate}
              onChangeText={setDueDate}
            />

            {/* Quick date presets */}
            <View style={[styles.row, { marginTop: 6 }]}>
              {[
                { label: "+3 Days", days: 3 },
                { label: "+1 Week", days: 7 },
                { label: "+2 Weeks", days: 14 },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={styles.presetBtn}
                  onPress={() => setDueDate(getFutureString(preset.days))}
                >
                  <Text style={styles.presetText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitText}>{isEditing ? "Save Changes" : "Create Task"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2d44",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
  },
  body: {
    padding: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    fontSize: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  pillRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#162032",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  pillSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#4f46e5",
  },
  pillText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  pillTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  choicePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#162032",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  choiceText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  choiceHigh: {
    backgroundColor: "#dc2626",
    borderColor: "#ef4444",
  },
  choiceMedium: {
    backgroundColor: "#d97706",
    borderColor: "#f59e0b",
  },
  choiceLow: {
    backgroundColor: "#475569",
    borderColor: "#64748b",
  },
  choiceStatusSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#4f46e5",
  },
  presetBtn: {
    backgroundColor: "#162032",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  presetText: {
    color: "#6366f1",
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2d44",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#162032",
  },
  cancelText: {
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: 14,
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6366f1",
  },
  submitText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
