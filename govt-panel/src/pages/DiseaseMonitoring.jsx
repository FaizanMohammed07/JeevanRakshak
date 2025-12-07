import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart3, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { slugify } from "../utils/slugify";
import KeralaHeatMap from "./KeralaHeatMap";
import {
  fetchDiseaseDistricts,
  fetchDiseaseSummary,
  fetchActiveDiseaseCases,
  fetchTimelineStats,
} from "../api/disease";
import {
  ResponsiveContainer,
  BarChart as RechartBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

const timelineOptions = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "10 Days", value: "10d" },
  { label: "15 Days", value: "15d" },
  { label: "1 Month", value: "30d" },
];

const trendRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "5 Days", value: "5d", rangeDays: 5, offsetDays: 0 },
  { label: "10 Days", value: "10d", rangeDays: 10, offsetDays: 0 },
  { label: "15 Days", value: "15d", rangeDays: 15, offsetDays: 0 },
  { label: "30 Days", value: "30d", rangeDays: 30, offsetDays: 0 },
];

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

const initialTimelineStats = {
  casesDelta: "--",
  response: "--",
  coverage: "--",
};

const barPalette = ["#ef4444", "#f97316", "#0ea5e9", "#6366f1", "#10b981"];
const linePalette = ["#059669", "#10b981", "#14b8a6", "#0ea5e9", "#6366f1"];
const REFRESH_INTERVAL_MS = 30_000;

const patientDateFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
});

const formatTrendSeriesLabel = (value = "") => {
  const staged = value
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  if (!staged) return "Disease";
  return staged
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const deriveTrendKeysFromData = (data = []) => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const totals = new Map();
  data.forEach((row) => {
    Object.entries(row ?? {}).forEach(([key, value]) => {
      if (key === "day" || typeof value !== "number") return;
      totals.set(key, (totals.get(key) ?? 0) + value);
    });
  });
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);
};

