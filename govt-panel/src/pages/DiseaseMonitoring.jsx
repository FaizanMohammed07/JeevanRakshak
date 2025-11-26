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

const FALLBACK_DISTRICT_INSIGHTS = [
  {
    district: "Ernakulam",
    totalCases: 58,
    taluks: [
      {
        name: "Kochi",
        cases: 32,
        trend: "+4 this week",
        villages: [
          { name: "Kumbalangi", cases: 11 },
          { name: "Elamkunnapuzha", cases: 9 },
          { name: "Cheranalloor", cases: 6 },
        ],
      },
      {
        name: "Paravur",
        cases: 16,
        trend: "+1",
        villages: [
          { name: "Puthenvelikkara", cases: 7 },
          { name: "Chendamangalam", cases: 5 },
        ],
      },
      {
        name: "Muvattupuzha",
        cases: 10,
        trend: "Stable",
        villages: [
          { name: "Paipra", cases: 4 },
          { name: "Marady", cases: 3 },
        ],
      },
    ],
  },
  {
    district: "Thrissur",
    totalCases: 52,
    taluks: [
      {
        name: "Chalakudy",
        cases: 22,
        trend: "+3",
        villages: [
          { name: "Athirapilly", cases: 8 },
          { name: "Mala", cases: 6 },
        ],
      },
      {
        name: "Thrissur",
        cases: 18,
        trend: "+2",
        villages: [
          { name: "Velur", cases: 7 },
          { name: "Cherpu", cases: 5 },
        ],
      },
      {
        name: "Kodungallur",
        cases: 12,
        trend: "Stable",
        villages: [
          { name: "Mathilakam", cases: 5 },
          { name: "Eriyad", cases: 4 },
        ],
      },
    ],
  },
  {
    district: "Kozhikode",
    totalCases: 44,
    taluks: [
      {
        name: "Kozhikode",
        cases: 19,
        trend: "+1",
        villages: [
          { name: "Beypore", cases: 8 },
          { name: "Chevayur", cases: 5 },
        ],
      },
      {
        name: "Vadakara",
        cases: 15,
        trend: "Stable",
        villages: [
          { name: "Onchiyam", cases: 6 },
          { name: "Madappally", cases: 4 },
        ],
      },
      {
        name: "Koyilandy",
        cases: 10,
        trend: "-1",
        villages: [
          { name: "Poonoor", cases: 4 },
          { name: "Atholi", cases: 3 },
        ],
      },
    ],
  },
];
const FALLBACK_DISTRICT_CASES = [
  { district: "Ernakulam", dengue: 45, malaria: 12, typhoid: 8 },
  { district: "Thiruvananthapuram", dengue: 18, malaria: 28, typhoid: 6 },
  { district: "Kozhikode", dengue: 22, malaria: 10, typhoid: 15 },
  { district: "Thrissur", dengue: 30, malaria: 14, typhoid: 9 },
  { district: "Kollam", dengue: 16, malaria: 9, typhoid: 11 },
  { district: "Palakkad", dengue: 12, malaria: 6, typhoid: 7 },
];

const FALLBACK_TREND_DATA = [
  { day: "Day 1", dengue: 38, malaria: 22 },
  { day: "Day 5", dengue: 42, malaria: 25 },
  { day: "Day 10", dengue: 36, malaria: 21 },
  { day: "Day 15", dengue: 33, malaria: 19 },
  { day: "Day 20", dengue: 29, malaria: 17 },
  { day: "Day 25", dengue: 26, malaria: 15 },
  { day: "Today", dengue: 24, malaria: 14 },
];

const FALLBACK_ACTIVE_CASES = [
  {
    camp: "Kochi Construction Camp 3",
    disease: "Dengue",
    newCases: 12,
    totalCases: 45,
    status: "critical",
  },
  {
    camp: "Trivandrum Labor Camp 12",
    disease: "Malaria",
    newCases: 8,
    totalCases: 28,
    status: "moderate",
  },
  {
    camp: "Kozhikode Camp Site A",
    disease: "Typhoid",
    newCases: 3,
    totalCases: 15,
    status: "stable",
  },
  {
    camp: "Thrissur Industrial Camp",
    disease: "Respiratory Infection",
    newCases: 15,
    totalCases: 52,
    status: "critical",
  },
];

const FALLBACK_TIMELINE_STATS = {
  casesDelta: "+12",
  response: "3h 20m",
  coverage: "92%",
};

const timelineOptions = [
  { label: "1 Day", value: "1d" },
  { label: "7 Days", value: "7d" },
  { label: "1 Month", value: "30d" },
];

