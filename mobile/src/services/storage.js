import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "pms_secure_token";
const USER_KEY = "pms_secure_user";
const BASE_URL_KEY = "pms_api_base_url";

// Memory fallback for environments where SecureStore isn't supported (e.g. web preview)
const memoryStorage = {};

const isSecureStoreAvailable = async () => {
  if (Platform.OS === "web") return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const secureStorage = {
  // Token methods
  saveToken: async (token) => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        memoryStorage[TOKEN_KEY] = token;
      }
    } catch (e) {
      console.warn("SecureStore error saving token:", e);
      memoryStorage[TOKEN_KEY] = token;
    }
  },

  getToken: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      }
      return memoryStorage[TOKEN_KEY] || null;
    } catch (e) {
      console.warn("SecureStore error getting token:", e);
      return memoryStorage[TOKEN_KEY] || null;
    }
  },

  deleteToken: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
      delete memoryStorage[TOKEN_KEY];
    } catch (e) {
      console.warn("SecureStore error deleting token:", e);
      delete memoryStorage[TOKEN_KEY];
    }
  },

  // User info methods
  saveUser: async (user) => {
    const serialized = JSON.stringify(user);
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(USER_KEY, serialized);
      } else {
        memoryStorage[USER_KEY] = serialized;
      }
    } catch {
      memoryStorage[USER_KEY] = serialized;
    }
  },

  getUser: async () => {
    try {
      const available = await isSecureStoreAvailable();
      const raw = available
        ? await SecureStore.getItemAsync(USER_KEY)
        : memoryStorage[USER_KEY];
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  deleteUser: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.deleteItemAsync(USER_KEY);
      }
      delete memoryStorage[USER_KEY];
    } catch {
      delete memoryStorage[USER_KEY];
    }
  },

  // Custom API Base URL configuration
  saveBaseUrl: async (url) => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(BASE_URL_KEY, url);
      }
      memoryStorage[BASE_URL_KEY] = url;
    } catch {
      memoryStorage[BASE_URL_KEY] = url;
    }
  },

  getBaseUrl: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        const url = await SecureStore.getItemAsync(BASE_URL_KEY);
        if (url) return url;
      }
      return memoryStorage[BASE_URL_KEY] || null;
    } catch {
      return memoryStorage[BASE_URL_KEY] || null;
    }
  },
};
