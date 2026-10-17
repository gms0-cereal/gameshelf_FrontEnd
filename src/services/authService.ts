import api from "@/lib/api";

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
}

export const getCsrfToken = async () => {
  await api.get("/auth/csrf/");
};

export const login = async (data: LoginData) => {
  await getCsrfToken();

  const response = await api.post("/auth/login/", data);
  return response.data;
};

export const register = async (data: RegisterData) => {
  await getCsrfToken();

  const response = await api.post("/auth/register/", data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout/");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get<AuthUser>("/auth/me/");
  return response.data;
};

export interface PasswordResetRequestData {
  email: string;
}

export const requestPasswordReset = async (email: string) => {
  await getCsrfToken();

  const response = await api.post("/auth/password-reset/", { email });
  return response.data;
};