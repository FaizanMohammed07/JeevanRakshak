import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  Tent,
  AlertCircle,
  Syringe,
  Building2,
  TrendingUp,
  HeartPulse,
  Scale,
  ShieldCheck,
} from "lucide-react";
import {
  fetchDiseaseDistricts,
  fetchDiseaseSummary,
  fetchActiveDiseaseCases,
  fetchTalukBreakdown,
} from "../api/disease";
import {
  ResponsiveContainer,
  BarChart as RechartBarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import TrendCharts from "./TrendCharts";
import { slugify } from "../utils/slugify";
import {
  fetchDashboardSummary,
  fetchOutbreakAlerts,
  fetchRapidRiskSnapshot,
  fetchSdgImpact,
  fetchOversightChecklist,
} from "../api/dashboard";
// import { fetchDiseaseDistricts } from "../api/disease";

const ALL_DISTRICTS_LABEL = "All Districts";
const REFRESH_INTERVAL_MS = 45_000;

const statIconMap = {
  migrants: Users,
  camps: Tent,
  alerts: AlertCircle,
  vaccinations: Syringe,
  hospitals: Building2,
};

const sdgIconMap = {
  heart: HeartPulse,
  scale: Scale,
  shield: ShieldCheck,
};
const hotspotRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "5 Days", value: "5d", rangeDays: 5, offsetDays: 0 },
  { label: "10 Days", value: "10d", rangeDays: 10, offsetDays: 0 },
];

const activeCaseRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "5 Days", value: "5d", rangeDays: 5, offsetDays: 0 },
  { label: "10 Days", value: "10d", rangeDays: 10, offsetDays: 0 },
  { label: "30 Days", value: "30d", rangeDays: 30, offsetDays: 0 },
];

const districtCasesRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "5 Days", value: "5d", rangeDays: 5, offsetDays: 0 },
  { label: "10 Days", value: "10d", rangeDays: 10, offsetDays: 0 },
  { label: "15 Days", value: "15d", rangeDays: 15, offsetDays: 0 },
];

const talukWindowOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "5 Days", value: "5d", rangeDays: 5, offsetDays: 0 },
  { label: "10 Days", value: "10d", rangeDays: 10, offsetDays: 0 },
  { label: "15 Days", value: "15d", rangeDays: 15, offsetDays: 0 },
  { label: "Custom", value: "custom" },
];

