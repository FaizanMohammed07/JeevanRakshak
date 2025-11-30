import { useEffect, useMemo, useState } from "react";
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

function TrendCharts({ district, refreshKey }) {
  const [widgets, setWidgets] = useState({
    diseaseTrends: [],
    vaccinationProgress: [],
    complianceScores: [],
  });
  const [widgetError, setWidgetError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the chart datasets any time district filter or refresh tick changes.
  useEffect(() => {
    let ignore = false;
    async function loadWidgets() {
      setIsLoading(true);
      try {
        const response = await fetchTrendWidgets(district ? { district } : {});
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
  }, [district, refreshKey]);

  const { diseaseTrends, vaccinationProgress, complianceScores } = widgets;
  const diseaseTrendKeys = useMemo(() => {
    if (!diseaseTrends.length) return [];
    const totals = new Map();
    diseaseTrends.forEach((row) => {
      Object.entries(row).forEach(([key, value]) => {
        if (key === "day" || typeof value !== "number") return;
        totals.set(key, (totals.get(key) ?? 0) + value);
      });
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key);
  }, [diseaseTrends]);

  const renderEmpty = (label) => (
    <div className="h-72 flex items-center justify-center text-sm text-gray-500">
      {isLoading ? "Loading data..." : `No ${label} to display.`}
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
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
        {diseaseTrends.length === 0 || diseaseTrendKeys.length === 0 ? (
          renderEmpty("disease trend data")
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={diseaseTrends}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend />
                {diseaseTrendKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={formatTrendLabel(key)}
                    stroke={linePalette[index % linePalette.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
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
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
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
      </div>
    </div>
  );
}

export default TrendCharts;
