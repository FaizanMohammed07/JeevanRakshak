import api from "./client";

export async function fetchHeroAnnouncements(
  audience = "Patients",
  options = {}
) {
  const params = new URLSearchParams();
  if (audience) params.set("audience", audience);
  if (options.district) {
    params.set("district", options.district);
  }
  const { data } = await api.get(`/camps/announcements?${params.toString()}`);
  return data?.announcements ?? [];
}

export async function publishAnnouncement(payload = {}) {
  // payload: { title, message, audience, priority, districts }
  const { data } = await api.post(`/camps/announcements`, payload);
  return data;
}