function DiseaseMonitoring() {
  const navigate = useNavigate();
  const { districtId, talukId } = useParams();

  // State management
  const [districtInsights, setDistrictInsights] = useState([]);
  const [districtCases, setDistrictCases] = useState([]);
  const [diseaseKeys, setDiseaseKeys] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [trendKeys, setTrendKeys] = useState([]);
  const [cases, setCases] = useState([]);
  const [latestAdmissions, setLatestAdmissions] = useState([]);
  const [hotspotInsights, setHotspotInsights] = useState([]);
  const [timelineStats, setTimelineStats] = useState(initialTimelineStats);
  const [dataSyncError, setDataSyncError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(Date.now());
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Range selections
  const [hotspotRangeKey, setHotspotRangeKey] = useState(
    hotspotRangeOptions[0].value
  );
  const [activeCasesRangeKey, setActiveCasesRangeKey] = useState(
    activeCaseRangeOptions[0].value
  );
  const [districtCasesRangeKey, setDistrictCasesRangeKey] = useState(
    districtCasesRangeOptions[0].value
  );
  const [timelineRange, setTimelineRange] = useState(timelineOptions[0].value);
  const [trendRange, setTrendRange] = useState(trendRangeOptions[0].value);

  // UI state
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [expandedTaluk, setExpandedTaluk] = useState(null);

  const trendRangeConfig = useMemo(
    () =>
      trendRangeOptions.find((option) => option.value === trendRange) ??
      trendRangeOptions[0],
    [trendRange]
  );

  const customRangeActive = Boolean(customStartDate && customEndDate);

  // Computed values
  const todayLabel = useMemo(() => patientDateFormatter.format(new Date()), []);
  const totalDistrictCount = districtInsights.length;

  const resolvedDistrict = useMemo(() => {
    const fallbackDistrict = districtInsights[0]?.district ?? "";
    if (!districtId) return fallbackDistrict;
    return (
      districtInsights.find(
        (district) => slugify(district.district) === districtId
      )?.district ?? fallbackDistrict
    );
  }, [districtId, districtInsights]);

  const activeDistrictData = useMemo(
    () => districtInsights.find((entry) => entry.district === selectedDistrict),
    [districtInsights, selectedDistrict]
  );

  const maxTalukCases = useMemo(() => {
    if (!activeDistrictData || !activeDistrictData.taluks?.length) return 0;
    return Math.max(...activeDistrictData.taluks.map((taluk) => taluk.cases));
  }, [activeDistrictData]);

  const normalizedDiseaseKeys = useMemo(
    () =>
      diseaseKeys.map((entry) =>
        typeof entry === "string" ? { key: entry, label: entry } : entry
      ),
    [diseaseKeys]
  );

  const normalizedTrendKeys = useMemo(() => {
    const sourceKeys = trendKeys.length
      ? trendKeys
      : deriveTrendKeysFromData(trendData);
    return sourceKeys
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") {
          return { key: entry, label: formatTrendSeriesLabel(entry) };
        }
        if (entry.key) {
          return {
            key: entry.key,
            label: entry.label ?? formatTrendSeriesLabel(entry.key),
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [trendKeys, trendData]);

  const chartDiseaseKeys = useMemo(() => {
    if (normalizedDiseaseKeys.length) return normalizedDiseaseKeys;
    return [{ key: "totalCases", label: "Total Cases" }];
  }, [normalizedDiseaseKeys]);

  const horizontalChartData = useMemo(() => {
    return [...districtCases]
      .map((entry) => ({ ...entry }))
      .sort((a, b) => (b.totalCases ?? 0) - (a.totalCases ?? 0));
  }, [districtCases]);

  const horizontalChartSummary = useMemo(() => {
    if (!horizontalChartData.length) {
      return {
        totalCases: 0,
        highestDistrict: "—",
        highestCases: 0,
      };
    }
    const totalCases = horizontalChartData.reduce(
      (sum, entry) => sum + (entry.totalCases ?? 0),
      0
    );
    const topDistrict = horizontalChartData[0];
    return {
      totalCases,
      highestDistrict: topDistrict?.district ?? "—",
      highestCases: topDistrict?.totalCases ?? 0,
    };
  }, [horizontalChartData]);

  const hotspotRangeConfig = useMemo(
    () =>
      hotspotRangeOptions.find((option) => option.value === hotspotRangeKey) ??
      hotspotRangeOptions[0],
    [hotspotRangeKey]
  );

  const activeCasesRangeConfig = useMemo(
    () =>
      activeCaseRangeOptions.find(
        (option) => option.value === activeCasesRangeKey
      ) ?? activeCaseRangeOptions[0],
    [activeCasesRangeKey]
  );

  const districtCasesRangeConfig = useMemo(
    () =>
      districtCasesRangeOptions.find(
        (option) => option.value === districtCasesRangeKey
      ) ?? districtCasesRangeOptions[0],
    [districtCasesRangeKey]
  );

  const selectedDistrictSlug = useMemo(() => {
    if (selectedDistrict) return slugify(selectedDistrict);
    if (districtId) return districtId;
    return "";
  }, [districtId, selectedDistrict]);

  const activeCasesSummary = useMemo(() => {
    if (!cases.length) {
      return {
        totalDistricts: 0,
        totalCases: 0,
        highestDistrict: "--",
        highestCases: 0,
        coverageRate: 0,
      };
    }
    const totalCases = cases.reduce(
      (sum, entry) => sum + (entry.totalCases ?? 0),
      0
    );
    const highestEntry = cases.reduce((prev, entry) => {
      const currentTotal = entry.totalCases ?? 0;
      const prevTotal = prev.totalCases ?? 0;
      return currentTotal > prevTotal ? entry : prev;
    }, cases[0]);
    const coverageRate = totalDistrictCount
      ? Math.min(100, Math.round((cases.length / totalDistrictCount) * 100))
      : 100;
    return {
      totalDistricts: cases.length,
      totalCases,
      highestDistrict: highestEntry?.district ?? "--",
      highestCases: highestEntry?.totalCases ?? 0,
      coverageRate,
    };
  }, [cases, totalDistrictCount]);

  // Helper functions
  const formatIssuedDate = (value) => {
    if (!value) return "—";
    try {
      return patientDateFormatter.format(new Date(value));
    } catch (error) {
      return "—";
    }
  };

  const formatShortDate = (value) => {
    if (!value) return "—";
    try {
      return patientDateFormatter.format(new Date(value));
    } catch {
      return "—";
    }
  };

  const formatNumber = (value) =>
    typeof value === "number" ? value.toLocaleString("en-IN") : value;

  const getSeverityColor = (caseCount = 0) => {
    if (caseCount >= 6) return "#ef4444";
    if (caseCount >= 3) return "#fbbf24";
    return "#22c55e";
  };

  const getDistrictCaseSeverity = (caseCount = 0) => {
    if (caseCount > 6) {
      return {
        label: "Critical",
        badge: "bg-red-100 text-red-800 border border-red-200",
      };
    }
    if (caseCount >= 3) {
      return {
        label: "Moderate",
        badge: "bg-orange-100 text-orange-800 border border-orange-200",
      };
    }
    if (caseCount >= 1) {
      return {
        label: "Normal",
        badge: "bg-green-100 text-green-800 border border-green-200",
      };
    }
    return {
      label: "Calm",
      badge: "bg-gray-100 text-gray-600 border border-gray-200",
    };
  };

  const getUrgencyLevel = (totalCases = 0, lastUpdated) => {
    const daysSinceUpdate = lastUpdated
      ? Math.floor((Date.now() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24))
      : 0;

    if (totalCases > 10 || daysSinceUpdate > 3) {
      return { level: "High", color: "text-red-600", icon: "🔴" };
    }
    if (totalCases > 5 || daysSinceUpdate > 1) {
      return { level: "Medium", color: "text-orange-600", icon: "🟡" };
    }
    return { level: "Low", color: "text-green-600", icon: "🟢" };
  };

  const getTrendIndicator = (current = 0, previous = 0) => {
    if (current > previous) {
      const increase = ((current - previous) / (previous || 1)) * 100;
      return {
        direction: "up",
        percentage: increase.toFixed(1),
        color: "text-red-600",
        icon: "↗️",
      };
    } else if (current < previous) {
      const decrease = ((previous - current) / (previous || 1)) * 100;
      return {
        direction: "down",
        percentage: decrease.toFixed(1),
        color: "text-green-600",
        icon: "↘️",
      };
    }
    return {
      direction: "stable",
      percentage: "0.0",
      color: "text-gray-600",
      icon: "➡️",
    };
  };

  const getStatusFromCases = (caseCount) => {
    if (caseCount >= 6) {
      return "Critical";
    } else if (caseCount >= 3) {
      return "Moderate";
    }
    return "Normal";
  };

  const renderDistrictTooltip = ({ active, label, payload }) => {
    if (!active || !payload?.length) return null;
    const rowData = payload[0]?.payload ?? {};
    const totalCases =
      rowData.totalCases ??
      rowData.total ??
      payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
    const severityLabel = getStatusFromCases(totalCases);
    const severityColor = getSeverityColor(totalCases);
    const diseaseBreakdown = payload
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value);
    return (
      <div className="bg-white/95 rounded-xl shadow-lg p-3 text-xs text-gray-700 border border-gray-100 w-64">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
          {label}
        </p>
        <div className="flex items-center justify-between mb-2">
          <span
            className="inline-flex items-center gap-2 text-[11px] uppercase font-semibold"
            style={{ color: severityColor }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: severityColor }}
            />
            Severity: {severityLabel}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatShortDate(rowData.lastUpdated)}
          </span>
        </div>
        {diseaseBreakdown.length ? (
          diseaseBreakdown.map((entry) => (
            <div
              key={`${entry.dataKey}-${entry.name}`}
              className="flex items-center justify-between mb-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: entry.fill }}
                />
                <span className="font-medium text-[12px] text-gray-800">
                  {entry.name}
                </span>
              </div>
              <span className="font-semibold text-gray-900">
                {formatNumber(entry.value)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">
            Awaiting latest response from the server
          </p>
        )}
        <div className="border-t border-dashed border-gray-200 mt-2 pt-2 text-[11px] text-gray-500 space-y-0.5">
          <p>
            Total cases:{" "}
            <span className="font-semibold text-gray-900">
              {formatNumber(totalCases)}
            </span>
          </p>
          {rowData.topDisease && (
            <p>
              Top disease:{" "}
              <span className="font-semibold text-gray-900">
                {rowData.topDisease}
              </span>
            </p>
          )}
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Sorted by highest contributor
        </p>
      </div>
    );
  };

  const handleDistrictChange = (event) => {
    const nextDistrict = event.target.value;
    if (!nextDistrict) return;
    setSelectedDistrict(nextDistrict);
    setExpandedTaluk(null);
    navigate(`/disease/district/${slugify(nextDistrict)}`);
  };

  const closeVillageModal = () => {
    setSelectedVillage(null);
  };

  // Effects
  useEffect(() => {
    if (resolvedDistrict) {
      setSelectedDistrict(resolvedDistrict);
    }
  }, [resolvedDistrict]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick(Date.now());
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!resolvedDistrict) return;
    if (!districtId) {
      navigate(`/disease/district/${slugify(resolvedDistrict)}`, {
        replace: true,
      });
    }
  }, [districtId, navigate, resolvedDistrict]);

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

  // Data fetching effects
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

  useEffect(() => {
    let ignore = false;
    async function loadDiseaseSummary() {
      try {
        const baseParams = {
          district: selectedDistrictSlug || undefined,
          casesRangeDays: districtCasesRangeConfig.rangeDays,
          casesOffsetDays: districtCasesRangeConfig.offsetDays,
        };
        const rangeParams = customRangeActive
          ? {
              startDate: customStartDate,
              endDate: customEndDate,
            }
          : {
              rangeDays: trendRangeConfig.rangeDays,
              offsetDays: trendRangeConfig.offsetDays,
            };
        const response = await fetchDiseaseSummary({
          ...baseParams,
          ...rangeParams,
        });
        if (ignore || !response) return;
        setDistrictCases(
          Array.isArray(response.districtCases) ? response.districtCases : []
        );
        setDiseaseKeys(
          Array.isArray(response.diseaseKeys) ? response.diseaseKeys : []
        );
        setTrendData(
          Array.isArray(response.trendData) ? response.trendData : []
        );
        setTrendKeys(
          Array.isArray(response.trendKeys) ? response.trendKeys : []
        );
      } catch (error) {
        console.error("Failed to fetch disease summary", error);
        setDataSyncError((prev) => prev ?? "Unable to sync disease charts.");
      }
    }
    loadDiseaseSummary();
    return () => {
      ignore = true;
    };
  }, [
    selectedDistrictSlug,
    trendRange,
    refreshTick,
    districtCasesRangeConfig.rangeDays,
    districtCasesRangeConfig.offsetDays,
    customStartDate,
    customEndDate,
  ]);

  useEffect(() => {
    let ignore = false;
    async function loadActiveCases() {
      try {
        const activeParams = {
          rangeDays: activeCasesRangeConfig.rangeDays,
          offsetDays: activeCasesRangeConfig.offsetDays,
        };
        if (customRangeActive) {
          activeParams.startDate = customStartDate;
          activeParams.endDate = customEndDate;
        }
        const response = await fetchActiveDiseaseCases(activeParams);
        if (ignore || !response) return;
        setCases(Array.isArray(response.cases) ? response.cases : []);
        setLatestAdmissions(
          Array.isArray(response.latestAdmissions)
            ? response.latestAdmissions
            : []
        );
      } catch (error) {
        console.error("Failed to fetch active disease cases", error);
        setDataSyncError((prev) => prev ?? "Unable to sync active case table.");
      }
    }
    loadActiveCases();
    return () => {
      ignore = true;
    };
  }, [
    activeCasesRangeConfig.rangeDays,
    activeCasesRangeConfig.offsetDays,
    refreshTick,
    customStartDate,
    customEndDate,
  ]);

  useEffect(() => {
    if (!selectedDistrict) return;
    let ignore = false;
    async function loadTimelineStats() {
      try {
        const response = await fetchTimelineStats({
          district: slugify(selectedDistrict),
          range: timelineRange,
        });
        if (ignore || !response) return;
        setTimelineStats({
          casesDelta: response.casesDelta ?? initialTimelineStats.casesDelta,
          response: response.response ?? initialTimelineStats.response,
          coverage: response.coverage ?? initialTimelineStats.coverage,
        });
      } catch (error) {
        console.error("Failed to fetch timeline stats", error);
        setDataSyncError((prev) => prev ?? "Unable to sync timeline stats.");
      }
    }
    loadTimelineStats();
    return () => {
      ignore = true;
    };
  }, [selectedDistrict, timelineRange, refreshTick]);

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50">
      {dataSyncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            <p className="text-sm text-red-800">
              Data sync issue: {dataSyncError}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8 mb-12">
        {/* District-wise Cases Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow">
                <BarChart3 className="text-white" size={26} />
              </div>
              <div>
                <h3 className="text-3xl font-semibold text-gray-900 mb-0">
                  District-wise Cases
                </h3>
                <p className="text-sm text-gray-500">
                  Horizontal overview with disease contributions ranked by
                  impact.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-wrap gap-3">
                {districtCasesRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDistrictCasesRangeKey(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 transition ${
                      districtCasesRangeKey === option.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 hover:border-blue-500 hover:text-blue-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 mt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  District Hits
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  District impact view
                </h3>
              </div>
              <div className="flex flex-wrap gap-3 text-slate-700 w-full sm:w-auto">
                <div className="bg-slate-50 rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    Total hits
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatNumber(horizontalChartSummary.totalCases)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">
                    Top district
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {horizontalChartSummary.highestDistrict}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatNumber(horizontalChartSummary.highestCases)} cases
                  </span>
                </div>
              </div>
            </div>
            <div className="relative mt-6 h-[460px] rounded-xl bg-gradient-to-b from-white to-slate-50 border border-gray-100 shadow-inner">
              {horizontalChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartBarChart
                    data={horizontalChartData}
                    margin={{ top: 24, right: 30, left: 24, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="barFade" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#0f172a"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="90%"
                          stopColor="#0f172a"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e0f2fe"
                      horizontal
                    />
                    <XAxis
                      type="category"
                      dataKey="district"
                      stroke="#0f172a"
                      tick={{ fontSize: 11, fontWeight: 600 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      type="number"
                      stroke="#0f172a"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.04)" }}
                      content={renderDistrictTooltip}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-sm font-semibold text-slate-600">
                          {value}
                        </span>
                      )}
                      wrapperStyle={{ top: 6, right: 12 }}
                    />
                    {chartDiseaseKeys.map((entry, index) => (
                      <Bar
                        key={entry.key}
                        dataKey={entry.key}
                        name={entry.label}
                        fill={barPalette[index % barPalette.length]}
                        radius={[4, 4, 0, 0]}
                        stroke={barPalette[index % barPalette.length]}
                        strokeWidth={1}
                        stackId="disease-stack"
                        barSize={30}
                        animationDuration={600}
                      />
                    ))}
                  </RechartBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-base font-semibold">
                    Awaiting district data
                  </p>
                  <p className="text-xs text-slate-400 text-center px-4">
                    Data will appear once the server delivers the latest
                    breakdowns.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disease Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg shadow">
                  <TrendingUp className="text-white" size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Disease Trend
                  </h3>
                  <p className="text-sm text-gray-500">
                    Progression across the selected window
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                {trendRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTrendRange(option.value)}
                    className={`px-3 py-1.5 rounded-md font-semibold border ${
                      trendRange === option.value
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {customRangeActive ? "Custom window" : trendRangeConfig.label}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomRangeOpen((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                    customRangeOpen
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
                  }`}
                >
                  {customRangeOpen ? "Hide range" : "Custom range"}
                </button>
                {customRangeOpen && (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <label className="flex flex-col text-gray-600">
                      Start
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(event) =>
                          setCustomStartDate(event.target.value)
                        }
                        className="mt-1 h-8 w-32 rounded-lg border border-gray-300 px-2 text-xs focus:border-emerald-400 focus:ring-0"
                      />
                    </label>
                    <label className="flex flex-col text-gray-600">
                      End
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(event) =>
                          setCustomEndDate(event.target.value)
                        }
                        className="mt-1 h-8 w-32 rounded-lg border border-gray-300 px-2 text-xs focus:border-emerald-400 focus:ring-0"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            {customRangeActive && (
              <p className="text-[12px] text-gray-500">
                Viewing custom snapshot from {formatShortDate(customStartDate)}{" "}
                to {formatShortDate(customEndDate)}
              </p>
            )}
          </div>
          <div className="h-[420px] bg-gray-50 rounded-xl shadow-inner p-4 border border-gray-100">
            {trendData.length && normalizedTrendKeys.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis
                    dataKey="day"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                    tickMargin={6}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      backgroundColor: "rgba(255,255,255,0.95)",
                    }}
                    labelStyle={{ fontWeight: "bold", color: "#1f2937" }}
                  />
                  <Legend />
                  {normalizedTrendKeys.map((entry, index) => (
                    <Line
                      key={entry.key}
                      type="monotone"
                      dataKey={entry.key}
                      name={entry.label}
                      stroke={linePalette[index % linePalette.length]}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    Not enough data for selected range
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try selecting a different time period
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="mb-12">
        <KeralaHeatMap refreshKey={refreshTick} />
      </div>

      {/* Active Disease Cases Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                Active Disease Cases
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Window</span>
                {activeCaseRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveCasesRangeKey(option.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                      activeCasesRangeKey === option.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-gray-400">
                As of {todayLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Active districts
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {activeCasesSummary.totalDistricts}
              </p>
              <p className="text-xs text-gray-500">
                {activeCasesSummary.coverageRate}% of synced districts
              </p>
            </div>
            <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total active cases
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {activeCasesSummary.totalCases}
              </p>
              <p className="text-xs text-gray-500">Auto-refresh every 30s</p>
            </div>
            <div className="rounded-2xl bg-white/80 border border-gray-100 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Peak district load
              </p>
              <p className="text-xl font-bold text-gray-900">
                {activeCasesSummary.highestDistrict}
              </p>
              <p className="text-xs text-gray-500">
                {activeCasesSummary.highestCases} total cases
              </p>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Primary Disease
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Total Cases
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Activity className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="font-medium">No Active Cases</p>
                        <p className="text-xs">
                          No active case alerts for the selected district in the{" "}
                          {activeCasesRangeConfig.label} window.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cases.map((row, index) => {
                    const status = getStatusFromCases(row.totalCases ?? 0);

                    return (
                      <tr
                        key={row.district || index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* District */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-semibold text-gray-900">
                              {row.district || "Unknown District"}
                            </div>
                          </div>
                        </td>

                        {/* Primary Disease */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            <p className="font-semibold">
                              {row.topDisease || "Not specified"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {row.topDiseaseCount ?? 0} cases
                            </p>
                            {row.secondaryDiseases &&
                              row.secondaryDiseases.length > 0 && (
                                <p className="text-xs text-blue-600 mt-1">
                                  +{row.secondaryDiseases.length} other diseases
                                </p>
                              )}
                          </div>
                        </td>

                        {/* Total Cases */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-gray-900">
                            {row.totalCases ?? "—"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                status === "Critical"
                                  ? "bg-red-100 text-red-800"
                                  : status === "Moderate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : status === "Normal"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {status}
                            </span>
                            {row.activeCamps && (
                              <p className="text-xs text-gray-500 mt-1">
                                {row.activeCamps} active camps
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Last Updated */}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.lastUpdated ? (
                            <div>
                              <p>{formatIssuedDate(row.lastUpdated)}</p>
                              <p className="text-xs text-gray-500">
                                {Math.floor(
                                  (Date.now() - new Date(row.lastUpdated)) /
                                    (1000 * 60 * 60)
                                )}
                                h ago
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p>{formatIssuedDate(new Date())}</p>
                              <p className="text-xs text-gray-500">Today</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Village Modal */}
      {selectedVillage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wide">
                  {selectedVillage.district} • {selectedVillage.taluk}
                </p>
                <h4 className="text-xl font-bold text-gray-900">
                  {selectedVillage.name} village patients
                </h4>
              </div>
              <button
                type="button"
                onClick={closeVillageModal}
                className="text-sm font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                {selectedVillage.patients?.length || 0} recent case
                {selectedVillage.patients?.length === 1 ? "" : "s"} submitted by
                field teams.
              </p>
              <div className="space-y-3">
                {selectedVillage.patients?.map((patient, index) => (
                  <div
                    key={`${patient.patientId ?? patient.name}-${index}`}
                    className="border border-gray-100 rounded-xl p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {patient.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {patient.disease} • {patient.camp}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatIssuedDate(patient.dateOfIssue)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Doctor: {patient.doctor}
                    </p>
                    {patient.notes && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        "{patient.notes}"
                      </p>
                    )}
                    {patient.contagious && (
                      <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Contagious case
                      </span>
                    )}
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">
                    No patient data available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiseaseMonitoring;
