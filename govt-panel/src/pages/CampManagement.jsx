import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Tent,
  Users,
  MapPin,
  AlertTriangle,
  X,
  UserCheck,
  Activity,
  Building2,
  Megaphone,
  CheckCircle,
  Cpu,
  Zap,
  Radar,
  Trash2,
} from "lucide-react";
import { slugify } from "../utils/slugify";
import {
  fetchCampOverview,
  publishCampAnnouncement,
  deleteCampAnnouncement,
} from "../api/camps";

const riskColors = {
  high: "bg-red-100 text-red-800 border-red-300",
  medium: "bg-orange-100 text-orange-800 border-orange-300",
  low: "bg-green-100 text-green-800 border-green-300",
};

const announcementPriorityMeta = {
  high: {
    label: "High Priority",
    description: "Pins to hero feeds until resolved",
    badge: "bg-red-100 text-red-700",
  },
  medium: {
    label: "Medium Priority",
    description: "Standard broadcast cadence",
    badge: "bg-amber-100 text-amber-700",
  },
  low: {
    label: "Low Priority",
    description: "FYI updates & reminders",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

const getPriorityMeta = (value) => {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (announcementPriorityMeta[normalized]) {
      return announcementPriorityMeta[normalized];
    }
  }
  return announcementPriorityMeta.medium;
};

const clampPercent = (value) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
};

const deriveCoveragePercent = (seed) => {
  if (!seed) return 45;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) % 101;
  }
  return clampPercent(hash < 30 ? hash + 30 : hash);
};

