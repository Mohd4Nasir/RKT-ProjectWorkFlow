import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import auth from './slices/authSlice';
import projects from './slices/projectsSlice';
import tasks from './slices/tasksSlice';
import users from './slices/usersSlice';
import notifications from './slices/notificationsSlice';
import ui from './slices/uiSlice';

const rootReducer = combineReducers({ auth, projects, tasks, users, notifications, ui });

const persisted = persistReducer(
  { key: 'rishikirti', storage, whitelist: ['auth', 'ui'] },
  rootReducer
);

export const store = configureStore({
  reducer: persisted,
  middleware: (gDM) =>
    gDM({
      serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
