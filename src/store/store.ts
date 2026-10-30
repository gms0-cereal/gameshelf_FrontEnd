import { configureStore } from '@reduxjs/toolkit';
import { gameShelfApi } from './apiSlice'; // Adjust path to apiSlice

export const store = configureStore({
  reducer: {
    [gameShelfApi.reducerPath]: gameShelfApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(gameShelfApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;