function CampManagement() {
  const navigate = useNavigate();
  const { campSlug } = useParams();

  const [camps, setCamps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [transferQueue, setTransferQueue] = useState([]);
  const [automation, setAutomation] = useState([]);
  const [announcementFeed, setAnnouncementFeed] = useState([]);
  const [lastTransfer, setLastTransfer] = useState(null);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    audience: "Doctors",
    priority: "medium",
    districts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  const hasLiveCamps = camps.length > 0;

  const campCards = useMemo(() => {
    if ((camps ?? []).length > 0) {
      return camps.map((camp) => ({
        ...camp,
        slug: camp.slug ?? slugify(camp.name),
        synthetic: false,
      }));
    }

    const deduped = new Map();

    const register = (payload, source) => {
      if (!payload?.name) return;
      const key = `${payload.name}-${payload.district ?? ""}`.toLowerCase();
      if (deduped.has(key)) return;
      const generatedSlug =
        payload.slug ??
        slugify(`${payload.name}-${payload.district || source}`);
      deduped.set(key, {
        id: payload.id ?? `${source}-${key}`,
        name: payload.name,
        district: payload.district ?? payload.location ?? "Unknown district",
        population:
          payload.population ??
          payload.estimatedPopulation ??
          (payload.sick ? payload.sick * 4 : 0),
        sick: payload.sick ?? payload.affected ?? 0,
        vaccinated:
          typeof payload.vaccinated === "number"
            ? clampPercent(payload.vaccinated)
            : deriveCoveragePercent(payload.name),
        risk: (payload.risk || payload.severity || "medium").toLowerCase(),
        slug: generatedSlug,
        synthetic: true,
        sourceLabel: source,
      });
    };

    (alerts ?? []).forEach((alert) =>
      register(
        {
          name: alert.camp,
          district: alert.district,
          sick: alert.cases ?? alert.sick,
          risk: alert.severity,
          vaccinated: alert.coverage,
        },
        "automation-alert"
      )
    );

    (summary?.urgentAlerts ?? []).forEach((camp) =>
      register(camp, "field-queue")
    );

    (transferQueue ?? []).forEach((camp) =>
      register(
        {
          ...camp,
          vaccinated: camp.vaccinated ?? camp.coverage,
        },
        "transfer-queue"
      )
    );

    return Array.from(deduped.values());
  }, [alerts, camps, summary, transferQueue]);

  const districtOptions = useMemo(() => {
    const unique = new Set();
    (camps ?? []).forEach((camp) => {
      if (camp?.district) {
        unique.add(camp.district);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [camps]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCampOverview();
      setCamps(data.camps ?? []);
      setSummary(data.summary ?? null);
      setAlerts(data.alerts ?? []);
      setTransferQueue(data.transferQueue ?? []);
      setAutomation(data.automation ?? []);
      setAnnouncementFeed(data.announcements ?? []);
      setLastRefreshedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!campSlug) {
      return;
    }
    const match = camps.find(
      (camp) => (camp.slug ?? slugify(camp.name)) === campSlug
    );
    if (!match) {
      setSelectedCamp(null);
      navigate("/camps", { replace: true });
      return;
    }
    setSelectedCamp(match);
  }, [campSlug, camps, navigate]);

  const metrics = useMemo(() => {
    return (summary?.metrics ?? []).map((metric) => ({
      label: metric.label,
      subline: metric.subline,
      value:
        typeof metric.value === "number"
          ? metric.value.toLocaleString()
          : metric.value,
      iconKey: metric.iconKey,
    }));
  }, [summary]);

  const automationStats = useMemo(() => {
    const criticalCount = (alerts ?? []).filter(
      (alert) => alert.severity?.toLowerCase() === "critical"
    ).length;
    return [
      {
        label: "Critical escalations",
        value: criticalCount,
        subline: criticalCount ? "Need manual sign-off" : "All clear",
        accent: "bg-red-50 border-red-200 text-red-700",
        Icon: AlertTriangle,
      },
      {
        label: "Transfers queued",
        value: transferQueue.length,
        subline: transferQueue.length
          ? "Hospitals pinged via IVR"
          : "No referrals pending",
        accent: "bg-blue-50 border-blue-200 text-blue-700",
        Icon: Building2,
      },
      {
        label: "Automation tasks",
        value: automation.length,
        subline: automation.length ? "Playbooks executing" : "All bots idle",
        accent: "bg-emerald-50 border-emerald-200 text-emerald-700",
        Icon: Cpu,
      },
    ];
  }, [alerts, automation, transferQueue]);

  const automationPlaybooks = useMemo(() => {
    const hotspotDistrict = summary?.hotspot?.district;
    const topUrgent = summary?.urgentAlerts?.[0];
    const pendingTransfers = transferQueue.length;
    return [
      {
        id: "playbook-ivr",
        title: "Auto IVR broadcast",
        description: pendingTransfers
          ? `Trigger multilingual robo-calls to ${pendingTransfers} referral hospitals when alerts spike.`
          : "Pre-arm multilingual robo-calls for referral hospitals when new alerts arrive.",
        status: alerts.length ? "Armed" : "Idle",
        actionLabel: pendingTransfers ? "Dial Hospitals" : "Prime IVR",
      },
      {
        id: "playbook-panel",
        title: `Camp control panel${
          hotspotDistrict ? ` · ${hotspotDistrict}` : ""
        }`,
        description: hotspotDistrict
          ? `Blueprint widgets for the ${hotspotDistrict} hotspot so teams can edit rosters live.`
          : "Blueprint the next-gen camp panel with roster editing and IoT telemetry.",
        status: hasLiveCamps ? "Live" : "Preview",
        actionLabel: hasLiveCamps ? "Open Panel" : "Book Preview",
      },
      {
        id: "playbook-supply",
        title: "Predictive supply drops",
        description: topUrgent
          ? `Auto-stage IV sets near ${
              topUrgent.district
            } once sick count crosses ${topUrgent.sick ?? 0}.`
          : "Pre-stage medical caches whenever any district hits medium risk.",
        status: automation.length > 2 ? "Queued" : "Draft",
        actionLabel: "Schedule Drop",
      },
    ];
  }, [alerts, automation, hasLiveCamps, summary, transferQueue]);

  const lastSyncLabel = useMemo(() => {
    if (!lastRefreshedAt) return "--";
    return lastRefreshedAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastRefreshedAt]);

  const selectedCampVaccinated = clampPercent(selectedCamp?.vaccinated ?? 0);

  const handleTransfer = (camp) => {
    setLastTransfer({
      campName: camp.name,
      hospitalName: camp.hospital.name,
    });
  };

  const toggleDistrictSelection = (district) => {
    setAnnouncementForm((prev) => {
      const exists = prev.districts.includes(district);
      const next = exists
        ? prev.districts.filter((item) => item !== district)
        : [...prev.districts, district];
      return { ...prev, districts: next };
    });
  };

  const selectAllDistricts = () => {
    if (!districtOptions.length) return;
    setAnnouncementForm((prev) => ({
      ...prev,
      districts: districtOptions,
    }));
  };

  const clearDistrictSelection = () => {
    setAnnouncementForm((prev) => ({
      ...prev,
      districts: [],
    }));
  };

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      return;
    }
    try {
      setSubmittingAnnouncement(true);
      const response = await publishCampAnnouncement({
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        audience: announcementForm.audience,
        priority: announcementForm.priority,
        districts: announcementForm.districts,
      });
      setAnnouncementFeed((prev) => [response.announcement, ...prev]);
      setAnnouncementForm((prev) => ({
        ...prev,
        title: "",
        message: "",
        districts: [],
      }));
      setAnnouncementModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const requestAnnouncementDelete = (announcement) => {
    if (!announcement) return;
    setAnnouncementToDelete(announcement);
  };

  const cancelAnnouncementDelete = () => {
    if (deletingAnnouncementId) return;
    setAnnouncementToDelete(null);
  };

  const confirmAnnouncementDelete = async () => {
    if (!announcementToDelete?.id) return;
    try {
      setDeletingAnnouncementId(announcementToDelete.id);
      await deleteCampAnnouncement(announcementToDelete.id);
      setAnnouncementFeed((prev) =>
        prev.filter((item) => item.id !== announcementToDelete.id)
      );
      setAnnouncementToDelete(null);
    } catch (err) {
      setError(err.message || "Unable to delete announcement");
    } finally {
      setDeletingAnnouncementId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Migrant Camp Management
          </h2>
          <p className="text-gray-600">
            Monitor and manage migrant camps across Kerala
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last sync: {lastSyncLabel}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={loadOverview}
            className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Refresh Snapshot
          </button>
          <button
            onClick={() => setAnnouncementModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            <Megaphone size={18} />
            Broadcast Announcement
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-500 mb-4">
          Loading live camp metrics...
        </p>
      )}

      {lastTransfer && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-800">
          <CheckCircle size={18} />
          Transfer request sent to {lastTransfer.hospitalName} for{" "}
          {lastTransfer.campName}. Hospital triage team notified.
        </div>
      )}

      {metrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {metrics.map((metric) => {
            const iconMap = {
              users: Users,
              alert: AlertTriangle,
              shield: UserCheck,
            };
            const Icon = iconMap[metric.iconKey] ?? Users;
            const accent =
              Icon === UserCheck
                ? "text-green-600 bg-green-100"
                : Icon === AlertTriangle
                ? "text-red-600 bg-red-100"
                : "text-blue-600 bg-blue-100";
            return (
              <div
                key={metric.label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <p className="text-xs text-gray-400">{metric.subline}</p>
                </div>
                <div className={`p-3 rounded-full ${accent}`}>
                  <Icon size={20} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="text-blue-600" size={24} />
            <div>
              <p className="text-xs uppercase text-blue-600 tracking-wide">
                Hotspot District
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                {summary?.hotspot?.district || "--"}
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {summary?.hotspot?.name || "No live hotspot"}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900">
              {summary?.hotspot?.sick ?? 0} sick
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                riskColors[summary?.hotspot?.risk] || riskColors.low
              }`}
            >
              {(summary?.hotspot?.risk || "low").toUpperCase()} RISK
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Urgent Warnings
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Field response queue
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {summary?.urgentAlerts?.length ?? 0} camps
            </span>
          </div>
          <div className="space-y-3">
            {(summary?.urgentAlerts ?? []).map((camp) => (
              <div
                key={camp.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-900">{camp.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {camp.district}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {camp.sick} sick
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      riskColors[camp.risk] || riskColors.low
                    }`}
                  >
                    {(camp.risk || "low").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Automation Alerts
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                System-generated escalations
              </h3>
            </div>
            <span className="text-xs text-gray-500">{alerts.length} items</span>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-100 rounded-lg p-4 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">
                    {alert.camp} · {alert.district}
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      alert.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {(alert.severity || "alert").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500">
                  Recommendation: {alert.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-blue-600" size={22} />
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Hospital Coordination
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Camps queued for referrals
              </h3>
            </div>
          </div>
          {transferQueue.length === 0 ? (
            <p className="text-sm text-gray-500">
              All camps are stable right now.
            </p>
          ) : (
            <div className="space-y-4">
              {transferQueue.map((camp) => (
                <div
                  key={camp.id}
                  className="border border-gray-100 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{camp.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {camp.district}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        riskColors[camp.risk] || riskColors.low
                      }`}
                    >
                      {(camp.risk || "low").toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Recommend: {camp.hospital.name}
                      </p>
                      <p>
                        {camp.hospital.distance} • Hotline{" "}
                        {camp.hospital.hotline}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTransfer(camp)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                    >
                      Notify Hospital
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Announcement Feed
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Live hero banner pushes
              </h3>
            </div>
            <span className="text-xs text-gray-500">Doctor & Patient apps</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {announcementFeed.length === 0 && (
              <p className="text-sm text-gray-500">No announcements yet.</p>
            )}
            {announcementFeed.map((item) => {
              const priorityMeta = getPriorityMeta(item.priority);
              const targetLabel = item.districts?.length
                ? `${item.districts.length} district${
                    item.districts.length === 1 ? "" : "s"
                  }: ${item.districts.join(", ")}`
                : "All districts";
              return (
                <div
                  key={item.id}
                  className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                        {item.audience} hero
                      </span>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityMeta.badge}`}
                      >
                        {priorityMeta.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{item.message}</p>
                  <p className="text-xs text-gray-500 mb-2">{targetLabel}</p>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "--"}
                    </span>
                    <span
                      className="w-1 h-1 rounded-full bg-gray-300"
                      aria-hidden="true"
                    ></span>
                    <span>{priorityMeta.description}</span>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      onClick={() => requestAnnouncementDelete(item)}
                      disabled={Boolean(deletingAnnouncementId)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {announcementToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Confirm removal
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  Remove this announcement?
                </h3>
              </div>
              <button
                type="button"
                onClick={cancelAnnouncementDelete}
                disabled={Boolean(deletingAnnouncementId)}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-gray-600">
                Remove this announcement from all hero feeds? This action
                instantly retracts it from doctor and patient dashboards.
              </p>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {announcementToDelete.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {announcementToDelete.message}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={cancelAnnouncementDelete}
                  disabled={Boolean(deletingAnnouncementId)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Keep Announcement
                </button>
                <button
                  type="button"
                  onClick={confirmAnnouncementDelete}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                  disabled={Boolean(deletingAnnouncementId)}
                >
                  {deletingAnnouncementId
                    ? "Removing..."
                    : "Delete across feeds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {automation.length > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Automation Queue
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Actions auto-assigned by HQ
              </h3>
            </div>
            <span className="text-xs text-gray-500">
              {automation.length} tasks
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automation.map((task) => (
              <div
                key={task.id}
                className="border border-gray-100 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{task.camp}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {task.district}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      task.priority === "urgent"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {(task.priority || "normal").toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{task.action}</p>
                <p className="text-xs text-gray-500 mb-1">
                  Metric: {task.metric}
                </p>
                <p className="text-xs text-gray-400">
                  Deadline: {new Date(task.deadline).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*
        Temporarily hiding automation stats cards (Critical escalations / Transfers queued / Automation tasks)
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {automationStats.map((stat) => {
            const IconComp = stat.Icon;
            return (
              <div
                key={stat.label}
                className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${stat.accent}`}
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subline}</p>
                </div>
                <div className="p-3 bg-white/70 rounded-full">
                  <IconComp size={24} />
                </div>
              </div>
            );
          })}
        </div>
      */}

      {/*
        Temporarily hiding Camp command preview + Automation playbooks panel per request
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-sm">
            ...
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            ...
          </div>
        </div>
      */}

      {!hasLiveCamps && campCards.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No live camp objects returned yet. Showing synthesized camps derived
          from automation alerts so response teams can keep triaging.
        </div>
      )}

      {campCards.length === 0 && (
        <div className="mb-6 rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-600">
          No camps detected yet. HQ bots will auto inject preview camps as soon
          as new alerts stream in.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campCards.map((camp) => (
          <div
            key={camp.id || camp.slug}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tent className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{camp.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin size={14} />
                    {camp.district}
                  </p>
                </div>
              </div>
              {camp.synthetic && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                  Derived
                </span>
              )}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Users size={16} />
                  Population
                </span>
                <span className="font-semibold text-gray-900">
                  {camp.population?.toLocaleString?.() ??
                    camp.population ??
                    "--"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Risk Level
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    riskColors[camp.risk] || riskColors.low
                  }`}
                >
                  {(camp.risk || "low").toUpperCase()}
                </span>
              </div>
              {camp.synthetic && (
                <p className="text-xs text-gray-500">
                  Source: {camp.sourceLabel?.replace("-", " ") || "automation"}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedCamp(camp);
                if (camp.synthetic) {
                  return;
                }
                navigate(`/camps/${camp.slug || slugify(camp.name)}`);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {camp.synthetic ? "Preview Camp (Beta)" : "View Camp Details"}
            </button>
          </div>
        ))}
      </div>

      {announcementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Broadcast announcement
                </h3>
                <p className="text-sm text-gray-500">
                  Goes live on the selected hero page instantly.
                </p>
              </div>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme / Campaign Title
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Eg: Free Fever Screening Week"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Details that should pop on the hero banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience hero page
                </label>
                <select
                  value={announcementForm.audience}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      audience: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option>Doctors</option>
                  <option>Patients</option>
                  <option>All</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Will surface on the {announcementForm.audience.toLowerCase()}{" "}
                  hero carousel + push alerts.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escalation priority
                </label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="high">High · Pins hero + sends SMS</option>
                  <option value="medium">Medium · Standard rotation</option>
                  <option value="low">Low · FYI banner</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {getPriorityMeta(announcementForm.priority).description}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target districts
                    </label>
                    <p className="text-xs text-gray-500">
                      Leave empty to reach patients in every district.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllDistricts}
                      disabled={!districtOptions.length}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={clearDistrictSelection}
                      disabled={!announcementForm.districts.length}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {districtOptions.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {districtOptions.map((district) => {
                      const active =
                        announcementForm.districts.includes(district);
                      return (
                        <button
                          key={district}
                          type="button"
                          onClick={() => toggleDistrictSelection(district)}
                          className={`text-sm font-medium px-3 py-2 rounded-lg border focus:outline-none transition ${
                            active
                              ? "bg-indigo-600 text-white border-transparent"
                              : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          {district}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">
                    Districts populate once live camp data is loaded.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingAnnouncement}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submittingAnnouncement
                    ? "Publishing..."
                    : "Push Announcement"}
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">Camp Details</h3>
              <button
                onClick={() => {
                  setSelectedCamp(null);
                  navigate("/camps");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Tent className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedCamp.name}
                    </h4>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin size={16} />
                      {selectedCamp.district} District
                    </p>
                    {selectedCamp.synthetic && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded mt-2">
                        <AlertTriangle size={12} /> Preview data
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Population
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedCamp.population?.toLocaleString?.() ??
                        selectedCamp.population ??
                        "--"}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Sick Migrants</p>
                    <p className="text-2xl font-bold text-red-900">
                      {selectedCamp.sick ?? "--"}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Vaccination Progress
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {selectedCampVaccinated}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedCampVaccinated}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Risk Level
                  </p>
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold border ${
                      riskColors[selectedCamp.risk] || riskColors.low
                    }`}
                  >
                    {(selectedCamp.risk || "low").toUpperCase()} RISK
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={selectedCamp.synthetic}
                >
                  <AlertTriangle size={20} />
                  Flag Escalation
                </button>
                <button
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  disabled={selectedCamp.synthetic}
                >
                  <UserCheck size={20} />
                  Assign Health Officer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampManagement;
