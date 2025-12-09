import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8080/api";

// Single axios instance keeps headers/baseURL aligned across the app.
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
  timeout: 20_000,
});

export async function apiClient(path, options = {}) {
  const { method = "GET", headers, body, data, params, ...rest } = options;

  try {
    const response = await api.request({
      url: path,
      method,
      headers,
      params,
      data: data ?? body ?? undefined,
      ...rest,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || "Request failed";
    const status = error.response?.status;
    throw new Error(`API ${status ?? "ERR"} ${path}: ${message}`);
  }
}

/**
 * Helper to attach query params without repeating URLSearchParams logic.
 */
export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}
