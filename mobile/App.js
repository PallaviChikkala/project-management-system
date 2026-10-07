import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { ProjectsScreen } from "./src/screens/ProjectsScreen";
import { ProjectDetailScreen } from "./src/screens/ProjectDetailScreen";
import { TasksScreen } from "./src/screens/TasksScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

function MainApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'projects' | 'tasks' | 'settings'
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing PMS mobile...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen />
      </>
    );
  }

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveTab("projects");
  };

  const handleBackFromDetail = () => {
    setSelectedProjectId(null);
  };

  const navTabs = [
    { id: "dashboard", label: "Dashboard", icon: "pie-chart" },
    { id: "projects", label: "Projects", icon: "folder" },
    { id: "tasks", label: "Tasks", icon: "checkbox" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Screen Body */}
      <View style={styles.content}>
        {activeTab === "dashboard" && (
          <DashboardScreen
            onNavigateTab={(tab) => {
              setSelectedProjectId(null);
              setActiveTab(tab);
            }}
            onSelectProject={handleSelectProject}
          />
        )}

        {activeTab === "projects" &&
          (selectedProjectId ? (
            <ProjectDetailScreen
              projectId={selectedProjectId}
              onBack={handleBackFromDetail}
              onProjectDeleted={handleBackFromDetail}
            />
          ) : (
            <ProjectsScreen onSelectProject={handleSelectProject} />
          ))}

        {activeTab === "tasks" && (
          <TasksScreen
            onNavigateProjects={() => {
              setSelectedProjectId(null);
              setActiveTab("projects");
            }}
          />
        )}

        {activeTab === "settings" && <SettingsScreen />}
      </View>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.tabBar}>
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabBtn}
              onPress={() => {
                if (tab.id === "projects" && activeTab === "projects") {
                  // Tap again to go back to list
                  setSelectedProjectId(null);
                } else if (tab.id !== "projects") {
                  setSelectedProjectId(null);
                }
                setActiveTab(tab.id);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={22}
                color={isActive ? "#6366f1" : "#64748b"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f19",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0b0f19",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#111827",
    borderTopWidth: 1,
    borderTopColor: "#1f2d44",
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  tabLabelActive: {
    color: "#6366f1",
    fontWeight: "700",
  },
});
