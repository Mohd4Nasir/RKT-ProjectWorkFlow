/**
 * FILE: src/providers/KeycloakProvider.tsx  (NEW)
 *
 * The single place where Keycloak is initialized and wired to Redux.
 *
 * ─── What this provider does ────────────────────────────────────────────────
 *
 *  1. INIT  — Calls keycloak.init() once on mount.
 *             Uses `onLoad: 'check-sso'` so:
 *               - If the user has an active Keycloak session (e.g. from
 *                 another tab), they are silently authenticated without
 *                 a redirect.
 *               - If they don't, they land on your app unauthenticated
 *                 (Login page handles the redirect to Keycloak).
 *             `pkceMethod: 'S256'` enables PKCE — mandatory for public
 *             clients in Keycloak 18+.
 *
 *  2. BOOT  — On successful init + authenticated:
 *               - Maps token → AuthUser via keycloakService
 *               - Dispatches loginSuccess({ user, accessToken, refreshToken })
 *
 *  3. REFRESH — Sets up a 60 s interval that calls ensureFreshToken().
 *               If the refresh token is also expired, dispatches logout()
 *               and calls performLogout() for server-side SSO cleanup.
 *
 *  4. EVENTS — Keycloak SDK fires lifecycle events.  We listen for:
 *               onAuthRefreshSuccess → update tokens in Redux
 *               onAuthRefreshError   → logout
 *               onTokenExpired       → trigger immediate refresh
 *
 *  5. GUARD  — Renders a loading spinner until keycloakInitialized = true,
 *              preventing a flash of the login redirect on page load.
 *
 * ─── Placement ──────────────────────────────────────────────────────────────
 *
 *  Wrap your entire app INSIDE <Provider store={store}> and
 *  <PersistGate> but OUTSIDE <BrowserRouter>.
 *  See App.tsx for the correct nesting order.
 */

// import { useEffect, useRef } from 'react';
// import keycloak from '@/lib/keycloak';
// import {
//   ensureFreshToken,
//   mapKeycloakTokenToUser,
//   performLogout,
// } from '@/services/keycloakService';
// import { useAppDispatch, useAppSelector } from '@/store';
// import {
//   loginSuccess,
//   logout,
//   setKeycloakInitialized,
//   setTokens,
// } from '@/store/slices/authSlice';

// // How often the background timer checks / proactively refreshes the token.
// const REFRESH_INTERVAL_MS = 300_000; // 300 seconds

// interface Props {
//   children: React.ReactNode;
// }

// export function KeycloakProvider({ children }: Props) {
//   const dispatch = useAppDispatch();
//   const keycloakInitialized = useAppSelector((s) => s.auth.keycloakInitialized);
//   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const initCalledRef = useRef(false);

//   useEffect(() => {
//     // Guard against React StrictMode double-invocation
//     if (initCalledRef.current) return;
//     initCalledRef.current = true;

//     // ── Event listeners (wire BEFORE init) ──────────────────────────────

//     keycloak.onAuthRefreshSuccess = () => {
//       if (keycloak.token && keycloak.refreshToken) {
//         dispatch(setTokens({
//           accessToken: keycloak.token,
//           refreshToken: keycloak.refreshToken,
//         }));
//       }
//     };

//     keycloak.onAuthRefreshError = async () => {
//       dispatch(logout());
//       await performLogout();
//     };

//     keycloak.onTokenExpired = async () => {
//       const ok = await ensureFreshToken();
//       if (!ok) {
//         dispatch(logout());
//         await performLogout();
//       }
//     };

//     keycloak.onAuthLogout = () => {
//       dispatch(logout());
//     };

//     // ── Init ─────────────────────────────────────────────────────────────

//     keycloak
//       .init({
//         /**
//          * 'check-sso': Checks for an existing Keycloak session without
//          * forcing a redirect if the user isn't logged in.
//          *
//          * Without silentCheckSsoRedirectUri this works purely via
//          * the Keycloak adapter's internal state — no iframe is created,
//          * no 3p-cookie check is attempted.
//          */
//         onLoad: 'check-sso',

//         /**
//          * PKCE is required for public clients in Keycloak 18+.
//          */
//         // pkceMethod: 'S256',

