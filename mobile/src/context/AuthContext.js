import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { secureStorage } from "../services/storage";
import {
  mobileApi,
  initApiConfig,
  setUnauthorizedHandler,
  setApiBaseUrl,
  getApiBaseUrl,
} from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  const logout = useCallback(async () => {
    try {
      await mobileApi.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      await secureStorage.deleteToken();
      await secureStorage.deleteUser();
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Register 401 callback
    setUnauthorizedHandler((message) => {
      setSessionExpiredMessage(message || "Your session has expired. Please log in again.");
      setToken(null);
      setUser(null);
    });

    const initAuth = async () => {
      try {
        const activeUrl = await initApiConfig();
        setServerUrl(activeUrl);

        const storedToken = await secureStorage.getToken();
        if (storedToken) {
          try {
            const res = await mobileApi.auth.getMe();
            if (res.success && res.user) {
              setUser(res.user);
              setToken(storedToken);
              await secureStorage.saveUser(res.user);
            } else {
              await logout();
            }
          } catch {
            await logout();
          }
        }
      } catch (err) {
        console.warn("Auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  const login = async (email, password) => {
    setSessionExpiredMessage("");
    const res = await mobileApi.auth.login(email, password);
    if (res.success && res.token) {
      await secureStorage.saveToken(res.token);
      await secureStorage.saveUser(res.user);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (fullName, email, password) => {
    setSessionExpiredMessage("");
    const res = await mobileApi.auth.register(fullName, email, password);
    if (res.success && res.token) {
      await secureStorage.saveToken(res.token);
      await secureStorage.saveUser(res.user);
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const updateServerUrl = (newUrl) => {
    setApiBaseUrl(newUrl);
    setServerUrl(newUrl);
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
    serverUrl,
    updateServerUrl,
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
