import api from "@/lib/api";

export interface RegisterBody {
  username: string;
  email: string;
  password: string;
}

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
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  age: number | null;
  gender: string | null;
  pronouns: string | null;
  library_visibility: string;
  birth_day: string | null; // Fixed from Date
  friends_visibility: string;
  created_at: string;
}

export async function getCsrf(): Promise<void> {
  await api.get<MessageResponse>("/auth/csrf/");
}

export async function register(body: RegisterBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/register/", body);
  return data;
}

export async function login(body: LoginBody): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>("/auth/login/", body);
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout/");
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/users/me/");
  return data;
}

export async function verifyEmail(body: VerifyEmailBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/verify-email/", body);
  return data;
}

export async function resendVerification(): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/resend-verification/");
  return data;
}

export async function changePassword(body: ChangePasswordBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/change/", body);
  return data;
}

export async function forgotPassword(body: ForgotPasswordBody): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/forgot/", body);
  return data;
}

export const requestPasswordReset = (email: string) => forgotPassword({ email });

export async function validateResetLink(uid: string, token: string): Promise<void> {
  await api.post("/auth/password/reset/validate/", { uid, token });
}

export async function confirmPasswordReset(new_password: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>("/auth/password/reset/", { new_password });
  return data;
}