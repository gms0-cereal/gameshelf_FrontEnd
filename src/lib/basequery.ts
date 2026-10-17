import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// VITE_API_BASE=http://localhost:8000 (use "localhost", not 127.0.0.1, so the session cookie is sent)
const API_BASE = String(import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

function getCookie(name: string): string | undefined {
  const row = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return row ? decodeURIComponent(row.split("=")[1]) : undefined;
}

// Django session login: the browser sends the session cookie (credentials: "include"),
// and every write request carries the CSRF token that Django put in the csrftoken cookie.
export const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE}/api/v1`,
  credentials: "include",
  prepareHeaders: (headers, { type }) => {
    const csrf = getCookie("csrftoken");
    if (csrf && type === "mutation") headers.set("X-CSRFToken", csrf);
    return headers;
  },
});