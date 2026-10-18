import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. VITE_API_URL=http://localhost:8000/api/v1
  headers: {
    // "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
  // Django's CSRF cookie and header names (axios defaults to XSRF-TOKEN / X-XSRF-TOKEN)
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  // The React dev server and Django are on different ports, which counts as a different
  // origin, so axios only sends the CSRF header when this is true (needs axios 1.6+).
  withXSRFToken: true,
});

export default api;