import { apiClient, buildQuery } from "./client";

export function fetchDiseaseDistricts() {
  return apiClient("/disease/districts");
}

export function fetchDiseaseSummary(params) {
  return apiClient(`/disease/summary${buildQuery(params)}`);
}

export function fetchTalukBreakdown(districtSlug) {
  return apiClient(`/disease/districts/${districtSlug}/taluks`);
}

export function fetchHighAlertVillages() {
  return apiClient("/disease/villages/high-risk");
}

export function fetchTimelineStats(params) {
  return apiClient(`/disease/timeline${buildQuery(params)}`);
}

export function fetchActiveDiseaseCases(params) {
  return apiClient(`/disease/active-cases${buildQuery(params)}`);
}

export function fetchKeralaRiskMap() {
  return apiClient("/disease/risk-map");
}