function Dashboard() {
  const [districtOptions, setDistrictOptions] = useState([ALL_DISTRICTS_LABEL]);
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS_LABEL);
  const [stats, setStats] = useState([]);
  const [outbreakAlerts, setOutbreakAlerts] = useState([]);
  const [sdgMetrics, setSdgMetrics] = useState([]);
  const [rapidRiskModel, setRapidRiskModel] = useState([]);
  const [oversightChecks, setOversightChecks] = useState([]);
  const [oversightSummary, setOversightSummary] = useState(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(Date.now());
  const [districtInsights, setDistrictInsights] = useState([]);
  const [hotspotInsights, setHotspotInsights] = useState([]);
  const [expandedTaluk, setExpandedTaluk] = useState(null);
  const { districtId, talukId } = useParams();
  const [districtTalukInsight, setDistrictTalukInsight] = useState(null);
  const [talukWindowKey, setTalukWindowKey] = useState(
    talukWindowOptions[0].value
  );
  const [talukLoading, setTalukLoading] = useState(false);
  const [customTalukStartDate, setCustomTalukStartDate] = useState("");
  const [customTalukEndDate, setCustomTalukEndDate] = useState("");
  const [selectedVillageDetails, setSelectedVillageDetails] = useState(null);

  const [hotspotRangeKey, setHotspotRangeKey] = useState(
    hotspotRangeOptions[0].value
  );

  // Pull district names once so the filter dropdown stays in sync with backend metadata.
  useEffect(() => {
    let ignore = false;
    async function loadDistricts() {
      try {
        const response = await fetchDiseaseDistricts();
        if (
          ignore ||
          !Array.isArray(response?.districts) ||
          response.districts.length === 0
        ) {
          return;
        }
        const names = response.districts
          .map((entry) => entry?.district)
          .filter(Boolean);
        const uniqueNames = Array.from(new Set(names));
        setDistrictOptions([ALL_DISTRICTS_LABEL, ...uniqueNames]);
      } catch (error) {
        console.error("Failed to load district list", error);
      }
    }
    loadDistricts();
    return () => {
      ignore = true;
    };
  }, []);

  // Keep the selected option aligned with the slug in the route.
  useEffect(() => {
    if (!districtOptions.length) return;
    if (!districtId) {
      setSelectedDistrict(districtOptions[0]);
      return;
    }

    const match = districtOptions.find(
      (district) => slugify(district) === districtId
    );
    if (!match) {
      setSelectedDistrict(districtOptions[0]);
      navigate("/dashboard", { replace: true });
      return;
    }

    setSelectedDistrict(match);
  }, [districtId, districtOptions, navigate]);

  const activeDistrictData = districtTalukInsight;

  const canShowTalukDrilldown =
    selectedDistrict && selectedDistrict !== ALL_DISTRICTS_LABEL;

  const maxTalukCases = useMemo(() => {
    if (!activeDistrictData || !activeDistrictData.taluks?.length) return 0;
    return Math.max(...activeDistrictData.taluks.map((taluk) => taluk.cases));
  }, [activeDistrictData]);
  const handleDistrictChange = (event) => {
    const nextDistrict = event.target.value;
    if (!nextDistrict) return;
    setSelectedDistrict(nextDistrict);
    setExpandedTaluk(null);
    setSelectedVillageDetails(null);
    setCustomTalukStartDate("");
    setCustomTalukEndDate("");
    navigate(`/dashboard/district/${slugify(nextDistrict)}`);
  };
  const handleTalukToggle = (taluk) => {
    if (!taluk?.name) return;
    setExpandedTaluk((current) => (current === taluk.name ? null : taluk.name));
    // Clear previously selected village when switching taluks for clarity.
    setSelectedVillageDetails(null);
  };

  const handleTalukKeyDown = (event, taluk) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTalukToggle(taluk);
    }
  };

  const handleVillageSelect = (talukName, village) => {
    if (!village) return;
    setSelectedVillageDetails({
      taluk: talukName,
      ...village,
    });
  };

  const handleVillagePanelClose = () => {
    setSelectedVillageDetails(null);
  };

  const handleTalukWindowChange = (value) => {
    setTalukWindowKey(value);
    if (value !== "custom") {
      setCustomTalukStartDate("");
      setCustomTalukEndDate("");
    }
  };
  const hotspotRangeConfig = useMemo(
    () =>
      hotspotRangeOptions.find((option) => option.value === hotspotRangeKey) ??
      hotspotRangeOptions[0],
    [hotspotRangeKey]
  );
  const { config: talukWindowConfig, error: talukWindowError } = useMemo(() => {
    if (talukWindowKey !== "custom") {
      return {
        config:
          talukWindowOptions.find(
            (option) => option.value === talukWindowKey
          ) ?? talukWindowOptions[0],
        error: null,
      };
    }

    if (!customTalukStartDate || !customTalukEndDate) {
      return { config: null, error: "Select start and end dates" };
    }

    const start = new Date(customTalukStartDate);
    const end = new Date(customTalukEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { config: null, error: "Invalid date range" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return { config: null, error: "End date must be after start date" };
    }
    if (end > today) {
      return { config: null, error: "Future dates not allowed" };
    }

    const rangeDays =
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (rangeDays <= 0) {
      return { config: null, error: "Invalid range" };
    }
    const offsetDays = Math.round(
      (today.getTime() - end.getTime()) / 86_400_000
    );

    return {
      config: {
        label: `Custom (${start.toLocaleDateString(
          "en-IN"
        )} → ${end.toLocaleDateString("en-IN")})`,
        rangeDays,
        offsetDays,
      },
      error: null,
    };
  }, [talukWindowKey, customTalukStartDate, customTalukEndDate]);
  const highAlertVillages = useMemo(() => {
    // Flatten to expose highest case villages regardless of district for quick hero alerts.
    return hotspotInsights
      .flatMap((district) =>
        (district.taluks ?? []).flatMap((taluk) =>
          (taluk.villages ?? []).map((village) => ({
            district: district.district,
            taluk: taluk.name,
            name: village.name,
            cases: village.cases,
          }))
        )
      )
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 5);
  }, [hotspotInsights]);

  const villageSummary = useMemo(() => {
    if (!highAlertVillages.length) {
      return { total: 0, average: 0, topTaluk: "--", peakVillage: "--" };
    }
    const total = highAlertVillages.reduce(
      (sum, village) => sum + village.cases,
      0
    );
    const peakVillage = highAlertVillages[0];
    return {
      total,
      average: Math.round(total / highAlertVillages.length),
      topTaluk: peakVillage.taluk,
      peakVillage: peakVillage.name,
    };
  }, [highAlertVillages]);

  const priorityActions = useMemo(() => {
    if (!highAlertVillages.length) return [];
    return highAlertVillages.slice(0, 3).map((village) => ({
      title: `Deploy rapid squad to ${village.name}`,
      detail: `${village.cases} cases • ${village.taluk} Taluk`,
    }));
  }, [highAlertVillages]);
  useEffect(() => {
    let ignore = false;
    async function loadHotspotInsights() {
      try {
        const response = await fetchDiseaseDistricts({
          rangeDays: hotspotRangeConfig.rangeDays,
          offsetDays: hotspotRangeConfig.offsetDays,
        });
        if (ignore || !Array.isArray(response?.districts)) return;
        setHotspotInsights(response.districts);
      } catch (error) {
        console.error("Failed to fetch hotspot insights", error);
        setDataSyncError((prev) => prev ?? "Unable to sync hotspot alerts.");
      }
    }
    loadHotspotInsights();
    return () => {
      ignore = true;
    };
  }, [
    hotspotRangeConfig.rangeDays,
    hotspotRangeConfig.offsetDays,
    refreshTick,
  ]);
  const getVillageSeverity = (cases) => {
    if (cases >= 10)
      return { badge: "bg-red-100 text-red-800", label: "Critical" };
    if (cases >= 6)
      return { badge: "bg-orange-100 text-orange-700", label: "Watch" };
    return { badge: "bg-green-100 text-green-700", label: "Stable" };
  };
  const resolvedDistrict = useMemo(() => {
    const fallbackDistrict = districtInsights[0]?.district ?? "";
    if (!districtId) return fallbackDistrict;
    return (
      districtInsights.find(
        (district) => slugify(district.district) === districtId
      )?.district ?? fallbackDistrict
    );
  }, [districtId, districtInsights]);

  useEffect(() => {
    let ignore = false;
    async function loadDistrictInsights() {
      try {
        const response = await fetchDiseaseDistricts();
        if (
          ignore ||
          !Array.isArray(response?.districts) ||
          response.districts.length === 0
        ) {
          return;
        }
        setDistrictInsights(response.districts);
      } catch (error) {
        console.error("Failed to fetch district insights", error);
        setDataSyncError(
          (prev) => prev ?? "Unable to sync district drill-down."
        );
      }
    }
    loadDistrictInsights();
    return () => {
      ignore = true;
    };
  }, [refreshTick]);

  useEffect(() => {
    if (
      !selectedDistrict ||
      selectedDistrict === ALL_DISTRICTS_LABEL ||
      !talukWindowConfig
    ) {
      setDistrictTalukInsight(null);
      setTalukLoading(false);
      return;
    }

    let ignore = false;
    async function loadTalukBreakdown() {
      setTalukLoading(true);
      setDistrictTalukInsight(null);
      try {
        const response = await fetchTalukBreakdown(slugify(selectedDistrict), {
          rangeDays: talukWindowConfig.rangeDays,
          offsetDays: talukWindowConfig.offsetDays,
        });
        if (ignore) return;
        setDistrictTalukInsight(response?.district ?? null);
      } catch (error) {
        console.error("Failed to fetch taluk drill-down", error);
        if (ignore) return;
        setDistrictTalukInsight(null);
        setDataSyncError((prev) => prev ?? "Unable to sync taluk drill-down.");
      } finally {
        if (!ignore) {
          setTalukLoading(false);
        }
      }
    }

    loadTalukBreakdown();
    return () => {
      ignore = true;
    };
  }, [
    selectedDistrict,
    talukWindowConfig?.rangeDays,
    talukWindowConfig?.offsetDays,
    refreshTick,
  ]);
  useEffect(() => {
    if (!talukId) {
      setExpandedTaluk(null);
      return;
    }

    const match = activeDistrictData?.taluks?.find(
      (taluk) => slugify(taluk.name) === talukId
    );
    setExpandedTaluk(match?.name ?? null);
  }, [talukId, activeDistrictData]);

  useEffect(() => {
    if (!selectedVillageDetails) return;
    const stillPresent = districtTalukInsight?.taluks?.some((taluk) => {
      if (taluk.name !== selectedVillageDetails.taluk) return false;
      return taluk.villages?.some(
        (village) => village.name === selectedVillageDetails.name
      );
    });
    if (!stillPresent) {
      setSelectedVillageDetails(null);
    }
  }, [districtTalukInsight, selectedVillageDetails]);

  useEffect(() => {
    if (!selectedVillageDetails) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedVillageDetails(null);
      }
    };
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedVillageDetails]);

  // Refresh key triggers re-fetch for all dashboard widgets.
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshTick(Date.now());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const handleDistrictSelect = (event) => {
    const value = event.target.value;
    setSelectedDistrict(value);
    if (value === ALL_DISTRICTS_LABEL) {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/district/${slugify(value)}`);
    }
    setExpandedTaluk(null);
    setSelectedVillageDetails(null);
    setCustomTalukStartDate("");
    setCustomTalukEndDate("");
  };

  const districtFilter = useMemo(() => {
    if (selectedDistrict === ALL_DISTRICTS_LABEL) return undefined;
    return slugify(selectedDistrict);
  }, [selectedDistrict]);

  // Load all dashboard blocks in parallel so UI feels instant.
  useEffect(() => {
    let ignore = false;
    async function loadDashboardData() {
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const [summary, alerts, risk, sdg, oversight] = await Promise.all([
          fetchDashboardSummary({ district: districtFilter }),
          fetchOutbreakAlerts({ district: districtFilter }),
          fetchRapidRiskSnapshot({ district: districtFilter }),
          fetchSdgImpact({ district: districtFilter }),
          fetchOversightChecklist({ district: districtFilter }),
        ]);

        if (ignore) return;

        setStats(
          Array.isArray(summary?.stats)
            ? summary.stats.map((stat) => ({
                ...stat,
                iconKey: stat.iconKey || stat.icon || "migrants",
              }))
            : []
        );
        setOutbreakAlerts(Array.isArray(alerts?.alerts) ? alerts.alerts : []);
        setRapidRiskModel(Array.isArray(risk?.districts) ? risk.districts : []);
        setSdgMetrics(
          Array.isArray(sdg?.metrics)
            ? sdg.metrics.map((metric) => ({
                ...metric,
                icon:
                  sdgIconMap[metric.iconKey || metric.icon] ||
                  metric.icon ||
                  HeartPulse,
                accent: metric.accent || {
                  chip: "bg-slate-500",
                  bar: "bg-slate-400",
                },
              }))
            : []
        );
        setOversightChecks(
          Array.isArray(oversight?.checks) ? oversight.checks : []
        );
        setOversightSummary(
          oversight?.updatedAt
            ? {
                updatedAt: oversight.updatedAt,
                counts: oversight.counts || {},
              }
            : null
        );
      } catch (error) {
        if (!ignore) {
          setDashboardError(
            "Unable to sync dashboard data. Please try again soon."
          );
          console.error("Dashboard sync failed", error);
        }
      } finally {
        if (!ignore) setIsDashboardLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      ignore = true;
    };
  }, [districtFilter, refreshTick]);

  const severityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-orange-100 text-orange-800 border-orange-200",
    low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

  const getSeverityStyles = (level = "low") =>
    severityColors[level] || severityColors.low;

  const outbreakSnapshot = useMemo(() => {
    if (!outbreakAlerts.length) {
      return {
        counts: [],
        lastUpdated: "--",
      };
    }

    const buckets = {
      high: 0,
      medium: 0,
      low: 0,
    };

    outbreakAlerts.forEach((alert) => {
      const level = (alert.severity || "low").toLowerCase();
      if (typeof buckets[level] === "number") {
        buckets[level] += 1;
      }
    });

    const counts = [
      { key: "high", label: "High", count: buckets.high },
      { key: "medium", label: "Medium", count: buckets.medium },
      { key: "low", label: "Low", count: buckets.low },
    ];

    const lastUpdated = outbreakAlerts[0]?.date || "--";
    return { counts, lastUpdated };
  }, [outbreakAlerts]);

  const severitySummaryStyles = {
    high: "bg-red-50 border-red-100 text-red-700",
    medium: "bg-orange-50 border-orange-100 text-orange-700",
    low: "bg-yellow-50 border-yellow-100 text-yellow-700",
  };

  const severityChartPalette = {
    High: "#ef4444",
    Medium: "#fb923c",
    Low: "#facc15",
  };

  const oversightLastSync = useMemo(() => {
    if (!oversightSummary?.updatedAt) return null;
    const parsedDate = new Date(oversightSummary.updatedAt);
    if (Number.isNaN(parsedDate.getTime())) return null;
    return parsedDate.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, [oversightSummary]);

  const oversightStatusStyles = {
    healthy: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    action: "bg-red-100 text-red-800 border-red-200",
  };

  const alertHotspots = useMemo(() => {
    if (!outbreakAlerts.length) return [];
    const map = new Map();
    outbreakAlerts.forEach((alert) => {
      const key = alert.camp || "Unknown Location";
      const severity = (alert.severity || "low").toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          location: key,
          count: 0,
          highSeverity: 0,
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (severity === "high") entry.highSeverity += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [outbreakAlerts]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">Real-time surveillance and monitoring</p>
        {dashboardError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {dashboardError}
          </div>
        )}
        {isDashboardLoading && (
          <p className="mt-2 text-sm text-blue-600">Syncing live data...</p>
        )}
      </div>

      <div className="flex gap-4 mb-8">
        <select
          value={selectedDistrict}
          onChange={handleDistrictSelect}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            No live metrics for this district yet.
          </div>
        ) : (
          stats.map((stat, index) => {
            const Icon = statIconMap[stat.iconKey] || Users;
            const color = stat.color || "blue";
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${color}-100`}>
                    <Icon className={`text-${color}-600`} size={24} />
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                    <TrendingUp size={16} />
                    {stat.trend || "--"}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value ?? "0"}
                </h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            );
          })
        )}
      </div>
      {selectedVillageDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Patients in ${selectedVillageDetails.name}`}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-blue-500 tracking-wide">
                  Village patients
                </p>
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedVillageDetails.name} • {selectedVillageDetails.taluk}
                </h4>
                <p className="text-xs text-gray-500">
                  {selectedVillageDetails.patients?.length ?? 0} patient
                  {selectedVillageDetails.patients?.length === 1 ? "" : "s"} in
                  focus
                </p>
              </div>
              <button
                type="button"
                onClick={handleVillagePanelClose}
                className="text-sm font-semibold text-blue-700 hover:text-blue-900"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-3">
              {selectedVillageDetails.patients?.length ? (
                selectedVillageDetails.patients.map((patient) => (
                  <div
                    key={
                      patient.patientId || `${patient.name}-${patient.disease}`
                    }
                    className="border border-gray-100 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {patient.name}
                        </p>
                        <p className="text-xs uppercase text-gray-500">
                          Patient ID: {patient.patientId ?? "--"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          patient.contagious
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {patient.contagious ? "Contagious" : "Stable"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 font-semibold">
                      {patient.disease}
                    </p>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <p className="text-xs uppercase text-gray-500">
                          Doctor
                        </p>
                        <p>{patient.doctor || "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Camp</p>
                        <p>{patient.camp || "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">Taluk</p>
                        <p>{patient.taluk || "--"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-500">
                          Village
                        </p>
                        <p>{patient.village || "--"}</p>
                      </div>
                    </div>
                    {patient.notes && (
                      <p className="mt-3 text-xs text-gray-500">
                        Notes: {patient.notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No patient roster shared for this village yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* we are getting to know how many migrants are afftected in a district and it is upating hourly first this component present  in dashboard now we have commented no use. */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wide">

                  Rapid risk model
                </p>
                <h3 className="text-xl font-bold text-gray-900">
                  District readiness snapshot
                </h3>
              </div>
              <span className="text-xs text-gray-500">Updated hourly</span>
            </div>
            {rapidRiskModel.length === 0 ? (
              <p className="text-sm text-gray-500">No risk signals reported.</p>
            ) : (
              <div className="space-y-3">
                {rapidRiskModel.map((entry) => (
                  <div
                    key={entry.district}
                    className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.district}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.migrants} migrants tracked
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.risk === "Critical"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {entry.risk}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{entry.indicator}</span>
                      <span className="font-semibold text-green-600">
                        {entry.trend}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Response SLA: {entry.sla}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                Outbreak Alerts
              </h3>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
              {outbreakAlerts.length} Active
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {outbreakAlerts.length === 0 ? (
              <p className="text-sm text-gray-500">
                No active outbreak alerts for the selected view.
              </p>
            ) : (
              outbreakAlerts.map((alert) => (
                <div
                  key={alert.id || alert.alert}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {alert.alert}
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityStyles(
                        alert.severity
                      )}`}
                    >
                      {(alert.severity || "low").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.camp}</p>
                  <p className="text-xs text-gray-500">{alert.date}</p>
                </div>
              ))
            )}
          </div>
          {outbreakSnapshot.counts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {outbreakSnapshot.counts.map((bucket) => (
                    <div
                      key={bucket.key}
                      className={`rounded-lg border px-3 py-2 text-center ${
                        severitySummaryStyles[bucket.key] ||
                        severitySummaryStyles.low
                      }`}
                    >
                      <p className="text-xs uppercase font-semibold tracking-wide">
                        {bucket.label}
                      </p>
                      <p className="text-xl font-bold">{bucket.count}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Last alert logged: {outbreakSnapshot.lastUpdated}
                </p>
              </div>
              <div className="xl:col-span-2 h-44 bg-gray-50 border border-gray-100 rounded-lg p-3">
                <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                  Real-time escalation load
                </p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartBarChart
                      data={outbreakSnapshot.counts}
                      margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" stroke="#6b7280" />
                      <Tooltip
                        cursor={{ fill: "rgba(59,130,246,0.08)" }}
                        contentStyle={{ borderRadius: 8 }}
                        formatter={(value) => [`${value} alerts`, "Cases"]}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {outbreakSnapshot.counts.map((bucket) => (
                          <Cell
                            key={`cell-${bucket.key}`}
                            fill={
                              severityChartPalette[bucket.label] ||
                              severityChartPalette.Low
                            }
                          />
                        ))}
                      </Bar>
                    </RechartBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {alertHotspots.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">
                    Field command
                  </p>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Hotspots needing rapid support
                  </h4>
                </div>
                <span className="text-xs text-gray-500">Live feed</span>
              </div>
              <div className="space-y-3">
                {alertHotspots.map((spot) => (
                  <div
                    key={spot.location}
                    className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {spot.location}
                      </p>
                      <span className="text-sm font-semibold text-red-600">
                        {spot.count} alerts
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {spot.highSeverity > 0
                        ? `${spot.highSeverity} marked HIGH priority`
                        : "All moderate alerts"}
                    </p>
                    <div className="mt-3 h-2 bg-white rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          spot.highSeverity > 0 ? "bg-red-500" : "bg-amber-400"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (spot.highSeverity / spot.count || 0) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div> */}
      {/* from dises monitoring we picked dee dive within districts and top hotspost */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wide">
                    Taluk drill-down
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">
                    Deep dive within districts
                  </h3>
                </div>
                <select
                  value={canShowTalukDrilldown ? selectedDistrict : ""}
                  onChange={handleDistrictChange}
                  disabled={!districtInsights.length}
                  className={`px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    districtInsights.length
                      ? "border-gray-300"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {!canShowTalukDrilldown && (
                    <option value="" disabled>
                      Select district
                    </option>
                  )}
                  {districtInsights.map((district) => (
                    <option key={district.district} value={district.district}>
                      {district.district}
                    </option>
                  ))}
                  {!districtInsights.length && (
                    <option value="">No districts synced</option>
                  )}
                </select>
              </div>
              {canShowTalukDrilldown ? (
                <p className="text-sm text-gray-600">
                  {activeDistrictData?.totalCases ?? 0} active cases across{" "}
                  {activeDistrictData?.taluks?.length ?? 0} taluks in the last{" "}
                  {talukWindowConfig?.label ?? "selected"} window. Prioritize{" "}
                  {activeDistrictData?.taluks?.[0]?.name ?? "--"} for field
                  reinforcement.
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Select a district to inspect its taluk and village alerts.
                </p>
              )}
            </div>
            <div className="xl:w-64 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                Taluk window
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {talukWindowOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTalukWindowChange(option.value)}
                    disabled={!canShowTalukDrilldown}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      talukWindowKey === option.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200"
                    } ${
                      canShowTalukDrilldown
                        ? ""
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {talukWindowKey === "custom" && (
                <div className="space-y-3 text-xs text-gray-600 mb-4">
                  <div className="flex flex-col gap-1">
                    <label
                      className="font-semibold"
                      htmlFor="taluk-custom-start"
                    >
                      Start date
                    </label>
                    <input
                      id="taluk-custom-start"
                      type="date"
                      value={customTalukStartDate}
                      onChange={(event) =>
                        setCustomTalukStartDate(event.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold" htmlFor="taluk-custom-end">
                      End date
                    </label>
                    <input
                      id="taluk-custom-end"
                      type="date"
                      value={customTalukEndDate}
                      onChange={(event) =>
                        setCustomTalukEndDate(event.target.value)
                      }
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={customTalukStartDate || undefined}
                    />
                  </div>
                  {talukWindowError && (
                    <span className="text-red-600 text-xs">
                      {talukWindowError}
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs uppercase text-gray-500">Active view</p>
              <p className="text-sm font-semibold text-gray-900">
                {talukWindowConfig?.label ?? "Select a window"}
              </p>
              <p className="text-xs text-gray-500">
                {canShowTalukDrilldown
                  ? "Applies to taluk and village breakdowns"
                  : "Select a district to enable"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {!canShowTalukDrilldown ? (
              <p className="text-sm text-gray-500">
                Pick a district to view taluk drill-down.
              </p>
            ) : talukLoading ? (
              <p className="text-sm text-gray-500">
                Syncing latest taluk reports...
              </p>
            ) : (activeDistrictData?.taluks ?? []).length ? (
              activeDistrictData.taluks.map((taluk) => {
                const isExpanded = expandedTaluk === taluk.name;
                return (
                  <div
                    key={taluk.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleTalukToggle(taluk)}
                    onKeyDown={(event) => handleTalukKeyDown(event, taluk)}
                    className={`w-full text-left border border-gray-100 rounded-lg p-4 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isExpanded ? "bg-blue-50 border-blue-200" : "bg-white"
                    }`}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {taluk.name} Taluk
                        </p>
                        <p className="text-xs text-gray-500">
                          {taluk.villages.length} villages reporting •{" "}
                          {taluk.trend}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {taluk.cases} cases
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          {isExpanded ? "Hide" : "Expand"}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 bg-blue-600 rounded-full"
                        style={{
                          width: `${
                            (taluk.cases / (maxTalukCases || 1)) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      {isExpanded
                        ? "Village-level alerts visible"
                        : "Click to view village breakdown"}
                    </div>
                    {isExpanded && (
                      <div className="mt-4 border-t border-blue-100 pt-3 space-y-2">
                        {taluk.villages.map((village) => {
                          const severity = getVillageSeverity(village.cases);
                          return (
                            <div
                              key={village.name}
                              className="flex items-center justify-between gap-3"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {village.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {village.cases} cases
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${severity.badge}`}
                                >
                                  {severity.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleVillageSelect(taluk.name, village);
                                  }}
                                  disabled={!village.patients?.length}
                                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${
                                    village.patients?.length
                                      ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                                      : "border-gray-200 text-gray-400 cursor-not-allowed"
                                  }`}
                                >
                                  View patients
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                No taluk submissions for this window.
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Village level alerts
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                Top hotspots to inspect
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Across Kerala • {hotspotRangeConfig.label} window
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Window</span>
              {hotspotRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHotspotRangeKey(option.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    hotspotRangeKey === option.value
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="scroll-area space-y-3 max-h-72 overflow-y-auto pr-2 pb-2 flex-1">
            {highAlertVillages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No hotspots flagged by the latest submissions.
              </p>
            ) : (
              highAlertVillages.map((village) => {
                const severity = getVillageSeverity(village.cases);
                return (
                  <div
                    key={`${village.name}-${village.taluk}`}
                    className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {village.name}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${severity.badge}`}
                      >
                        {severity.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {village.cases} cases • {village.taluk} Taluk
                    </p>
                    <p className="text-xs text-gray-500">
                      {village.district} District
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm text-gray-600">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs uppercase text-gray-500">Total cases</p>
              <p className="text-xl font-semibold text-gray-900">
                {villageSummary.total}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs uppercase text-gray-500">Avg per hotspot</p>
              <p className="text-xl font-semibold text-gray-900">
                {villageSummary.average}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs uppercase text-gray-500">Peak cluster</p>
              <p className="text-sm font-semibold text-gray-900">
                {villageSummary.peakVillage}
              </p>
              <p className="text-xs text-gray-500">
                {villageSummary.topTaluk} Taluk
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs uppercase text-gray-500 tracking-wide mb-3">
              Immediate actions
            </p>
            {priorityActions.length ? (
              <ul className="space-y-3">
                {priorityActions.map((action) => (
                  <li key={action.title} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-red-500"></span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-500">{action.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No immediate escalations for this district.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Oversight assistant module intentionally hidden per latest brief */}
      {false && (
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Oversight assistant
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                Quick checks before the daily review
              </h3>
              <p className="text-sm text-gray-500">
                Flags data gaps so HQ can intervene immediately.
              </p>
            </div>
            {oversightLastSync && (
              <p className="text-xs text-gray-500">
                Synced {oversightLastSync}
              </p>
            )}
          </div>
          {oversightChecks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
              Oversight checklist not available for this filter yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {oversightChecks.map((check) => (
                <div
                  key={check.key}
                  className="border border-gray-100 rounded-lg p-4 bg-gray-50 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">
                      {check.label}
                    </p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        oversightStatusStyles[check.status] ||
                        oversightStatusStyles.healthy
                      }`}
                    >
                      {check.status === "healthy"
                        ? "ON TRACK"
                        : check.status === "warning"
                        ? "REVIEW"
                        : "ACTION"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{check.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <TrendCharts district={districtFilter} refreshKey={refreshTick} />
      </div>

      <div className="mt-8 bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200">
              SDG Impact Dashboard
            </p>
            <h3 className="text-2xl font-semibold">
              Government-aligned outcomes that matter
            </h3>
            <p className="text-sm text-blue-100">
              Every intervention is mapped to the UN Sustainable Development
              Goals to prove systemic value.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-semibold">
            <TrendingUp size={16} />
            Impact growing across Kerala
          </span>
        </div>

        {sdgMetrics.length === 0 ? (
          <p className="text-sm text-blue-100">
            No SDG impact entries available for this filter.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sdgMetrics.map((metric) => {
              const Icon =
                typeof metric.icon === "function" ? metric.icon : HeartPulse;
              return (
                <div
                  key={metric.goal}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-100">
                      {metric.goal}
                    </span>
                    <div
                      className={`p-2 rounded-lg ${metric.accent.chip} bg-opacity-90`}
                    >
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{metric.title}</p>
                    <p className="text-sm text-blue-100">{metric.indicator}</p>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">{metric.value}</span>
                    <span className="text-xs text-emerald-200">
                      {metric.delta}
                    </span>
                  </div>
                  <div>
                    <div className="w-full h-2 bg-white/20 rounded-full">
                      <div
                        className={`h-2 rounded-full ${metric.accent.bar}`}
                        style={{ width: `${metric.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-blue-100 mt-2">
                      <span>Progress</span>
                      <span>{metric.progress}% of target</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
