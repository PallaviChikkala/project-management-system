import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, setToken, getToken } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null);
      setTokenState(null);
      setUser(null);
    }
  }, []);

  // Validate session on app launch
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          setTokenState(storedToken);
        } else {
          logout();
        }
      } catch {
        // Token was invalid or expired
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [logout]);

  // Listen for unauthorized 401 events from api client
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const msg = e.detail?.message || "Your session has expired. Please log in again.";
      setSessionExpiredMessage(msg);
      setToken(null);
      setTokenState(null);
      setUser(null);
    };

    window.addEventListener("pms:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("pms:unauthorized", handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setSessionExpiredMessage("");
    const response = await authApi.login(email, password);
    if (response.success && response.token) {
      setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
    }
    return response;
  };

  const register = async (fullName, email, password) => {
    setSessionExpiredMessage("");
    const response = await authApi.register(fullName, email, password);
    if (response.success && response.token) {
      setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
    }
    return response;
  };

  const clearSessionMessage = () => {
    setSessionExpiredMessage("");
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    sessionExpiredMessage,
    clearSessionMessage,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
