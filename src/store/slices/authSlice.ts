// import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { User } from '@/types';
// import { mockUsers, demoAccounts } from '@/services/mockData';

// interface AuthState {
//   user: User | null;
//   isAuthenticated: boolean;
//   loading: boolean;
//   error: string | null;
// }

// const initialState: AuthState = {
//   user: null,
//   isAuthenticated: false,
//   loading: false,
//   error: null,
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     loginStart(state) { state.loading = true; state.error = null; },
//     loginSuccess(state, action: PayloadAction<User>) {
//       state.user = action.payload;
//       state.isAuthenticated = true;
//       state.loading = false;
//     },
//     loginFailure(state, action: PayloadAction<string>) {
//       state.error = action.payload;
//       state.loading = false;
//     },
//     logout(state) {
//       state.user = null;
//       state.isAuthenticated = false;
//     },
//     updateProfile(state, action: PayloadAction<Partial<User>>) {
//       if (state.user) state.user = { ...state.user, ...action.payload };
//     },
//   },
// });

// export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions;
// export default authSlice.reducer;

// // Mock login thunk
// export const loginThunk = (email: string, password: string) => async (dispatch: any) => {
//   dispatch(loginStart());
//   await new Promise((r) => setTimeout(r, 600));
//   const acct = demoAccounts.find((a) => a.email === email && a.password === password);
//   if (!acct) {
//     dispatch(loginFailure('Invalid email or password'));
//     return false;
//   }
//   const user = mockUsers.find((u) => u.id === acct.userId)!;
//   dispatch(loginSuccess(user));
//   return true;
// };


/**
 * FILE: src/store/slices/authSlice.ts  (MODIFIED)
 *
 * Changes from the mock version:
 *  ✅ Added `accessToken`, `refreshToken`, `keycloakInitialized` fields
 *  ✅ `loginSuccess` now accepts tokens alongside the user object
 *  ✅ `logout` clears tokens and resets keycloakInitialized
 *  ✅ New `setTokens` action for the background token-refresh timer
 *  ✅ New `setKeycloakInitialized` action called by KeycloakProvider
 *  ✅ Removed mock loginThunk (real auth is handled by Keycloak redirect)
 *  ✅ Kept `loginStart`, `loginFailure`, `updateProfile` — still valid
 *
 * IMPORTANT — Token storage security:
 *  Tokens are stored in Redux state which is persisted to localStorage
 *  via redux-persist.  For most enterprise SPAs this is acceptable
 *  because:
 *   - Keycloak-js ALSO stores tokens in memory + sessionStorage by default
 *   - The real risk surface is XSS, mitigated by your CSP headers
 *   - The alternative (httpOnly cookies) requires server-side coordination
 *
 *  If your security requirements demand zero token persistence in
 *  localStorage, set whitelist: ['ui'] in store/index.ts (remove 'auth')
 *  and rely on Keycloak's `check-sso` iframe for session recovery.
 *  You would then call keycloak.token directly for every API call
 *  rather than reading from Redux.  The rest of this integration works
 *  either way.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  joinedAt: string;
  avatar?: string;
  department?: string;
}

interface AuthState {
  // User profile derived from the Keycloak token
  user: AuthUser | null;

  // JWT strings — used by axiosInstance interceptor
  accessToken: string | null;
  refreshToken: string | null;

  // UI state
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Set to true once keycloak.init() resolves (success or failure).
  // KeycloakProvider renders a loading spinner until this is true,
  // preventing a flash of the login page on hard refresh.
  keycloakInitialized: boolean;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  keycloakInitialized: false,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called at the start of any async auth operation (rare with Keycloak
    // since auth is redirect-based, but kept for compatibility).
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },

    /**
     * Called by KeycloakProvider once keycloak.init() resolves AND
     * the user is authenticated.
     *
     * Payload: { user, accessToken, refreshToken }
     */
    loginSuccess(
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },

    /**
     * Called by the background token-refresh timer in KeycloakProvider
     * whenever Keycloak silently issues new tokens.
     *
     * We update ONLY the token strings — the user object doesn't change
     * between refreshes.
     */
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    /**
     * Flips the `keycloakInitialized` flag.
     * Set to true by KeycloakProvider whether or not the user is logged in,
     * so the app knows initialization is complete.
     */
    setKeycloakInitialized(state, action: PayloadAction<boolean>) {
      state.keycloakInitialized = action.payload;
    },

    /**
     * Full logout: clears all auth state.
     * Called BEFORE keycloak.logout() redirects the browser so that
     * there is no window of time where stale tokens sit in the store.
     */
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.keycloakInitialized = false;
    },

    /**
     * In-place profile update (e.g. after the user edits their profile
     * in your UI and you want to reflect changes without a full re-init).
     */
    updateProfile(state, action: PayloadAction<Partial<AuthUser>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  setTokens,
  setKeycloakInitialized,
  logout,
  updateProfile,
} = authSlice.actions;

export default authSlice.reducer;
