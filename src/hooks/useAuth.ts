/**
 * FILE: src/hooks/useAuth.ts  (NEW)
 *
 * A clean, typed hook that components use to access auth state and
 * perform auth actions.  Keeps Keycloak and Redux imports out of
 * every component that needs auth info.
 *
 * Usage:
 *   const { user, isAuthenticated, role, logout, hasRole } = useAuth();
 */

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout as logoutAction } from '@/store/slices/authSlice';
import { performLogout, hasRealmRole, getRealmRoles } from '@/services/keycloakService';
import keycloak from '@/lib/keycloak';
import { log } from 'console';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, accessToken, keycloakInitialized, loading, error } =
    useAppSelector((s) => s.auth);

  /**
   * Triggers a full Keycloak SSO logout.
   * - Clears Redux state immediately (no flash of authenticated UI)
   * - Calls keycloak.logout() which redirects to Keycloak's logout endpoint
   * - Keycloak then redirects back to /login
   */
  const logout = useCallback(async () => {
    dispatch(logoutAction());
    await performLogout(`${window.location.origin}/login`);
  }, [dispatch]);

  /**
   * Checks whether the current user has a specific realm role.
   * Reads directly from the live Keycloak token — always up to date.
   *
   * Example:
   *   const { hasRole } = useAuth();
   *   if (hasRole('admin')) { ... }
   */
  const hasRole = useCallback((role: string): boolean => {
    if (!isAuthenticated) return false;
    // Primary: check Keycloak token realm roles
    if (hasRealmRole(role)) return true;
    // Fallback: check Redux user.role (populated from token on login)
    return user?.role === role;
  }, [isAuthenticated, user]);

  /**
   * Returns all realm roles for the current user.
   */
  const roles = isAuthenticated ? getRealmRoles() : [];

  /**
   * The user's primary role for simplified two-tier role checks.
   * Returns 'admin' if the user has the admin realm role, else 'user'.
   */
  const role = user?.role ?? 'user';

  /**
   * Redirects to Keycloak's login page.
   * Useful for a "Re-login" button in error states.
   */
  const login = useCallback(() => {
     console.log("Login function called",window.location.origin);
    keycloak.login({ redirectUri: `${window.location.origin}/dashboard` });
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    accessToken,
    keycloakInitialized,
    loading,
    error,
    role,
    roles,

    // Actions
    login,
    logout,
    hasRole,
  };
}
