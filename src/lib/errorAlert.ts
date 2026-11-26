import axios from "axios";
import Swal, { SweetAlertOptions } from "sweetalert2";

/**
 * One place for every error popup in the app (Swal.fire).
 *
 *   showError(err, "Failed to create task")  -> title = what failed, text = why (from the API)
 *   showWarning("Enter a task name")         -> form validation
 */

/* ───────────────────────── reading the reason out of an error ───────────────────────── */

const STATUS_TEXT: Record<number, string> = {
  400: "The request was invalid. Please check the details and try again.",
  401: "You are not authorized to perform this action.",
  403: "Your role doesn't allow this action. Contact your administrator.",
  404: "The requested item was not found. It may have been deleted.",
  405: "This action is not supported by the server.",
  408: "The server took too long to respond. Please try again.",
  409: "This conflicts with the current data. Refresh and try again.",
  413: "The file or request is too large.",
  415: "This file type is not supported.",
  422: "Some of the details are not valid. Please check and try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "The server ran into an error. Please try again later.",
  502: "The server is temporarily unavailable. Please try again in a moment.",
  503: "The server is temporarily unavailable. Please try again in a moment.",
  504: "The server is temporarily unavailable. Please try again in a moment.",
};

/** bare HTTP reason phrases say nothing useful to a user */
const GENERIC = /^(bad request|unauthorized|forbidden|not found|method not allowed|conflict|internal server error|bad gateway|service unavailable|gateway timeout)$/i;

const clean = (v: unknown): string => {
  if (typeof v !== "string") return "";
  const s = v.trim();
  // HTML / XML error pages (proxy, object storage) are not messages
  if (!s || s.startsWith("<") || GENERIC.test(s)) return "";
  return s;
};

/** the message the backend sent, including per-field validation errors */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serverMessage(data: any, status?: number): string {
  if (!data) return "";
  if (typeof data === "string") return clean(data);

  const lines: string[] = [];
  const addField = (field: string, msg: unknown) => {
    const text = clean(msg);
    if (text) lines.push(field ? `${field}: ${text}` : text);
  };

  // validation details: errors: [..] | errors: {field: msg} | data: {field: msg} on a 400/422
  const details =
    data.errors ?? data.fieldErrors ?? ((status === 400 || status === 422) ? data.data : undefined);
  if (Array.isArray(details)) {
    details.forEach((e) =>
      typeof e === "string" ? addField("", e) : addField(e?.field ?? "", e?.defaultMessage ?? e?.message),
    );
  } else if (details && typeof details === "object") {
    Object.entries(details).forEach(([k, v]) => addField(k, v));
  }

  const main =
    clean(data.message) || clean(data.error_description) || clean(data.detail) || clean(data.error);

  return [...new Set([main, ...lines].filter(Boolean))].join("\n");
}

/** Best human readable reason for any thrown value. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof err === "string") return err || fallback;

  if (axios.isAxiosError(err)) {
    const res = err.response;
    if (!res) {
      if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") return STATUS_TEXT[408];
      return "Can't reach the server. Check your connection and try again.";
    }
    return serverMessage(res.data, res.status) || STATUS_TEXT[res.status] || `${fallback} (error ${res.status})`;
  }

  return (err as Error | undefined)?.message || fallback;
}

/* ───────────────────────── the popup ───────────────────────── */

interface Alert {
  key: string;
  options: SweetAlertOptions;
  onConfirm?: () => void;
}

// Swal shows one dialog at a time (a second fire() replaces the first), so queue them.
const queue: Alert[] = [];
const pending = new Set<string>(); // open or waiting: identical errors are shown once
const handled = new WeakSet<object>(); // an error object that already had its popup
let draining = false;

async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    const { key, options, onConfirm } = queue.shift()!;
    try {
      const result = await Swal.fire({
        confirmButtonText: "OK",
        heightAuto: false, // keeps the full-height app layout intact
        // look and animation live in index.css (.rkt-swal*)
        buttonsStyling: false,
        reverseButtons: true, // main action on the right
        showClass: { popup: "rkt-swal-in" },
        hideClass: { popup: "rkt-swal-out" },
        customClass: {
          popup: "rkt-swal",
          title: "rkt-swal-title",
          htmlContainer: "rkt-swal-text whitespace-pre-line break-words",
          actions: "rkt-swal-actions",
          confirmButton: "rkt-swal-btn rkt-swal-btn-primary",
          cancelButton: "rkt-swal-btn rkt-swal-btn-secondary",
        },
        ...options,
      } as SweetAlertOptions);
      if (result.isConfirmed) onConfirm?.();
    } finally {
      pending.delete(key);
    }
  }
  draining = false;
}

export function enqueueAlert(alert: Alert) {
  if (pending.has(alert.key)) return;
  pending.add(alert.key);
  queue.push(alert);
  void drain();
}

/** Show an API / runtime error. `title` says what failed; the reason comes from the error. */
export function showError(err: unknown, title = "Something went wrong") {
  if (axios.isCancel(err)) return;

  if (err && typeof err === "object") {
    if (handled.has(err)) return; // re-thrown error that was already shown
    handled.add(err);
    // the "session expired" popup (with the log-in button) is already on screen
    if ((err as { sessionExpired?: boolean }).sessionExpired) return;
  }

  const text = getErrorMessage(err, "Please try again.");
  // connection / permission / server-down problems hit many calls at once: one popup is enough
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const global = axios.isAxiosError(err) && (!status || [401, 403, 502, 503, 504].includes(status));

  enqueueAlert({
    key: global ? `global|${text}` : `${title}|${text}`,
    options: { icon: "error", title, text },
  });
}

/** Form validation and other "please fix this" messages. */
export function showWarning(message: string) {
  enqueueAlert({
    key: `warning|${message}`,
    options: { icon: "warning", title: "Please check", text: message },
  });
}

/* ───────────────────────── global wiring ───────────────────────── */

const inSwal = (n: EventTarget | null) => n instanceof Element && !!n.closest(".swal2-container");

if (typeof window !== "undefined") {
  // The popup can open above a drawer / modal. These capture listeners are registered before any
  // component mounts, so clicking or pressing Esc on the popup doesn't also close what's behind it.
  ["pointerdown", "mousedown", "touchstart", "focusin"].forEach((type) =>
    window.addEventListener(type, (e) => { if (inSwal(e.target)) e.stopPropagation(); }, true),
  );
  // focus traps of open dialogs would otherwise pull focus back out of the popup
  window.addEventListener("focusout", (e) => { if (inSwal(e.relatedTarget)) e.stopPropagation(); }, true);
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && document.querySelector(".swal2-container")) {
        e.stopImmediatePropagation();
        e.preventDefault();
        Swal.close();
      }
    },
    true,
  );

  // safety net: an API error nobody caught still reaches the user
  window.addEventListener("unhandledrejection", (e) => {
    if (axios.isAxiosError(e.reason)) showError(e.reason, "Request failed");
  });
}
