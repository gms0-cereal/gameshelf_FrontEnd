// import api from "@/lib/api";

// export interface LoginData {
//   username: string;
//   password: string;
// }

// export interface RegisterData {
//   username: string;
//   email: string;
//   password: string;
//   password_confirm: string;
// }

// export interface AuthUser {
//   id: number;
//   username: string;
//   email: string;
//   nickname: string | null;
//   avatar_url: string | null;
//   role: "user" | "moderator" | "admin";
// }

// export const getCsrfToken = async () => {
//   await api.get("/auth/csrf/");
// };

// export const login = async (data: LoginData) => {
//   await getCsrfToken();

//   const response = await api.post("/auth/login/", data);
//   return response.data;
// };

// export const register = async (data: RegisterData) => {
//   await getCsrfToken();

//   const response = await api.post("/auth/register/", data);
//   return response.data;
// };

// export const logout = async () => {
//   const response = await api.post("/auth/logout/");
//   return response.data;
// };

// export const getCurrentUser = async () => {
//   const response = await api.get<AuthUser>("/auth/me/");
//   return response.data;
// };

// export interface PasswordResetRequestData {
//   email: string;
// }

// export const requestPasswordReset = async (email: string) => {
//   await getCsrfToken();

//   const response = await api.post("/auth/password-reset/", { email });
//   return response.data;
// };

import api from "../lib/api";

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
}

export type AuthUser = User;

export interface LoginBody {
  username: string;
  password: string;
}
export interface ForgotPasswordBody {
  email: string;
}

export interface ChangePasswordBody {
  current_password: string;
  new_password: string;
}

export interface VerifyEmailBody {
  uid: string;
  token: string;
}

export interface MessageResponse {
  detail: string;
}

// GET /auth/csrf/  (call once when the app starts so the csrftoken cookie exists)
export async function getCsrf(): Promise<void> {
  await api.get<MessageResponse>("/auth/csrf/");
}

// POST /auth/register/
export async function register(body: RegisterBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/register/", body);
  return data;
}

// POST /auth/login/  (sets the session cookie and returns the user)
export async function login(body: LoginBody): Promise<User> {
  const { data } = await api.post<User>("/auth/login/", body);
  return data;
}

// POST /auth/logout/
export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}

// GET /auth/me/
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me/");
  return data;
}

// POST /auth/verify-email/
export async function verifyEmail(body: VerifyEmailBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/verify-email/", body);
  return data;
}

// POST /auth/resend-verification/
export async function resendVerification(): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/resend-verification/");
  return data;
}

// POST /auth/password/change/
export async function changePassword(body: ChangePasswordBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/change/", body);
  return data;
}

// POST /auth/password-reset/
export async function forgotPassword(
  body: ForgotPasswordBody
): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(
    "/auth/password-reset/",
    body
  );

  return data;
}