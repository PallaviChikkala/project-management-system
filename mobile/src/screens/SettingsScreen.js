import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export const SettingsScreen = () => {
  const { user, logout, serverUrl, updateServerUrl } = useAuth();
  const [urlInput, setUrlInput] = useState(serverUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string }

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const testUrl = urlInput.replace(/\/$/, "");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${testUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: "Connected successfully! Server is healthy.",
        });
        updateServerUrl(testUrl);
      } else {
        setTestResult({
          success: false,
          message: `Server responded with status ${res.status}.`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err.name === "AbortError"
            ? "Connection timed out."
            : "Cannot reach server. Check IP and port.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings &amp; Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.fullName || "User"}</Text>
              <Text style={styles.userEmail}>{user?.email || "No email"}</Text>
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.verifiedText}>Verified Account</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Token Info */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="shield-checkmark" size={18} color="#10b981" />
            <Text style={styles.sectionTitle}>Security &amp; Storage</Text>
          </View>
          <Text style={styles.infoText}>
            Device Storage:{" "}
            <Text style={{ color: "#f8fafc", fontWeight: "600" }}>
              {Platform.OS === "android"
                ? "Android Keystore (Hardware-Backed)"
                : Platform.OS === "ios"
                ? "iOS Keychain"
                : "Secure Storage"}
            </Text>
          </Text>
          <Text style={styles.infoSubText}>
            Tokens are encrypted at rest using system-level cryptography.
          </Text>
        </View>

        {/* Backend API Configuration */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="server-outline" size={18} color="#6366f1" />
            <Text style={styles.sectionTitle}>Backend Connection</Text>
          </View>
          <Text style={styles.label}>API Base URL:</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.testBtnText}>Test &amp; Save</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                const defaultUrl =
                  Platform.OS === "android"
                    ? "http://10.0.2.2:5000/api"
                    : "http://localhost:5000/api";
                setUrlInput(defaultUrl);
                updateServerUrl(defaultUrl);
                setTestResult(null);
              }}
            >
              <Text style={styles.resetBtnText}>Reset Default</Text>
            </TouchableOpacity>
          </View>

          {testResult && (
            <View
              style={[
                styles.resultBox,
                testResult.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Ionicons
                name={testResult.success ? "checkmark-circle" : "alert-circle"}
                size={16}
                color={testResult.success ? "#10b981" : "#ef4444"}
              />
              <Text
                style={[
                  styles.resultText,
                  testResult.success ? styles.resultTextSuccess : styles.resultTextError,
                ]}
              >
                {testResult.message}
              </Text>
            </View>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
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
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
  },
  userName: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
  },
  userEmail: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  verifiedText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "600",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700",
  },
  infoText: {
    color: "#94a3b8",
    fontSize: 13,
  },
  infoSubText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#f8fafc",
    fontSize: 13,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6366f1",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  testBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  resetBtn: {
    backgroundColor: "#162032",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  resetBtnText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  resultSuccess: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  resultError: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  resultText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  resultTextSuccess: {
    color: "#34d399",
  },
  resultTextError: {
    color: "#fca5a5",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontWeight: "700",
  },
});
