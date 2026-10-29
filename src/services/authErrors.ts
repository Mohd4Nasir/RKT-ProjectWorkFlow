import { toast } from "sonner";

/**
 * Auth / permission problems are SHOWN to the user, never used as a reason
 * to silently kick them out of the app. The only places that log the user
 * out are the explicit Logout actions (header menu / useAuth.logout) and the
 * "Log in again" button offered below.
 *
 * Every toast has a fixed id, so a burst of failing requests shows one toast.
 */

async function logoutNow() {
  const { store } = await import("@/store");
  const { logout } = await import("@/store/slices/authSlice");
  const { performLogout } = await import("./keycloakService");
  store.dispatch(logout());
  await performLogout(`${window.location.origin}/login`);
}

/** Token can't be refreshed any more (idle too long / session revoked). */
export function notifySessionExpired() {
  toast.error("Your session has expired", {
    id: "auth-session-expired",
    description: "Some actions will fail until you log in again.",
    duration: 10_000,
    action: { label: "Log in again", onClick: () => void logoutNow() },
  });
}

/** Server answered 401 even with a fresh token. */
export function notifyUnauthorized(what?: string) {
  toast.error("Unauthorized", {
    id: "auth-unauthorized",
    description: what
      ? `You are not authorized to ${what}.`
      : "You are not authorized to perform this action.",
    duration: 6_000,
  });
}

/** Server answered 403. */
export function notifyForbidden() {
  toast.error("Permission denied", {
    id: "auth-forbidden",
    description: "Your role doesn't allow this action. Contact your administrator.",
    duration: 6_000,
  });
}

export function notifyNetworkError() {
  toast.error("Can't reach the server", {
    id: "net-error",
    description: "Check your connection or try again in a moment.",
    duration: 6_000,
  });
}