function DiseaseMonitoring() {
  const navigate = useNavigate();
  const { districtId, talukId } = useParams();
  const [districtInsights, setDistrictInsights] = useState(
    FALLBACK_DISTRICT_INSIGHTS
  );
  const [districtCases, setDistrictCases] = useState(FALLBACK_DISTRICT_CASES);
  const [trendData, setTrendData] = useState(FALLBACK_TREND_DATA);
  const [cases, setCases] = useState(FALLBACK_ACTIVE_CASES);
  const [timelineStats, setTimelineStats] = useState(FALLBACK_TIMELINE_STATS);
  const [dataSyncError, setDataSyncError] = useState(null);

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

  useEffect(() => {
    if (resolvedDistrict) {
      setSelectedDistrict(resolvedDistrict);
    }
  }, [resolvedDistrict]);

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
    if (!activeDistrictData) return 0;
    return Math.max(...activeDistrictData.taluks.map((taluk) => taluk.cases));
  }, [activeDistrictData]);

  useEffect(() => {
    if (!talukId) {
      setExpandedTaluk(null);
      return;
    }

    const match = activeDistrictData?.taluks.find(
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
          (prev) =>
            prev ?? "Unable to sync district drill-down. Showing cached view."
        );
      }
    }
    loadDistrictInsights();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDistrict) return;
    let ignore = false;
    async function loadDiseaseSummary() {
      try {
        const response = await fetchDiseaseSummary({
          district: slugify(selectedDistrict),
        });
        if (ignore || !response) return;
        if (
          Array.isArray(response.districtCases) &&
          response.districtCases.length
        ) {
          setDistrictCases(response.districtCases);
        }
        if (Array.isArray(response.trendData) && response.trendData.length) {
          setTrendData(response.trendData);
        }
      } catch (error) {
        console.error("Failed to fetch disease summary", error);
        setDataSyncError(
          (prev) =>
            prev ?? "Unable to sync disease charts. Showing cached data."
        );
      }
    }
    loadDiseaseSummary();
    return () => {
      ignore = true;
    };
  }, [selectedDistrict]);

  useEffect(() => {
    if (!selectedDistrict) return;
    let ignore = false;
    async function loadActiveCases() {
      try {
        const response = await fetchActiveDiseaseCases({
          district: slugify(selectedDistrict),
        });
        if (ignore || !Array.isArray(response?.cases)) return;
        setCases(response.cases);
      } catch (error) {
        console.error("Failed to fetch active disease cases", error);
        setDataSyncError(
          (prev) =>
            prev ?? "Unable to sync active case table. Showing cached data."
        );
      }
    }
    loadActiveCases();
    return () => {
      ignore = true;
    };
  }, [selectedDistrict]);

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
          casesDelta: response.casesDelta ?? FALLBACK_TIMELINE_STATS.casesDelta,
          response: response.response ?? FALLBACK_TIMELINE_STATS.response,
          coverage: response.coverage ?? FALLBACK_TIMELINE_STATS.coverage,
        });
      } catch (error) {
        console.error("Failed to fetch timeline stats", error);
        setDataSyncError(
          (prev) =>
            prev ?? "Unable to sync timeline stats. Showing cached data."
        );
      }
    }
    loadTimelineStats();
    return () => {
      ignore = true;
    };
  }, [selectedDistrict, timelineRange]);

  const highAlertVillages = useMemo(() => {
    // Flatten to expose highest case villages regardless of district for quick hero alerts.
    return districtInsights
      .flatMap((district) =>
        district.taluks.flatMap((taluk) =>
          taluk.villages.map((village) => ({
            district: district.district,
            taluk: taluk.name,
            name: village.name,
            cases: village.cases,
          }))
        )
      )
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 5);
  }, [districtInsights]);

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

  const getVillageSeverity = (cases) => {
    if (cases >= 10)
      return { badge: "bg-red-100 text-red-800", label: "Critical" };
    if (cases >= 6)
      return { badge: "bg-orange-100 text-orange-700", label: "Watch" };
    return { badge: "bg-green-100 text-green-700", label: "Stable" };
  };

  const handleDistrictChange = (event) => {
    const nextDistrict = event.target.value;
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
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">
              District-wise Cases
            </h3>
          </div>
          <div className="h-64">
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
                <Bar dataKey="dengue" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="malaria" fill="#f97316" radius={[6, 6, 0, 0]} />
                <Bar dataKey="typhoid" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </RechartBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">
              Disease Trend (30 Days)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dengue"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="malaria"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-8 xl:max-w-5xl">
        <KeralaHeatMap compact />
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
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {districtInsights.map((district) => (
                    <option key={district.district} value={district.district}>
                      {district.district}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-600">
                {activeDistrictData?.totalCases} active cases across{" "}
                {activeDistrictData?.taluks.length} taluks. Prioritize{" "}
                {activeDistrictData?.taluks[0]?.name ?? "--"} for field
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
            {activeDistrictData?.taluks.map((taluk) => {
              const isExpanded = expandedTaluk === taluk.name;
              return (
                <button
                  key={taluk.name}
                  type="button"
                  onClick={() => handleTalukToggle(taluk)}
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
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {village.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {village.cases} cases
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${severity.badge}`}
                            >
                              {severity.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Village level alerts
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                Top hotspots to inspect
              </h3>
            </div>
            <span className="text-xs text-gray-500">Across Kerala</span>
          </div>
          <div className="scroll-area space-y-3 max-h-72 overflow-y-auto pr-2 pb-2 flex-1">
            {highAlertVillages.map((village) => {
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
            })}
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
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            <h3 className="text-xl font-bold text-gray-900">
              Active Disease Cases
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Camp
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Disease
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  New Cases
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Total Cases
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {row.camp}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {row.disease}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                      +{row.newCases}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {row.totalCases}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        statusColors[row.status]
                      }`}
                    >
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DiseaseMonitoring;
