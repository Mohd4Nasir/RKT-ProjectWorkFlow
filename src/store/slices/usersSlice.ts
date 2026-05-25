import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@/types';
import { mockUsers } from '@/services/mockData';

interface UsersState { items: User[]; }
const initialState: UsersState = { items: mockUsers };

const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser(state, a: PayloadAction<User>) { state.items.unshift(a.payload); },
    updateUser(state, a: PayloadAction<User>) {
      const i = state.items.findIndex((u) => u.id === a.payload.id);
      if (i >= 0) state.items[i] = a.payload;
    },
    deleteUser(state, a: PayloadAction<string>) {
      state.items = state.items.filter((u) => u.id !== a.payload);
    },
  },
});

export const { addUser, updateUser, deleteUser } = slice.actions;
export default slice.reducer;
