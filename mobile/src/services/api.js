import { Platform } from "react-native";
import { secureStorage } from "./storage";

// Default host: 10.0.2.2 for Android emulator, localhost for iOS simulator / web
export const DEFAULT_API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "http://localhost:5000/api";

let activeBaseUrl = DEFAULT_API_BASE_URL;
let unauthorizedHandler = null;

// Allow registering a listener when 401 is received
export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

// Update active base URL dynamically
export const setApiBaseUrl = (url) => {
  if (url) {
    activeBaseUrl = url.replace(/\/$/, "");
    secureStorage.saveBaseUrl(activeBaseUrl);
  }
};

export const getApiBaseUrl = () => activeBaseUrl;

// Initialize base URL from secure storage
export const initApiConfig = async () => {
  const savedUrl = await secureStorage.getBaseUrl();
  if (savedUrl) {
    activeBaseUrl = savedUrl;
  }
  return activeBaseUrl;
};

async function request(endpoint, options = {}) {
  const token = await secureStorage.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${activeBaseUrl}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Token expired or invalid
    if (response.status === 401) {
      await secureStorage.deleteToken();
      await secureStorage.deleteUser();
      const data = await response.json().catch(() => ({}));
      const message = data.message || "Your session has expired. Please log in again.";

      if (unauthorizedHandler) {
        unauthorizedHandler(message);
      }

      const error = new Error(message);
      error.status = 401;
      error.isUnauthorized = true;
      throw error;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.message ||
        (data.errors && data.errors[0]?.message) ||
        `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.isUnauthorized || err.status) {
      throw err;
    }

    // Network / connectivity errors
    const isTimeout = err.name === "AbortError";
    const netError = new Error(
      isTimeout
        ? "Network timeout: Server took too long to respond. Please check your backend."
        : "Cannot reach server. Please check your network connection and server URL."
    );
    netError.isNetworkError = true;
    netError.originalError = err;
    throw netError;
  }
}

export const mobileApi = {
  // Auth
  auth: {
    login: async (email, password) => {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (fullName, email, password) => {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password }),
      });
    },
    logout: async () => {
      return request("/auth/logout", {
        method: "POST",
      });
    },
    getMe: async () => {
      return request("/auth/me", {
        method: "GET",
      });
    },
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      return request("/dashboard", {
        method: "GET",
      });
    },
  },

  // Projects
  projects: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams();
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.sortBy) query.append("sortBy", params.sortBy);
      if (params.order) query.append("order", params.order);
      const qs = query.toString();
      return request(`/projects${qs ? `?${qs}` : ""}`);
    },
    getById: async (id) => {
      return request(`/projects/${id}`);
    },
    create: async (data) => {
      return request("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id, data) => {
      return request(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete: async (id) => {
      return request(`/projects/${id}`, {
        method: "DELETE",
      });
    },
  },

  // Tasks
  tasks: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams();
      if (params.projectId) query.append("projectId", params.projectId);
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.priority) query.append("priority", params.priority);
      if (params.sortBy) query.append("sortBy", params.sortBy);
      if (params.order) query.append("order", params.order);
      const qs = query.toString();
      return request(`/tasks${qs ? `?${qs}` : ""}`);
    },
    getById: async (id) => {
      return request(`/tasks/${id}`);
    },
    create: async (data) => {
      return request("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id, data) => {
      return request(`/tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete: async (id) => {
      return request(`/tasks/${id}`, {
        method: "DELETE",
      });
    },
  },
};
