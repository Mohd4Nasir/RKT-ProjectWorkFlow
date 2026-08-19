import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Users } from '@/types/ProejctsType';
import { mockUsers } from '@/services/mockData';

interface UsersState { items: Users[]; }
const initialState: UsersState = { items: mockUsers };

const slice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser(state, a: PayloadAction<Users>) { state.items.unshift(a.payload); },
    updateUser(state, a: PayloadAction<Users>) {
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
