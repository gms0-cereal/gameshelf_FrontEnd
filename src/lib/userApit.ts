import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./basequery";

export type Visibility = "public" | "friends" | "private";
export type LibraryStatus = "playing" | "completed" | "on_hold" | "dropped" | "plan_to_play";

// The logged-in user (GET /users/me/ and the login response)
export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  role: "user" | "moderator" | "admin";
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  library_visibility: Visibility;
  friends_visibility: Visibility;
  created_at: string;
}

// What other people see (GET /users/<username>/). null means "hidden by their privacy settings".
export interface UserProfile {
  id: number;
  username: string;
  nickname: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  joined: string;
  friend_count: number | null;
  library: Record<LibraryStatus, number> | null;
  ratings_count: number;
  reviews_count: number;
}

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

export interface VerifyEmailBody {
  uid: string;
  token: string;
}

export type UpdateMeBody = Partial<
  Pick<
    User,
    "nickname" | "bio" | "avatar_url" | "banner_url" | "library_visibility" | "friends_visibility"
  >
>;

export interface MessageResponse {
  detail: string;
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery,
  tagTypes: ["user"],
  endpoints: (builder) => ({
    //api/v1/auth/csrf/  (call once when the app starts)
    getCsrf: builder.query<MessageResponse, void>({
      query: () => ({
        url: `/auth/csrf/`,
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
    }),
    //api/v1/auth/register/
    register: builder.mutation<MessageResponse, RegisterBody>({
      query: (body) => ({
        url: `/auth/register/`,
        method: "POST",
        body,
      }),
    }),
    //api/v1/auth/login/
    login: builder.mutation<User, LoginBody>({
      query: (body) => ({
        url: `/auth/login/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "user", id: "me" }],
    }),
    //api/v1/auth/logout/
    logout: builder.mutation<void, void>({
      query: () => ({
        url: `/auth/logout/`,
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }): Promise<void> {
        try {
          await queryFulfilled;
          // forget the cached user and profiles
          dispatch(userApi.util.resetApiState());
        } catch {
          // ignore failed logouts
        }
      },
    }),
    //api/v1/auth/verify-email/
    verifyEmail: builder.mutation<MessageResponse, VerifyEmailBody>({
      query: (body) => ({
        url: `/auth/verify-email/`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "user", id: "me" }],
    }),
    //api/v1/auth/resend-verification/
    resendVerification: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: `/auth/resend-verification/`,
        method: "POST",
      }),
    }),
    //api/v1/auth/password/change/
    changePassword: builder.mutation<MessageResponse, ChangePasswordBody>({
      query: (body) => ({
        url: `/auth/password/change/`,
        method: "POST",
        body,
      }),
    }),
    //api/v1/users/me/   (an error here means nobody is logged in)
    getMe: builder.query<User, void>({
      query: () => ({
        url: `/users/me/`,
        method: "GET",
      }),
      providesTags: [{ type: "user", id: "me" }],
      keepUnusedDataFor: 300,
    }),
    //api/v1/users/me/
    updateMe: builder.mutation<User, UpdateMeBody>({
      query: (body) => ({
        url: `/users/me/`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "user", id: "me" },
              { type: "user", id: result.username },
            ]
          : [],
    }),
    //api/v1/users/<username>/
    getUserProfile: builder.query<UserProfile, string>({
      query: (username) => ({
        url: `/users/${encodeURIComponent(username)}/`,
        method: "GET",
      }),
      providesTags: (_result, _error, username) => [{ type: "user", id: username }],
      keepUnusedDataFor: 300,
    }),
  }),
});

export const {
  useGetCsrfQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useChangePasswordMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useGetUserProfileQuery,
} = userApi;