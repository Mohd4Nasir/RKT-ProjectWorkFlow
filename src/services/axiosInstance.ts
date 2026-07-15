// src/service/axiosInstance.ts - CORRECTED VERSION

import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { ensureFreshToken, getAccessToken } from "./keycloakService";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// ─── Request interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  async (config: RetryableConfig) => {
    // ✅ Step 1: Ensure token is fresh
    const refreshed = await ensureFreshToken();
    // console.log(" Token refresh status:", refreshed);

    if (!refreshed) {
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    // ✅ Step 2: Attach token to request
    const token = getAccessToken();
    // console.log(" Attaching token to request:", token);
    if (token) {
      config.headers = config.headers ?? new AxiosHeaders();

      (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
    }

    console.log("[API Request]", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    console.error(
      "[API Response Error]",
      error.response?.data,
      error.config.url,
      error.message,
      error,
    );
    const originalRequest = error.config as RetryableConfig | undefined;

    // Only handle 401 Unauthorized
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Infinite-loop guard
    if (originalRequest._retry) {
      const { performLogout } = await import("./keycloakService");
      const { store } = await import("@/store");
      const { logout } = await import("@/store/slices/authSlice");

      store.dispatch(logout());
      await performLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Attempt refresh
    const refreshed = await ensureFreshToken();

    if (!refreshed) {
      const { performLogout } = await import("./keycloakService");
      const { store } = await import("@/store");
      const { logout } = await import("@/store/slices/authSlice");

      store.dispatch(logout());
      await performLogout();
      return Promise.reject(error);
    }

    // Retry with new token
    const newToken = getAccessToken();
    console.log("Retrying request with new token:", newToken);
    if (newToken) {
      originalRequest.headers = originalRequest.headers ?? new AxiosHeaders();

      (originalRequest.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${newToken}`,
      );
    }

    return axiosInstance(originalRequest);
  },
);

export default axiosInstance;
