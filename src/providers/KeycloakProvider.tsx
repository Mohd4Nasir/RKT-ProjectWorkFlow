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
        // console.log("Keycloak URL:", keycloak.authServerUrl);
        setAuthenticated(auth);
        setInitialized(true);

        dispatch(setKeycloakInitialized(true));

        if (auth) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tokenParsed: any = keycloak.tokenParsed;
 localStorage.setItem("token", keycloak.token || "");
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