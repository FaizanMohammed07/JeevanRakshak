import { mockPatients } from "../data/mockPatients";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const fallbackStats = {
  todayPatients: 12,
  pendingFollowUps: 4,
  chronicAlerts: 3,
  recentPrescriptions: 18,
  weeklyTrend: 12,
};

const fallbackActivity = [
  {
    id: "prescription-1",
    diagnosis: "Seasonal flu",
    visit_date: new Date().toISOString(),
    migrant_workers: { name: "Rahul Kumar" },
  },
  {
    id: "prescription-2",
    diagnosis: "Hypertension review",
    visit_date: new Date(Date.now() - 86400000).toISOString(),
    migrant_workers: { name: "Sajid Ali" },
  },
];

const fallbackAlerts = [
  {
    id: "alert-1",
    title: "Follow-up overdue",
    message: "Patient Rahim Khan missed the scheduled follow-up.",
    severity: "high",
    created_at: new Date().toISOString(),
    action_required: true,
  },
];

const fallbackSearchProfiles = mockPatients.map((patient) =>
  mapPatientToSearchSummary(patient)
);

function mapPatientToSearchSummary(patient) {
  if (!patient) return null;

  const chronicList =
    patient.chronic_diseases || patient.chronicConditions || [];

  return {
    id: patient.id || patient._id || patient.migrant_health_id,
    name: patient.name || "Unknown Patient",
    smart_health_id: patient.smart_health_id || patient.migrant_health_id,
    phone: patient.phone || patient.emergency_contact || "N/A",
    state_of_origin: patient.state_of_origin || patient.state || "Kerala",
    district: patient.district || "Ernakulam",
    last_visit_date:
      patient.last_visit_date || patient.visits?.[0]?.visit_date || null,
    is_high_risk: Boolean(patient.is_high_risk || chronicList.length >= 2),
    chronic_conditions: chronicList.map((condition, index) => ({
      id: `${patient.id || patient._id || index}-condition-${index}`,
      condition_type: condition,
    })),
    allergies: patient.allergies || [],
    rawPatient: patient,
  };
}

function filterLocalPatients(query, searchType) {
  if (!query) return [];
  const needle = query.trim().toLowerCase();

  return fallbackSearchProfiles.filter((patient) => {
    if (!patient) return false;

    switch (searchType) {
      case "name":
        return patient.name.toLowerCase().includes(needle);
      case "phone":
        return (patient.phone || "").toLowerCase().includes(needle);
      case "aadhaar":
        return (patient.aadhaar || patient.smart_health_id || "")
          .toLowerCase()
          .includes(needle);
      case "smart_id":
      default:
        return (patient.smart_health_id || "").toLowerCase().includes(needle);
    }
  });
}

export async function fetchDashboardSnapshot(doctorId) {
  try {
    const token = localStorage.getItem("doctorToken");
    const response = await fetch(
      `${API_BASE_URL}/api/doctors/${doctorId}/dashboard`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard snapshot");
    }

    const data = await response.json();
    if (data?.stats && data?.recentActivity && data?.alerts) {
      return data;
    }

    throw new Error("Dashboard response malformed");
  } catch (error) {
    console.warn("Falling back to mock dashboard data", error);
    error.snapshotFallback = {
      stats: fallbackStats,
      recentActivity: fallbackActivity,
      alerts: fallbackAlerts,
    };
    throw error;
  }
}

export async function fetchDoctorAnnouncements(audience = "Doctors") {
  try {
    const params = new URLSearchParams({ audience });
    const response = await fetch(
      `${API_BASE_URL}/api/camps/announcements?${params.toString()}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch announcements");
    }

    const payload = await response.json();
    const announcements = Array.isArray(payload?.announcements)
      ? payload.announcements
      : [];
    return announcements;
  } catch (error) {
    console.warn("Falling back to empty announcements", error);
    return [];
  }
}

export async function searchPatients({ query, searchType }) {
  try {
    const token = localStorage.getItem("doctorToken");
    const response = await fetch(
      `${API_BASE_URL}/api/doctors/patients/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ query, searchType }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Please log in to search patients");
      }
      throw new Error("Failed to search patients");
    }

    const payload = await response.json();
    const records =
      payload?.patients || payload?.data?.patients || payload?.data || [];

    const normalized = records
      .map((record) => mapPatientToSearchSummary(record))
      .filter(Boolean);

    if (normalized.length > 0) {
      return normalized;
    }

    return filterLocalPatients(query, searchType);
  } catch (error) {
    console.warn("Falling back to mock patient search", error);
    if (error.message?.includes("log in")) {
      throw error;
    }
    return filterLocalPatients(query, searchType);
  }
}
