import { configureStore } from "@reduxjs/toolkit";
import { gameApi } from "./gameApi";
import { userApi } from "./userApit";

export const store = configureStore({
  reducer: {
    [userApi.reducerPath]: userApi.reducer,
    [gameApi.reducerPath]: gameApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(userApi.middleware, gameApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;