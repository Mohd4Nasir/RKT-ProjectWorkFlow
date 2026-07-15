/**
 * FILE: src/lib/keycloakService.ts
 *
 * Pure token management utilities that sit between the Keycloak SDK
 * and the rest of the app.  Nothing here touches React or Redux directly
 * — that keeps the service unit-testable and import-safe.
 *
 * Responsibilities:
 *  - Proactive token refresh (called by the Axios interceptor and the
 *    background timer set up in KeycloakProvider)
 *  - Typed helpers for decoding the token payload
 *  - Session cleanup on logout
 */

import keycloak from "@/lib/keycloak";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * How many seconds before actual expiry we consider a token "expired"
 * and proactively refresh it.  Setting this to 30 s gives a comfortable
 * buffer for slow networks.
 */
export const TOKEN_REFRESH_MIN_VALIDITY = 600; // seconds

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeycloakTokenParsed {
  sub: string; // user id (UUID)
  preferred_username: string;
  email: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  email_verified?: boolean;
  iat: number;
  exp: number;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * Returns the raw JWT access token string, or null if not authenticated.
 * Use this to populate the Authorization header manually if needed.
 */
export function getAccessToken(): string | null {
  return keycloak.token ?? null;
}

/**
 * Returns the raw JWT refresh token string, or null if unavailable.
 */
export function getRefreshToken(): string | null {
  return keycloak.refreshToken ?? null;
}

/**
 * Returns the parsed payload of the current access token.
 * Keycloak-js exposes this as `keycloak.tokenParsed` after a
 * successful login/init.
 */
export function getParsedToken(): KeycloakTokenParsed | null {
  return (keycloak.tokenParsed as KeycloakTokenParsed) ?? null;
}

/**
 * Returns true if the current access token will expire within
 * TOKEN_REFRESH_MIN_VALIDITY seconds (or is already expired).
 */
export function isTokenExpiringSoon(): boolean {
  if (!keycloak.authenticated) return true;
  return keycloak.isTokenExpired(TOKEN_REFRESH_MIN_VALIDITY);
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

/**
 * Checks whether the authenticated user has a specific realm-level role.
 *
 * Realm roles are the ones you assign in:
 *   Keycloak Admin → <realm> → Users → <user> → Role Mappings → Realm Roles
 *
 * Example roles your app uses: 'admin', 'user'
 */
export function hasRealmRole(role: string): boolean {
  const tokenParsed = getParsedToken();
  const roles = tokenParsed?.realm_access?.roles ?? [];
  console.log(`🔍 Checking role "${role}" - Available roles:`, roles);
  // console.log("Has role?", roles.includes(role));
  return keycloak.hasRealmRole(role);
}
console.log("Roles:", keycloak.tokenParsed?.realm_access?.roles);

/**
 * Checks whether the authenticated user has a client-level role.
 *
 * Client roles are scoped to a specific client (clientId).  Use this if
 * you have multi-client role hierarchies.
 */
export function hasClientRole(role: string, clientId?: string): boolean {
  return keycloak.hasResourceRole(role, clientId);
}

/**
 * Returns all realm roles for the current user.
 * Returns an empty array when not authenticated.
 */
export function getRealmRoles(): string[] {
  // console.log("🔐 getRealmRoles called - Token Parsed:", keycloak.tokenParsed);
  // console.log("👑 Realm Roles:", keycloak.tokenParsed?.realm_access?.roles);
  return keycloak.tokenParsed?.realm_access?.roles ?? [];
}

// ─── Core: proactive token refresh ───────────────────────────────────────────

/**
 * Ensures the access token is valid for at least TOKEN_REFRESH_MIN_VALIDITY
 * seconds.  If not, it uses the refresh token to obtain a new access token
 * from Keycloak BEFORE the request fails.
 *
 * Returns true  → token is valid (was refreshed or was already fresh).
 * Returns false → refresh failed (refresh token is also expired / revoked).
 *                 The caller should trigger logout.
 *
 * This is called by:
 *  1. The Axios request interceptor (before every API call).
 *  2. The background interval in KeycloakProvider (every 60 s).
 */
export async function ensureFreshToken(): Promise<boolean> {
  if (!keycloak.authenticated) {
    console.warn("[Keycloak] User not authenticated");
    return false;
  }
  try {
    const refreshed = await keycloak.updateToken(TOKEN_REFRESH_MIN_VALIDITY);
    if (refreshed) {
      // console.log("[Keycloak] Token refreshed");
    } else {
      console.log("[Keycloak] Token still valid");
    }
    return true;
  } catch (error) {
    console.error("[Keycloak] Token refresh failed", error);
    return false;
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/**
 * Performs a full Keycloak Single Sign-Out.
 *
 * This:
 *  1. Clears the Keycloak session on the server (SSO logout).
 *  2. Redirects the browser to the Keycloak logout endpoint, then back
 *     to `redirectUri` (usually your /login page).
 *
 * NOTE: Redux state is cleared BEFORE this call in the KeycloakProvider
 *       logout handler so there is no stale auth data if the redirect
 *       takes a moment.
 */
export async function performLogout(redirectUri?: string): Promise<void> {
  await keycloak.logout({
    redirectUri: redirectUri ?? `${window.location.origin}/login`,
  });
}

// ─── User profile mapper ──────────────────────────────────────────────────────

/**
 * Builds the User object (matching your existing `User` / `Users` type)
 * from the Keycloak token payload.
 *
 * Keycloak → your app type mapping:
 *   sub                  → id
 *   preferred_username   → name  (or name field if present)
 *   email                → email
 *   realm_access.roles   → role  ('admin' if role list includes 'admin', else 'user')
 */
export function mapKeycloakTokenToUser(parsed: KeycloakTokenParsed) {
  const realmRoles = parsed.realm_access?.roles ?? [];
  console.log("Parsed Token:", realmRoles);
  const role: "admin" | "user" = realmRoles.includes("admin")
    ? "admin"
    : "user";

  return {
    id: parsed.sub,
    name: parsed.name ?? parsed.preferred_username,
    email: parsed.email,
    role,
    status: "active" as const,
    joinedAt: new Date().toISOString(),
  };
}
