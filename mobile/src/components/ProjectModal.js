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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const ProjectModal = ({ visible, onClose, onSubmit, project = null }) => {
  const isEditing = !!project;

  const getTodayString = () => new Date().toISOString().split("T")[0];
  const getFutureString = (days = 14) => {
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

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("NOT_STARTED");
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getFutureString(14));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
      setStatus(project.status || "NOT_STARTED");
      setStartDate(formatDateForInput(project.startDate) || getTodayString());
      setEndDate(formatDateForInput(project.endDate) || getFutureString(14));
    } else {
      setName("");
      setDescription("");
      setStatus("NOT_STARTED");
      setStartDate(getTodayString());
      setEndDate(getFutureString(14));
    }
    setError("");
  }, [project, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!startDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      setError("Please enter a valid start date (YYYY-MM-DD).");
      return;
    }
    if (!endDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      setError("Please enter a valid end date (YYYY-MM-DD).");
      return;
    }
    if (new Date(endDate.trim()) < new Date(startDate.trim())) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        status,
        startDate: new Date(startDate.trim()).toISOString(),
        endDate: new Date(endDate.trim()).toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save project.");
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
            <Text style={styles.title}>{isEditing ? "Edit Project" : "New Project"}</Text>
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

            {/* Project Name */}
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Website Redesign"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            {/* Description */}
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Project goals and deliverables..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Status */}
            <Text style={styles.label}>Status</Text>
            <View style={styles.row}>
              {[
                { id: "NOT_STARTED", label: "Not Started" },
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

            {/* Dates */}
            <Text style={styles.label}>Start Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.label}>End Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748b"
              value={endDate}
              onChangeText={setEndDate}
            />
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
                <Text style={styles.submitText}>{isEditing ? "Save Changes" : "Create Project"}</Text>
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
    maxHeight: "85%",
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
  choiceStatusSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#4f46e5",
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
