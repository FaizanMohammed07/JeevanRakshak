import { useEffect, useState } from "react";
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

const FALLBACK_TRENDS = {
  diseaseTrends: [
    { day: "Mon", dengue: 32, malaria: 20, influenza: 12 },
    { day: "Tue", dengue: 40, malaria: 18, influenza: 15 },
    { day: "Wed", dengue: 36, malaria: 16, influenza: 11 },
    { day: "Thu", dengue: 28, malaria: 14, influenza: 9 },
    { day: "Fri", dengue: 24, malaria: 12, influenza: 7 },
    { day: "Sat", dengue: 22, malaria: 10, influenza: 6 },
    { day: "Sun", dengue: 18, malaria: 8, influenza: 5 },
  ],
  vaccinationProgress: [
    { district: "Ernakulam", full: 78, partial: 12 },
    { district: "Kollam", full: 72, partial: 18 },
    { district: "Thrissur", full: 69, partial: 22 },
    { district: "Palakkad", full: 64, partial: 26 },
    { district: "Kozhikode", full: 81, partial: 10 },
  ],
  complianceScores: [
    { name: "Hospitals", score: 92, fill: "#2563eb" },
    { name: "Camps", score: 84, fill: "#0ea5e9" },
    { name: "Labs", score: 76, fill: "#34d399" },
  ],
};

function TrendCharts() {
  const [widgets, setWidgets] = useState(FALLBACK_TRENDS);
  const [widgetError, setWidgetError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function loadWidgets() {
      try {
        const response = await fetchTrendWidgets();
        if (!ignore && response) {
          setWidgets({
            diseaseTrends:
              Array.isArray(response.diseaseTrends) &&
              response.diseaseTrends.length
                ? response.diseaseTrends
                : FALLBACK_TRENDS.diseaseTrends,
            vaccinationProgress:
              Array.isArray(response.vaccinationProgress) &&
              response.vaccinationProgress.length
                ? response.vaccinationProgress
                : FALLBACK_TRENDS.vaccinationProgress,
            complianceScores:
              Array.isArray(response.complianceScores) &&
              response.complianceScores.length
                ? response.complianceScores
                : FALLBACK_TRENDS.complianceScores,
          });
        }
      } catch (error) {
        if (!ignore) {
          setWidgetError(
            "Unable to sync trend widgets. Showing cached visualization."
          );
          console.error("Trend widget fetch failed", error);
        }
      }
    }
    loadWidgets();
    return () => {
      ignore = true;
    };
  }, []);

  const { diseaseTrends, vaccinationProgress, complianceScores } = widgets;

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
              <Line
                type="monotone"
                dataKey="dengue"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="malaria"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="influenza"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
      </div>
    </div>
  );
}

export default TrendCharts;
