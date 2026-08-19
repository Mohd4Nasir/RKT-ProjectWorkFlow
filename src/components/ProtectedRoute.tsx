/**
 * FILE: src/components/ProtectedRoute.tsx  (MODIFIED)
 *
 * Changes from the mock version:
 *  ✅ Role check now uses Keycloak realm roles instead of the mock
 *     `user.role` string.  This means roles are always authoritative —
 *     they come directly from the Keycloak token, not your database.
 *
 *  ✅ Added `keycloakInitialized` guard: if Keycloak hasn't finished
 *     init() yet (e.g. very slow network), we render null instead of
 *     flashing a redirect to /login.
 *
 *  ✅ Kept the existing Props interface — all existing usages in App.tsx
 *     work without changes.
 *
 * ─── Role resolution order ──────────────────────────────────────────────
 *
 *  1. Primary:  keycloakService.hasRealmRole(role) — reads from the
 *               live Keycloak token.  Always current.
 *  2. Fallback: user.role from Redux (populated by mapKeycloakTokenToUser
 *               on login).  Used for the simple 'admin' | 'user' check
 *               that the existing routes use.
 *
 *  For most apps the fallback alone is fine.  Use hasRealmRole() if you
 *  need fine-grained KC roles like 'project-manager', 'viewer', etc.
 */

// import { Navigate, useLocation } from 'react-router-dom';
// import { useAppSelector } from '@/store';
// import { hasRealmRole } from '@/services/keycloakService';
// import { UserRole } from '@/types';
// import keycloak from '@/lib/keycloak';
// import { useAuth } from "@/providers/KeycloakProvider";

// interface Props {
//   children: JSX.Element;
//   /**
//    * Optional list of roles that are allowed to access this route.
//    * Checked against BOTH the Keycloak realm roles AND the Redux user.role.
//    *
//    * Example from App.tsx:
//    *   <ProtectedRoute roles={['admin']}><Projects /></ProtectedRoute>
//    */
//   roles?: UserRole[];
// }

// export function ProtectedRoute({ children, roles }: Props) {
//   const { isAuthenticated, user, keycloakInitialized } = useAppSelector(
//     (s) => s.auth
//   );

// // console.log("Redux User:", user);

//   // Wait for Keycloak init before making any auth decisions.
//   // Without this guard, a hard refresh would flash /login for a split
//   // second while init() is resolving the SSO check.
//   // if (!keycloakInitialized) {
//   //   return null;
//   // }

//   // Not authenticated → redirect to login, preserving the intended URL
//   // so Login can send the user back after Keycloak redirects them home.
//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }
//   // Role guard
//   // if (roles && roles.length > 0) {
//   //   const hasRole = roles.some(
//   //     (role) =>
//   //       // Check Keycloak realm roles (source of truth)
//   //       hasRealmRole(role) ||
//   //       // Fallback: check Redux-cached role (set from token on login)
//   //       user.role === role
//   //   );

//   //   if (!hasRole) {
//   //     // Authenticated but unauthorized → dashboard (not logout)
//   //     return <Navigate to="/dashboard" replace />;
//   //   }
//   // }

//   return children;
// }




import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { hasRealmRole } from '@/services/keycloakService';
import { UserRole } from '@/types/ProejctsType';
import { useAuth } from "@/providers/KeycloakProvider";

interface Props {
  children: JSX.Element;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user, keycloakInitialized } = useAppSelector(
    (s) => s.auth
  );

  // ⭐ CRITICAL: Wait for Keycloak to initialize
  if (!keycloakInitialized) {
    // Better to show loading than null
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(
      (role) =>
        hasRealmRole(role) || // Keycloak realm role
        user?.role === role   // Redux fallback
    );

    if (!hasRequiredRole) {
      // User doesn't have required role → go to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // All checks passed → render the protected content
  return children;
}