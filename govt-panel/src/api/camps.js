import { apiClient, buildQuery } from "./client";

export function fetchCampOverview(params = {}) {
  return apiClient(`/camps/overview${buildQuery(params)}`);
}

export function publishCampAnnouncement(payload) {
  return apiClient("/camps/announcements", {
    method: "POST",
    data: payload,
  });
}

export function deleteCampAnnouncement(id) {
  return apiClient(`/camps/announcements/${id}`, {
    method: "DELETE",
  });
}
