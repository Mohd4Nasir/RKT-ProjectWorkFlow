import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';
interface UIState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  colorTheme: string;
  theme: Theme;
  notifyEmail: boolean;
  notifyPush: boolean;
  orgName: string;
}
const initialState: UIState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  colorTheme: 'classic',
  theme: 'light',
  notifyEmail: true,
  notifyPush: true,
  orgName: 'WorkSphere',
};

const slice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setMobileNav(state, a: PayloadAction<boolean>) { state.mobileNavOpen = a.payload; },
    setColorTheme(state, a: PayloadAction<string>) { state.colorTheme = a.payload; },
    setTheme(state, a: PayloadAction<Theme>) { state.theme = a.payload; },
    setSetting(state, a: PayloadAction<{ key: keyof UIState; value: any }>) {
      (state as any)[a.payload.key] = a.payload.value;
    },
  },
});

export const { toggleSidebar, setMobileNav, setColorTheme, setTheme, setSetting } = slice.actions;
export default slice.reducer;
