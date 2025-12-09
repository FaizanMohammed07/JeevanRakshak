import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // Support multiple token keys used across panels (employer vs migrant-panel)
  const token =
    localStorage.getItem("migrant-panel-token") ||
    localStorage.getItem("employer-token") ||
    localStorage.getItem("govt-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("migrant-panel-token");
    }
    return Promise.reject(error);
  }
);

export default api;
