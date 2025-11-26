import { apiClient, buildQuery } from "./client";

/**
 * Dashboard endpoints. Replace the path segments with your backend routes once ready.
 */
export function fetchDashboardSummary({ district }) {
  return apiClient(`/dashboard/summary${buildQuery({ district })}`);
}

export function fetchOutbreakAlerts({ district }) {
  return apiClient(`/alerts/outbreaks${buildQuery({ district })}`);
}

export function fetchRapidRiskSnapshot() {
  return apiClient("/dashboard/risk-snapshot");
}

export function fetchSdgImpact() {
  return apiClient("/dashboard/sdg-impact");
}

export function fetchTrendWidgets(params) {
  return apiClient(`/dashboard/trends${buildQuery(params)}`);
}
