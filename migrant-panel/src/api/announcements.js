import api from "./client";

export async function fetchHeroAnnouncements(audience = "Patients") {
  const params = new URLSearchParams();
  if (audience) params.set("audience", audience);
  const { data } = await api.get(`/camps/announcements?${params.toString()}`);
  return data?.announcements ?? [];
}
