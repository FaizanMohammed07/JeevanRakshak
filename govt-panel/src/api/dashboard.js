import { apiClient, buildQuery } from "./client";

export function fetchDashboardSummary(params = {}) {
  return apiClient(`/dashboard/summary${buildQuery(params)}`);
}

export function fetchOutbreakAlerts(params = {}) {
  return apiClient(`/alerts/outbreaks${buildQuery(params)}`);
}

export function fetchRapidRiskSnapshot(params = {}) {
  return apiClient(`/dashboard/risk-snapshot${buildQuery(params)}`);
}

export function fetchSdgImpact(params = {}) {
  return apiClient(`/dashboard/sdg-impact${buildQuery(params)}`);
}

export function fetchTrendWidgets(params = {}) {
  return apiClient(`/dashboard/trends${buildQuery(params)}`);
}

export function fetchOversightChecklist(params = {}) {
  return apiClient(`/dashboard/oversight${buildQuery(params)}`);
}
