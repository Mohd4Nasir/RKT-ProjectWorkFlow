// src/service/axiosInstance.ts - CORRECTED VERSION

import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { ensureFreshToken, getAccessToken } from "./keycloakService";
import {
  notifyForbidden,
  notifyNetworkError,
  notifySessionExpired,
  notifyUnauthorized,
} from "./authErrors";

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
      // Don't redirect / log out here - just tell the user.
      notifySessionExpired();
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
      error.config?.url,
      error.message,
    );

    // No response at all -> server unreachable / CORS / timeout
    if (!error.response) {
      if (error.code === "ERR_NETWORK") notifyNetworkError();
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 403) {
      notifyForbidden();
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableConfig | undefined;

    // Everything except 401 is handled by the caller
    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Already retried once with a fresh token and still 401:
    // this is a permission problem on that endpoint, NOT an expired session.
    if (originalRequest._retry) {
      notifyUnauthorized();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Attempt refresh
    const refreshed = await ensureFreshToken();

    if (!refreshed) {
      notifySessionExpired();
      return Promise.reject(error);
    }

    // Retry with new token
    const newToken = getAccessToken();
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
