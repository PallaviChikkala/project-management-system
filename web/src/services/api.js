const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Retrieve stored token
export const getToken = () => localStorage.getItem("pms_token");
export const setToken = (token) => {
  if (token) {
    localStorage.setItem("pms_token", token);
  } else {
    localStorage.removeItem("pms_token");
  }
};

// Generic fetch wrapper
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle relative vs absolute endpoint
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expired
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      // Dispatch an event so AuthContext can handle logout and UI can notify
      window.dispatchEvent(
        new CustomEvent("pms:unauthorized", {
          detail: { message: data.message || "Session expired. Please log in again." },
        })
      );
      throw new ApiError(data.message || "Unauthorized or session expired", 401, data);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data.message || (data.errors && data.errors[0]?.message) || `Request failed (${response.status})`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors or offline
    throw new ApiError(
      error.message || "Network error. Please check your internet connection.",
      0,
      null
    );
  }
}

// Auth API
export const authApi = {
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
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    return request("/dashboard", {
      method: "GET",
    });
  },
};

// Projects API
export const projectsApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.order) query.append("order", params.order);
    const queryString = query.toString();
    return request(`/projects${queryString ? `?${queryString}` : ""}`);
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
};

// Tasks API
export const tasksApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.projectId) query.append("projectId", params.projectId);
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.priority) query.append("priority", params.priority);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.order) query.append("order", params.order);
    const queryString = query.toString();
    return request(`/tasks${queryString ? `?${queryString}` : ""}`);
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
};