//         /**
//          * CRITICAL FIX: Disable the login-status iframe.
//          *
//          * When true (the default), Keycloak creates a hidden iframe that
//          * polls Keycloak's session endpoint. This iframe:
//          *  1. Requires third-party cookies (blocked in Chrome/Firefox by default)
//          *  2. Makes requests to /realms/{realm}/protocol/openid-connect/3p-cookies/
//          *     which your React Router catches as a 404
//          *  3. Times out if Keycloak is unreachable → init() rejects
//          *
//          * Set to false to skip all iframe-based session checking.
//          * You still get session refresh via the background interval below.
//          */
//         checkLoginIframe: false,
//         /**
//          * Do NOT include silentCheckSsoRedirectUri here.
//          * That option tells KC to load the SSO check inside an iframe
//          * pointed at a page on your domain — it's the second source of the
//          * iframe/routing conflict. Without it, `check-sso` is a no-op if
//          * there's no active session, which is exactly what we want.
//          */
//       })
//       .then(async (authenticated) => {
//         if (authenticated && keycloak.token && keycloak.refreshToken && keycloak.tokenParsed) {
//           const user = mapKeycloakTokenToUser(
//             keycloak.tokenParsed as Parameters<typeof mapKeycloakTokenToUser>[0]
//           );

//           dispatch(loginSuccess({
//             user,
//             accessToken: keycloak.token,
//             refreshToken: keycloak.refreshToken,
//           }));

//           startRefreshInterval();
//         }

//         // Always mark initialized — unblocks the app regardless of auth state
//         dispatch(setKeycloakInitialized(true));
//       })
//       .catch((err) => {
//         console.error('[Keycloak] init() failed:', err);
//         // Still unblock the app so the user can see the login page
//         dispatch(setKeycloakInitialized(true));
//       });

//     return () => {
//       stopRefreshInterval();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   function startRefreshInterval() {
//     intervalRef.current = setInterval(async () => {
//       if (!keycloak.authenticated) return;
//       const ok = await ensureFreshToken();
//       if (!ok) {
//         stopRefreshInterval();
//         dispatch(logout());
//         await performLogout();
//       }
//     }, REFRESH_INTERVAL_MS);
//   }

//   function stopRefreshInterval() {
//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }
//   }

//   if (!keycloakInitialized) {
//     return (
//       <div
//         style={{
//           minHeight: '100vh',
//           display: 'grid',
//           placeItems: 'center',
//           fontSize: '0.875rem',
//           color: 'var(--muted-foreground, #888)',
//         }}
//       >
//         Initializing session…
//       </div>
//     );
//   }

//   return <>{children}</>;
// }



import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import keycloak from "@/lib/keycloak";

import {
  loginSuccess,
  logout,
  setKeycloakInitialized,
  setTokens,
} from "@/store/slices/authSlice";

type AuthContextType = {
  keycloak: typeof keycloak;
  initialized: boolean;
  authenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    const initKeycloak = async () => {
      try {
        const auth = await keycloak.init({
          onLoad: "check-sso",
          pkceMethod: "S256",
          checkLoginIframe: false,
        });
console.log("Keycloak Auth Result:", auth);
console.log("Keycloak URL:", keycloak.authServerUrl);
        setAuthenticated(auth);
        setInitialized(true);

        dispatch(setKeycloakInitialized(true));

        if (auth) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tokenParsed: any = keycloak.tokenParsed;

          dispatch(
            loginSuccess({
              user: {
                id: tokenParsed?.sub || "",
                name:
                  tokenParsed?.name || tokenParsed?.preferred_username ||

                  "",
                email: tokenParsed?.email || "",
                role: tokenParsed?.realm_access?.roles?.includes("admin")
                  ? "admin"
                  : "user",
                status: "active",
                joinedAt: new Date().toISOString(),
              },
              accessToken: keycloak.token || "",
              refreshToken: keycloak.refreshToken || "",
            })
          );



          refreshInterval = setInterval(async () => {
            try {
              const refreshed = await keycloak.updateToken(30);

              if (refreshed) {
                dispatch(
                  setTokens({
                    accessToken: keycloak.token || "",
                    refreshToken: keycloak.refreshToken || "",
                  })
                );

                console.log("Token Refreshed");
              }
            } catch (err) {
              console.error("Token Refresh Failed", err);

              dispatch(logout());

              keycloak.logout({
                redirectUri: window.location.origin,
              });
            }
          }, 25000);
        }
      } catch (error) {
        console.error("Keycloak Init Failed:", error);

        dispatch(setKeycloakInitialized(true));

        setInitialized(true);
      }
    };

    initKeycloak();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [dispatch]);

  return (
    <AuthContext.Provider
      value={{
        keycloak,
        initialized,
        authenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside KeycloakProvider");
  }

  return context;
};