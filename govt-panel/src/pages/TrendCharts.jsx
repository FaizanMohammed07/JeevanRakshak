import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { fetchTrendWidgets } from "../api/dashboard";

const linePalette = [
  "#ef4444",
  "#f97316",
  "#0ea5e9",
  "#6366f1",
  "#10b981",
  "#14b8a6",
];

const trendMetaFields = new Set(["day", "date", "axisLabel", "sequence"]);

const weekTabOptions = [
  { label: "This Week", value: 0 },
  { label: "Last Week", value: 1 },
  { label: "2 Weeks Ago", value: 2 },
  { label: "3 Weeks Ago", value: 3 },
];

const formatTrendLabel = (key = "") => {
  if (!key) return "Disease";
  const spaced = key
    .toString()
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return (
    spaced
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Disease"
  );
};

const formatRangeLabel = (startDate, endDate) => {
  const format = (date, withYear = false) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
    });
  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const includeYear = !sameYear;
  const startStr = format(startDate, includeYear);
  const endStr = format(endDate, true);
  return sameMonth && sameYear
    ? `${startStr} - ${endDate.getDate()}`
    : `${startStr} - ${endStr}`;
};

const getWeekLabel = (offsetWeeks = 0) => {
  if (offsetWeeks === 0) return "This Week";
  if (offsetWeeks === 1) return "Last Week";
  return `${offsetWeeks} Weeks Ago`;
};

const getWeekRange = (offsetWeeks = 0) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() - offsetWeeks * 7);
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const label = getWeekLabel(offsetWeeks);
  return {
    key: `${label.toLowerCase().replace(/\s+/g, "-")}-${offsetWeeks}`,
    label,
    range: formatRangeLabel(start, end),
    start,
    end,
  };
};

const TrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const sorted = [...payload]
    .filter((entry) => typeof entry.value === "number")
    .sort((a, b) => b.value - a.value);
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-600">{label}</p>
      <ul className="space-y-1">
        {sorted.map((entry) => (
          <li
            key={entry.dataKey}
            className="flex items-center justify-between gap-4 text-slate-600"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {formatTrendLabel(entry.dataKey)}
            </span>
            <span className="font-semibold text-slate-900">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

function TrendCharts({ district, refreshKey }) {
  const [widgets, setWidgets] = useState({
    diseaseTrends: [],
    vaccinationProgress: [],
    complianceScores: [],
  });
  const [widgetError, setWidgetError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  // Fetch the chart datasets any time district filter or refresh tick changes.
  useEffect(() => {
    let ignore = false;
    async function loadWidgets() {
      setIsLoading(true);
      try {
        const params = { weekOffset };
        if (district) params.district = district;
        const response = await fetchTrendWidgets(params);
        if (!ignore && response) {
          setWidgets({
            diseaseTrends: Array.isArray(response.diseaseTrends)
              ? response.diseaseTrends
              : [],
            vaccinationProgress: Array.isArray(response.vaccinationProgress)
              ? response.vaccinationProgress
              : [],
            complianceScores: Array.isArray(response.complianceScores)
              ? response.complianceScores
              : [],
          });
          setWidgetError(null);
        }
      } catch (error) {
        if (!ignore) {
          setWidgetError(
            "Unable to sync trend widgets. Please retry in a moment."
          );
          console.error("Trend widget fetch failed", error);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    loadWidgets();
    return () => {
      ignore = true;
    };
  }, [district, refreshKey, weekOffset]);

  const { diseaseTrends, vaccinationProgress, complianceScores } = widgets;
  const diseaseTrendKeys = useMemo(() => {
    if (!diseaseTrends.length) return [];
    const totals = new Map();
    diseaseTrends.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (trendMetaFields.has(key) || typeof value !== "number") return;
        totals.set(key, (totals.get(key) ?? 0) + value);
      });
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
  }, [diseaseTrends]);

  const orderedDiseaseTrends = useMemo(() => {
    if (!diseaseTrends.length) return [];
    return [...diseaseTrends].sort((a, b) => {
      if (typeof a.sequence === "number" && typeof b.sequence === "number") {
        return a.sequence - b.sequence;
      }
      if (a.date && b.date) {
        return new Date(a.date) - new Date(b.date);
      }
      return 0;
    });
  }, [diseaseTrends]);

  const trendWeekRanges = useMemo(() => {
    const active = getWeekRange(weekOffset);
    const adjacentIndex = Math.min(weekOffset + 1, weekTabOptions.length - 1);
    const adjacent =
      adjacentIndex !== weekOffset ? getWeekRange(adjacentIndex) : null;
    return adjacent ? [active, adjacent] : [active];
  }, [weekOffset]);

  const activeWeekWindow = trendWeekRanges[0];

  const formatDayWithDate = useCallback((value = "") => value, []);

  const renderEmpty = (label) => (
    <div className="min-h-[320px] md:min-h-[380px] xl:min-h-[440px] flex items-center justify-center text-sm text-gray-500">
      {isLoading ? "Loading data..." : `No ${label} to display.`}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Weekly Disease Trends
            </h3>
            <p className="text-sm text-gray-500">
              Comparative line chart of active cases
            </p>
            {widgetError && (
              <p className="mt-2 text-xs text-amber-600">{widgetError}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {weekTabOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setWeekOffset(option.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    weekOffset === option.value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {activeWeekWindow && (
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Window • {activeWeekWindow.range}
              </p>
            )}
          </div>
        </div>
        {diseaseTrends.length === 0 || diseaseTrendKeys.length === 0 ? (
          renderEmpty("disease trend data")
        ) : (
          <div className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white/70 shadow-inner">
            {/* ---------- Responsive fixed-height canvas (no scrollbars) */}
            <div className="h-[320px] md:h-[380px] xl:h-[440px] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={orderedDiseaseTrends}
                  margin={{ top: 20, right: 36, left: 20, bottom: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="axisLabel"
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5f5" }}
                    tickFormatter={formatDayWithDate}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5f5" }}
                  />
                  <Tooltip
                    content={<TrendTooltip />}
                    labelFormatter={formatDayWithDate}
                  />
                  <Legend wrapperStyle={{ paddingTop: 12 }} />
                  {diseaseTrendKeys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={formatTrendLabel(key)}
                      stroke={linePalette[index % linePalette.length]}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* this is vaccination progress covergae ther in the Dashboard page */}
      {/* <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Vaccination Coverage
          </h3>
          <p className="text-sm text-gray-500">
            Fully vs partially covered populations
          </p>
        </div>
        {vaccinationProgress.length === 0 ? (
          renderEmpty("vaccination coverage data")
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vaccinationProgress}
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
                <Bar
                  dataKey="full"
                  stackId="a"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="partial"
                  stackId="a"
                  fill="#93c5fd"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div> */}

      {/* compliance scores radial bar chart - hidden as per latest brief */}

      {/* <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Compliance Snapshot
          </h3>
          <p className="text-sm text-gray-500">
            Radial chart for audit readiness
          </p>
        </div>
        {complianceScores.length === 0 ? (
          renderEmpty("compliance scores")
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="20%"
                outerRadius="100%"
                barSize={12}
                data={complianceScores}
              >
                <RadialBar background dataKey="score" cornerRadius={6} />
                <Legend
                  iconSize={12}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div> */}
    </div>
  );
}

export default TrendCharts;
