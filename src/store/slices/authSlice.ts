import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { mockUsers, demoAccounts } from '@/services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) { state.loading = true; state.error = null; },
    loginSuccess(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
    },
    updateProfile(state, action: PayloadAction<Partial<User>>) {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;

// Mock login thunk
export const loginThunk = (email: string, password: string) => async (dispatch: any) => {
  dispatch(loginStart());
  await new Promise((r) => setTimeout(r, 600));
  const acct = demoAccounts.find((a) => a.email === email && a.password === password);
  if (!acct) {
    dispatch(loginFailure('Invalid email or password'));
    return false;
  }
  const user = mockUsers.find((u) => u.id === acct.userId)!;
  dispatch(loginSuccess(user));
  return true;
};
