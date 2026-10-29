// src/service/axiosInstance.ts - CORRECTED VERSION

import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";
import { ensureFreshToken, getAccessToken } from "./keycloakService";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "sonner";

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

// A burst of parallel 401s must surface as a single toast, not a stack.
const UNAUTHORIZED_TOAST_ID = "api-unauthorized";

function showUnauthorizedToast(error: AxiosError) {
  toast.error(
    getApiErrorMessage(
      error,
      "You are not authorized to perform this request.",
    ),
    {
      id: UNAUTHORIZED_TOAST_ID,
      description: "Your session may have expired. Please sign in again.",
      position: "top-center",
      duration: 6000,
      classNames: {
        toast: "!gap-2 !py-4 !pl-5 !pr-4",
        title: "!text-base !font-semibold !leading-snug",
        description: "!mt-0.5 !text-sm",
      },
    },
  );
}

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
      error.config?.url,
      error.message,
      error,
    );
    const originalRequest = error.config as RetryableConfig | undefined;

    // Refresh/retry 401 responses once, then show the API's final message.
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Retry an unauthorized request once with a refreshed token. An API 401
    // does not by itself mean the Keycloak session should be logged out; the
    // caller needs the response so it can show the server's error message.
    if (!originalRequest) {
      showUnauthorizedToast(error);
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      showUnauthorizedToast(error);
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Attempt refresh
    const refreshed = await ensureFreshToken();

    if (!refreshed) {
      showUnauthorizedToast(error);
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
