import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { NetworkErrorBanner } from "../components/NetworkErrorBanner";

export const AuthScreen = () => {
  const {
    login,
    register,
    sessionExpiredMessage,
    clearSessionMessage,
    serverUrl,
    updateServerUrl,
  } = useAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
    clearSessionMessage();
  };

  const validate = () => {
    if (mode === "register") {
      if (!fullName.trim()) {
        setError("Full name is required.");
        return false;
      }
      if (fullName.trim().length < 2) {
        setError("Full name must be at least 2 characters.");
        return false;
      }
    }

    if (!email.trim()) {
      setError("Email address is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError("");
    clearSessionMessage();

    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(fullName.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please check credentials or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    updateServerUrl(customUrl.trim());
    setShowServerConfig(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Ionicons name="briefcase" size={32} color="#ffffff" />
            </View>
            <Text style={styles.title}>Project Management</Text>
            <Text style={styles.subtitle}>Mobile &amp; Web Unified System</Text>
          </View>

          {/* Session Expired Notice */}
          {sessionExpiredMessage ? (
            <View style={styles.warningBox}>
              <Ionicons name="time" size={18} color="#f59e0b" />
              <Text style={styles.warningText}>{sessionExpiredMessage}</Text>
            </View>
          ) : null}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === "login" && styles.tabActive]}
              onPress={() => handleModeChange("login")}
            >
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "register" && styles.tabActive]}
              onPress={() => handleModeChange("register")}
            >
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === "register" && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Alex Rivera"
                    placeholderTextColor="#64748b"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Server Config Toggle */}
          <View style={styles.serverSection}>
            <TouchableOpacity
              style={styles.serverToggle}
              onPress={() => setShowServerConfig(!showServerConfig)}
            >
              <Ionicons name="server-outline" size={14} color="#64748b" />
              <Text style={styles.serverToggleText}>
                Backend: {serverUrl} ({showServerConfig ? "hide" : "change"})
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.serverConfigBox}>
                <Text style={styles.serverConfigLabel}>Backend API URL:</Text>
                <TextInput
                  style={styles.serverInput}
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.serverSaveBtn}
                  onPress={handleSaveServerUrl}
                >
                  <Text style={styles.serverSaveBtnText}>Save API URL</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            <Text style={styles.securityText}>
              Secure Android Keystore / iOS Keychain token storage
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: "center",
    flexGrow: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#6366f1",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
  },
  subtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: "#fbbf24",
    fontSize: 13,
    flex: 1,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 13,
    flex: 1,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#162032",
  },
  tabText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  form: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2d44",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: "#f8fafc",
    paddingVertical: 10,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  serverSection: {
    marginTop: 18,
    alignItems: "center",
  },
  serverToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serverToggleText: {
    color: "#64748b",
    fontSize: 11,
  },
  serverConfigBox: {
    width: "100%",
    backgroundColor: "#111827",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1f2d44",
    marginTop: 8,
  },
  serverConfigLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginBottom: 4,
  },
  serverInput: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#1f2d44",
    borderRadius: 6,
    padding: 8,
    color: "#f8fafc",
    fontSize: 12,
  },
  serverSaveBtn: {
    backgroundColor: "#162032",
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#6366f1",
  },
  serverSaveBtnText: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "600",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    color: "#64748b",
    fontSize: 11,
  },
});
