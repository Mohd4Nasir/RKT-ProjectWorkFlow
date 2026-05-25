import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';
import { mockNotifications } from '@/services/mockData';

interface NotifState { items: Notification[]; }
const initialState: NotifState = { items: mockNotifications };

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markRead(state, a: PayloadAction<string>) {
      const n = state.items.find((x) => x.id === a.payload);
      if (n) n.read = true;
    },
    markAllRead(state) { state.items.forEach((n) => (n.read = true)); },
    addNotification(state, a: PayloadAction<Notification>) { state.items.unshift(a.payload); },
    removeNotification(state, a: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== a.payload);
    },
  },
});

export const { markRead, markAllRead, addNotification, removeNotification } = slice.actions;
export default slice.reducer;
