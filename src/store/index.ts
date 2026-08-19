// // src/store/index.ts
// import { combineReducers, configureStore } from '@reduxjs/toolkit';
// import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
// import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// import auth from './slices/authSlice';
// import projects from './slices/projectsSlice';
// import tasks from './slices/tasksSlice';
// import taskLists from './slices/taskListsSlice'; // ✅ ADD THIS IMPORT
// import users from './slices/usersSlice';
// import notifications from './slices/notificationsSlice';
// import ui from './slices/uiSlice';

// // ✅ ADD taskLists to rootReducer
// const rootReducer = combineReducers({ 
//   auth, 
//   projects, 
//   tasks, 
//   tasksi
//   taskLists, // ✅ ADD THIS
//   users, 
//   notifications, 
//   ui 
// });

// const persisted = persistReducer(
//   { key: 'rishikirti', storage, whitelist: ['ui'] },
//   rootReducer
// );

// export const store = configureStore({
//   reducer: persisted,
//   middleware: (gDM) =>
//     gDM({
//       serializableCheck: { 
//         ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] 
//       },
//     }),
// });

// export const persistor = persistStore(store);

// export type RootState = ReturnType<typeof rootReducer>;
// export type AppDispatch = typeof store.dispatch;

// export const useAppDispatch: () => AppDispatch = useDispatch;
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;



// src/store/index.ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import auth from './slices/authSlice';
import projects from './slices/projectsSlice';
import tasks from './slices/taskSlice';   // ✅ naya tree-based slice, key naam 'tasks'
import users from './slices/usersSlice';
import notifications from './slices/notificationsSlice';
import ui from './slices/uiSlice';

// ✅ purana tasksSlice.ts aur taskListsSlice.ts — dono file delete kar do,
// ✅ aur yahan se unka import bhi hata diya (taskLists variable jo undefined tha)

const rootReducer = combineReducers({
  auth,
  projects,
  tasks,          // 👈 state.tasks.lists = pura nested tree
  users,
  notifications,
  ui,
});

const persisted = persistReducer(
  { key: 'rishikirti', storage, whitelist: ['ui'] },
  rootReducer
);

export const store = configureStore({
  reducer: persisted,
  middleware: (gDM) =>
    gDM({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;