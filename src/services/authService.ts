import api from "@/lib/api";

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

// export interface User {
//   id: number;
//   username: string;
//   email: string;
//   nickname: string | null;
//   avatar_url: string | null;
//   role: "user" | "moderator" | "admin";
// }

// export type AuthUser = User;

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
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  role: string;
  nickname: string | null;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  library_visibility: string;
  friends_visibility: string;
  created_at: string;
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
export async function login(body: LoginBody): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/auth/login/", body);
  return data;
}

// POST /auth/logout/
export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}

// GET /auth/me/
// export async function getCurrentUser(): Promise<AuthUser> {
//   const { data } = await api.get<AuthUser>("/auth/me/");
//   return data;
// }
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/users/me/");
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



// POST /auth/password/forgot/
export async function forgotPassword(body: ForgotPasswordBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/forgot/", body);
  return data;
}

// The name ForgotPassword.tsx already imports
export const requestPasswordReset = (email: string) => forgotPassword({ email });

// POST /auth/password/reset/validate/  (stores the link in the session cookie)
export async function validateResetLink(uid: string, token: string): Promise<void> {
  await api.post("/auth/password/reset/validate/", { uid, token });
}

// POST /auth/password/reset/  (new password only)
export async function confirmPasswordReset(new_password: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/reset/", { new_password });
  return data;
}