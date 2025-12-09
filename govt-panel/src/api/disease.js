import { apiClient, buildQuery } from "./client";

export function fetchDiseaseDistricts(params) {
  return apiClient(`/disease/districts${buildQuery(params)}`);
}

export function fetchDiseaseSummary(params) {
  return apiClient(`/disease/summary${buildQuery(params)}`);
}

export function fetchTalukBreakdown(districtSlug, params) {
  if (!districtSlug) {
    throw new Error("districtSlug is required for taluk breakdown");
  }
  return apiClient(
    `/disease/districts/${districtSlug}/taluks${buildQuery(params)}`
  );
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

export function fetchEmployers() {
  return apiClient('/disease/employers');
}

export function fetchEmployerAnalysis(employerId, params = {}) {
  if (!employerId) throw new Error('employerId is required');
  const qp = buildQuery(params);
  return apiClient(`/disease/employer/${employerId}/analysis${qp}`);
}
