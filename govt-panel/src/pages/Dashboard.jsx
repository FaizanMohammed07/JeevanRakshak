import { useEffect, useState } from "react";
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
import TrendCharts from "./TrendCharts";
import { slugify } from "../utils/slugify";
import {
  fetchDashboardSummary,
  fetchOutbreakAlerts,
  fetchRapidRiskSnapshot,
  fetchSdgImpact,
} from "../api/dashboard";
import { fetchDiseaseDistricts } from "../api/disease";

const ALL_DISTRICTS_LABEL = "All Districts";

const DEFAULT_DISTRICTS = [
  ALL_DISTRICTS_LABEL,
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
];

const FALLBACK_DASHBOARD_DATA = {
  stats: [
    {
      label: "Total Migrants Registered",
      value: "45,823",
      iconKey: "migrants",
      color: "blue",
      trend: "+12%",
    },
    {
      label: "High-Risk Camps",
      value: "23",
      iconKey: "camps",
      color: "red",
      trend: "+3",
    },
    {
      label: "Active Disease Cases",
      value: "156",
      iconKey: "alerts",
      color: "orange",
      trend: "-8%",
    },
    {
      label: "Vaccination Coverage",
      value: "78%",
      iconKey: "vaccinations",
      color: "green",
      trend: "+5%",
    },
    {
      label: "Hospitals Reporting Today",
      value: "142",
      iconKey: "hospitals",
      color: "purple",
      trend: "98%",
    },
  ],
  outbreakAlerts: [
    {
      id: 1,
      alert: "Dengue Outbreak",
      camp: "Kochi Construction Camp 3",
      severity: "high",
      date: "2 hours ago",
    },
    {
      id: 2,
      alert: "Malaria Cases Rising",
      camp: "Trivandrum Labor Camp 12",
      severity: "medium",
      date: "5 hours ago",
    },
    {
      id: 3,
      alert: "Typhoid Detection",
      camp: "Kozhikode Camp Site A",
      severity: "low",
      date: "1 day ago",
    },
    {
      id: 4,
      alert: "Respiratory Infection Cluster",
      camp: "Thrissur Industrial Camp",
      severity: "high",
      date: "3 hours ago",
    },
  ],
  sdgMetrics: [
    {
      goal: "SDG 3",
      title: "Good Health & Well-being",
      value: "92%",
      delta: "+4% QoQ",
      progress: 92,
      indicator: "Camps with daily medical rounds",
      icon: HeartPulse,
      accent: {
        chip: "bg-emerald-500",
        bar: "bg-emerald-400",
      },
    },
    {
      goal: "SDG 10",
      title: "Reduced Inequalities",
      value: "68%",
      delta: "+11%",
      progress: 68,
      indicator: "Migrant families with insurance coverage",
      icon: Scale,
      accent: {
        chip: "bg-orange-500",
        bar: "bg-orange-400",
      },
    },
    {
      goal: "SDG 16",
      title: "Strong Institutions",
      value: "81%",
      delta: "+6%",
      progress: 81,
      indicator: "Districts meeting response SLA",
      icon: ShieldCheck,
      accent: {
        chip: "bg-indigo-500",
        bar: "bg-indigo-400",
      },
    },
  ],
  rapidRiskModel: [
    {
      district: "Ernakulam",
      migrants: "15,890",
      risk: "Critical",
      indicator: "Urban dengue escalation",
      sla: "4 hrs",
      trend: "+12%",
    },
    {
      district: "Thrissur",
      migrants: "12,140",
      risk: "Critical",
      indicator: "Respiratory cluster",
      sla: "6 hrs",
      trend: "+9%",
    },
    {
      district: "Kozhikode",
      migrants: "13,420",
      risk: "Observe",
      indicator: "Typhoid pockets detected",
      sla: "8 hrs",
      trend: "+4%",
    },
    {
      district: "Palakkad",
      migrants: "9,230",
      risk: "Observe",
      indicator: "Heat-related cases",
      sla: "10 hrs",
      trend: "+3%",
    },
  ],
};

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

function Dashboard() {
  const [districtOptions, setDistrictOptions] = useState(DEFAULT_DISTRICTS);
  const { districtId } = useParams();
  const navigate = useNavigate();
  const [selectedDistrict, setSelectedDistrict] = useState(
    DEFAULT_DISTRICTS[0]
  );
  const [stats, setStats] = useState(FALLBACK_DASHBOARD_DATA.stats);
  const [outbreakAlerts, setOutbreakAlerts] = useState(
    FALLBACK_DASHBOARD_DATA.outbreakAlerts
  );
  const [sdgMetrics, setSdgMetrics] = useState(
    FALLBACK_DASHBOARD_DATA.sdgMetrics
  );
  const [rapidRiskModel, setRapidRiskModel] = useState(
    FALLBACK_DASHBOARD_DATA.rapidRiskModel
  );
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

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

  const handleDistrictSelect = (event) => {
    const value = event.target.value;
    setSelectedDistrict(value);
    if (value === ALL_DISTRICTS_LABEL) {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/district/${slugify(value)}`);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadDashboardData() {
      setIsDashboardLoading(true);
      setDashboardError(null);
      try {
        const districtFilter =
          selectedDistrict === ALL_DISTRICTS_LABEL
            ? undefined
            : slugify(selectedDistrict);
        const [summary, alerts, risk, sdg] = await Promise.all([
          fetchDashboardSummary({ district: districtFilter }),
          fetchOutbreakAlerts({ district: districtFilter }),
          fetchRapidRiskSnapshot(),
          fetchSdgImpact(),
        ]);

        if (ignore) return;

        setStats(
          Array.isArray(summary?.stats) && summary.stats.length
            ? summary.stats.map((stat) => ({
                ...stat,
                iconKey: stat.iconKey || stat.icon || "migrants",
              }))
            : FALLBACK_DASHBOARD_DATA.stats
        );
        setOutbreakAlerts(
          alerts?.alerts?.length
            ? alerts.alerts
            : FALLBACK_DASHBOARD_DATA.outbreakAlerts
        );
        setRapidRiskModel(
          risk?.districts?.length
            ? risk.districts
            : FALLBACK_DASHBOARD_DATA.rapidRiskModel
        );
        setSdgMetrics(
          sdg?.metrics?.length
            ? sdg.metrics.map((metric) => ({
                ...metric,
                icon: sdgIconMap[metric.icon] || metric.icon || HeartPulse,
              }))
            : FALLBACK_DASHBOARD_DATA.sdgMetrics
        );
      } catch (error) {
        if (!ignore) {
          setDashboardError(
            "Unable to sync dashboard data. Showing last known values."
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
  }, [selectedDistrict]);

  const severityColors = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-orange-100 text-orange-800 border-orange-200",
    low: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };

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

        <select className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = statIconMap[stat.iconKey] || Users;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`text-${stat.color}-600`} size={24} />
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <TrendingUp size={16} />
                  {stat.trend}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {outbreakAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{alert.alert}</h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      severityColors[alert.severity]
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.camp}</p>
                <p className="text-xs text-gray-500">{alert.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <TrendCharts />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sdgMetrics.map((metric) => {
            const Icon = metric.icon;
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
      </div>
    </div>
  );
}

export default Dashboard;
