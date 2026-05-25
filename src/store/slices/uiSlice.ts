import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';
interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  notifyEmail: boolean;
  notifyPush: boolean;
  orgName: string;
}
const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
  notifyEmail: true,
  notifyPush: true,
  orgName: 'RishiKirti Projects',
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setTheme(state, a: PayloadAction<Theme>) { state.theme = a.payload; },
    setSetting(state, a: PayloadAction<{ key: keyof UIState; value: any }>) {
      (state as any)[a.payload.key] = a.payload.value;
    },
  },
});

export const { toggleSidebar, setTheme, setSetting } = slice.actions;
export default slice.reducer;
