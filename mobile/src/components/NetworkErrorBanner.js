import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const NetworkErrorBanner = ({ message, onRetry }) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Ionicons name="cloud-offline" size={20} color="#fca5a5" />
        <Text style={styles.text}>{message}</Text>
      </View>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  text: {
    color: "#fca5a5",
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  retryBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
