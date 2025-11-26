const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Lightweight wrapper around fetch so components can call backend endpoints
 * without repeating boilerplate. Update VITE_API_BASE_URL in .env.local to
 * point to your API gateway (ex: https://api.example.com/v1).
 */
export async function apiClient(path, options = {}) {
  const { method = "GET", headers, body, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    const errorPayload = await safeParseJson(response);
    const message = errorPayload?.message || response.statusText;
    throw new Error(`API ${response.status} ${response.url}: ${message}`);
  }

  return safeParseJson(response);
}

async function safeParseJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
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
