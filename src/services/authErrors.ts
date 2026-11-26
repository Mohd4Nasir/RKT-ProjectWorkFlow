import { enqueueAlert } from "@/lib/errorAlert";

/**
 * Auth problems are SHOWN to the user, never used as a reason to silently kick
 * them out of the app. The only places that log the user out are the explicit
 * Logout actions (header menu / useAuth.logout) and the "Log in again" button
 * offered below.
 *
 * 401 / 403 / network errors are shown by showError() where the call was made.
 */

/** Thrown (or flagged on an API error) once the session-expired popup has been requested. */
export class SessionExpiredError extends Error {
  sessionExpired = true;
  constructor() {
    super("Session expired. Please log in again.");
  }
}

async function logoutNow() {
  const { store } = await import("@/store");
  const { logout } = await import("@/store/slices/authSlice");
  const { performLogout } = await import("./keycloakService");
  store.dispatch(logout());
  await performLogout(`${window.location.origin}/login`);
}

/** the background token timer fails every few seconds: don't reopen the popup each time */
const BACKGROUND_COOLDOWN = 5 * 60_000;
let lastShown = 0;

/** Token can't be refreshed any more (idle too long / session revoked). */
export function notifySessionExpired({ background = false } = {}) {
  if (background && Date.now() - lastShown < BACKGROUND_COOLDOWN) return;
  lastShown = Date.now();
  enqueueAlert({
    key: "auth-session-expired",
    options: {
      icon: "warning",
      title: "Your session has expired",
      text: "Some actions will fail until you log in again.",
      confirmButtonText: "Log in again",
      showCancelButton: true,
      cancelButtonText: "Close",
    },
    onConfirm: () => void logoutNow(),
  });
}
