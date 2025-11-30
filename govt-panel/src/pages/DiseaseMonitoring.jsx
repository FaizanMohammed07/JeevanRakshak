import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
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
} from "recharts";

const timelineOptions = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "10 Days", value: "10d" },
  { label: "15 Days", value: "15d" },
  { label: "1 Month", value: "30d" },
];

const trendRangeOptions = [
  { label: "Today", value: 1 },
  { label: "5 Days", value: 5 },
  { label: "10 Days", value: 10 },
  { label: "15 Days", value: 15 },
  { label: "30 Days", value: 30 },
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
  const [hotspotRangeKey, setHotspotRangeKey] = useState(
    hotspotRangeOptions[0].value
  );
  const [activeCasesRangeKey, setActiveCasesRangeKey] = useState(
    activeCaseRangeOptions[0].value
  );
  const [districtCasesRangeKey, setDistrictCasesRangeKey] = useState(
    districtCasesRangeOptions[0].value
  );

  const resolvedDistrict = useMemo(() => {
    const fallbackDistrict = districtInsights[0]?.district ?? "";
    if (!districtId) return fallbackDistrict;
    return (
      districtInsights.find(
        (district) => slugify(district.district) === districtId
      )?.district ?? fallbackDistrict
    );
  }, [districtId, districtInsights]);

  const [selectedDistrict, setSelectedDistrict] = useState(resolvedDistrict);
  const [expandedTaluk, setExpandedTaluk] = useState(null);
  const [timelineRange, setTimelineRange] = useState(timelineOptions[0].value);
  const [trendRange, setTrendRange] = useState(trendRangeOptions[0].value);

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
        const response = await fetchDiseaseSummary({
          district: selectedDistrictSlug || undefined,
          rangeDays: trendRange,
          casesRangeDays: districtCasesRangeConfig.rangeDays,
          casesOffsetDays: districtCasesRangeConfig.offsetDays,
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
  ]);

  useEffect(() => {
    let ignore = false;
    async function loadActiveCases() {
      try {
        const response = await fetchActiveDiseaseCases({
          rangeDays: activeCasesRangeConfig.rangeDays,
          offsetDays: activeCasesRangeConfig.offsetDays,
        });
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

  const statusColors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    moderate: "bg-orange-100 text-orange-800 border-orange-300",
    stable: "bg-green-100 text-green-800 border-green-300",
  };

  const formatIssuedDate = (value) => {
    if (!value) return "—";
    try {
      return patientDateFormatter.format(new Date(value));
    } catch (error) {
      return "—";
    }
  };

  const getVillageSeverity = (cases) => {
    if (cases >= 10)
      return { badge: "bg-red-100 text-red-800", label: "Critical" };
    if (cases >= 6)
      return { badge: "bg-orange-100 text-orange-700", label: "Watch" };
    return { badge: "bg-green-100 text-green-700", label: "Stable" };
  };

  const handleDistrictChange = (event) => {
    const nextDistrict = event.target.value;
    if (!nextDistrict) return;
    setSelectedDistrict(nextDistrict);
    setExpandedTaluk(null);
    navigate(`/disease/district/${slugify(nextDistrict)}`);
  };

  const handleTalukToggle = (taluk) => {
    const isExpanded = expandedTaluk === taluk.name;
    const districtSlug = slugify(selectedDistrict);

    if (isExpanded) {
      setExpandedTaluk(null);
      navigate(`/disease/district/${districtSlug}`);
    } else {
      setExpandedTaluk(taluk.name);
      navigate(
        `/disease/district/${districtSlug}/taluk/${slugify(taluk.name)}`
      );
    }
  };

  const handleTalukKeyDown = (event, taluk) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleTalukToggle(taluk);
    }
  };

  const handleVillageSelect = (talukName, village) => {
    if (!village?.patients?.length) return;
    setSelectedVillage({
      ...village,
      taluk: talukName,
      district: selectedDistrict,
    });
  };

  const closeVillageModal = () => setSelectedVillage(null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Disease Monitoring
        </h2>
        <p className="text-gray-600">
          Track disease patterns and trends across camps
        </p>
        {dataSyncError && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {dataSyncError}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col h-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                District-wise Cases
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {districtCasesRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDistrictCasesRangeKey(option.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    districtCasesRangeKey === option.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {districtCases.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartBarChart
                  data={districtCases}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="district"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Legend />
                  {normalizedDiseaseKeys.map((entry, index) => (
                    <Bar
                      key={entry.key}
                      dataKey={entry.key}
                      name={entry.label}
                      fill={barPalette[index % barPalette.length]}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </RechartBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Waiting for district reports
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">Disease Trend</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendRangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTrendRange(option.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    trendRange === option.value
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            {trendData.length && normalizedTrendKeys.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis
                    dataKey="day"
                    stroke="#6b7280"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ borderRadius: 12 }} />
                  <Legend />
                  {normalizedTrendKeys.map((entry, index) => (
                    <Line
                      key={entry.key}
                      type="monotone"
                      dataKey={entry.key}
                      name={entry.label}
                      stroke={linePalette[index % linePalette.length]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Not enough data for selected range
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 xl:max-w-5xl">
        <KeralaHeatMap compact refreshKey={refreshTick} />
      </div>

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
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  disabled={!districtInsights.length}
                  className={`px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    districtInsights.length
                      ? "border-gray-300"
                      : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
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
              <p className="text-sm text-gray-600">
                {activeDistrictData?.totalCases ?? 0} active cases across{" "}
                {activeDistrictData?.taluks?.length ?? 0} taluks. Prioritize{" "}
                {activeDistrictData?.taluks?.[0]?.name ?? "--"} for field
                reinforcement.
              </p>
            </div>
            <div className="xl:w-64 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <p className="text-xs uppercase text-gray-500 tracking-wide mb-2">
                Trend horizon
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {timelineOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTimelineRange(option.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      timelineRange === option.value
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase text-gray-500">Case delta</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timelineStats.casesDelta}
                  </p>
                  <p className="text-xs text-gray-500">vs previous horizon</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">
                    Response time
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timelineStats.response}
                  </p>
                  <p className="text-xs text-gray-500">Average SLA adherence</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">
                    Camp coverage
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {timelineStats.coverage}
                  </p>
                  <p className="text-xs text-gray-500">Reports received</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {(activeDistrictData?.taluks ?? []).map((taluk) => {
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
                        width: `${(taluk.cases / (maxTalukCases || 1)) * 100}%`,
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
            })}
            {!activeDistrictData?.taluks?.length && (
              <p className="text-sm text-gray-500">No taluk submissions yet.</p>
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

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                Active Disease Cases
              </h3>
            </div>
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
          </div>
        </div>

        {latestAdmissions.length > 0 && (
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Latest admissions ({latestAdmissions.length} shown)
              </p>
              <span className="text-xs text-gray-500">
                {activeCasesRangeConfig.label} window
              </span>
            </div>
            <div className="space-y-2">
              {latestAdmissions.map((patient, index) => (
                <div
                  key={`${patient.name}-${patient.dateOfIssue ?? index}`}
                  className="flex flex-wrap items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {patient.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {patient.disease} • {patient.taluk}, {patient.village}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{patient.district}</p>
                    <p className="text-xs text-gray-400">
                      {formatIssuedDate(patient.dateOfIssue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  District
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Primary Disease
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  New Cases
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Total Cases
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Latest Patients
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    No active case alerts for the selected district in the{" "}
                    {activeCasesRangeConfig.label} window.
                  </td>
                </tr>
              ) : (
                cases.map((row, index) => (
                  <tr key={index} className="align-top hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {row.district}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="font-semibold">{row.topDisease}</p>
                      <p className="text-xs text-gray-500">
                        {row.topDiseaseCount ?? 0} total cases
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        +{row.newCases}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {row.totalCases}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {row.recentPatients?.length ? (
                        <div className="space-y-2">
                          {row.recentPatients.map((patient, patientIndex) => (
                            <div key={`${patient.name}-${patientIndex}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-gray-900">
                                  {patient.name}
                                </span>
                                <span className="text-gray-400">
                                  {formatIssuedDate(patient.dateOfIssue)}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500">
                                {patient.disease} • {patient.taluk},{" "}
                                {patient.village}
                                {patient.contagious ? " • Contagious" : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">
                          No recent admissions
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                          statusColors[row.status] ?? statusColors.stable
                        }`}
                      >
                        {(row.status || "stable").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
                {selectedVillage.patients.length} recent case
                {selectedVillage.patients.length === 1 ? "" : "s"} submitted by
                field teams. Details auto-refresh every 30 seconds.
              </p>
              <div className="space-y-3">
                {selectedVillage.patients.map((patient, index) => (
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
                        “{patient.notes}”
                      </p>
                    )}
                    {patient.contagious && (
                      <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Contagious case
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiseaseMonitoring;
