import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { slugify } from "../utils/slugify";
import { fetchKeralaRiskMap } from "../api/disease";

<<<<<<< HEAD
const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

const heatmapRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "7 Days", value: "7d", rangeDays: 7, offsetDays: 0 },
  { label: "14 Days", value: "14d", rangeDays: 14, offsetDays: 0 },
  { label: "30 Days", value: "30d", rangeDays: 30, offsetDays: 0 },
=======
const geoUrl = "";
const FALLBACK_RISK_PROFILE = [
  {
    name: "Thiruvananthapuram",
    migrants: 12870,
    activeCases: 46,
    risk: "observe",
    riskNote: "Vector surveillance ongoing",
    trend: "+6% this week",
    coordinates: [76.9415, 8.5241],
  },
  {
    name: "Kollam",
    migrants: 8420,
    activeCases: 29,
    risk: "stable",
    riskNote: "Clinics reporting on schedule",
    trend: "-3% this week",
    coordinates: [76.6141, 8.8932],
  },
  {
    name: "Pathanamthitta",
    migrants: 5134,
    activeCases: 18,
    risk: "stable",
    riskNote: "Fever clinics under control",
    trend: "Flat",
    coordinates: [76.7825, 9.2648],
  },
  {
    name: "Alappuzha",
    migrants: 10112,
    activeCases: 35,
    risk: "observe",
    riskNote: "Waterborne watch issued",
    trend: "+2%",
    coordinates: [76.3388, 9.4981],
  },
  {
    name: "Kottayam",
    migrants: 7395,
    activeCases: 26,
    risk: "stable",
    riskNote: "Immunization drive active",
    trend: "-4%",
    coordinates: [76.5222, 9.5916],
  },
  {
    name: "Idukki",
    migrants: 4688,
    activeCases: 22,
    risk: "observe",
    riskNote: "Hill camps exposed",
    trend: "+1%",
    coordinates: [76.9725, 9.9186],
  },
  {
    name: "Ernakulam",
    migrants: 15890,
    activeCases: 58,
    risk: "critical",
    riskNote: "Urban dengue escalation",
    trend: "+12%",
    coordinates: [76.2673, 9.9312],
  },
  {
    name: "Thrissur",
    migrants: 12140,
    activeCases: 52,
    risk: "critical",
    riskNote: "Respiratory cluster",
    trend: "+9%",
    coordinates: [76.2141, 10.5276],
  },
  {
    name: "Palakkad",
    migrants: 9230,
    activeCases: 31,
    risk: "observe",
    riskNote: "Heat-related cases",
    trend: "+3%",
    coordinates: [76.651, 10.7867],
  },
  {
    name: "Malappuram",
    migrants: 11240,
    activeCases: 37,
    risk: "observe",
    riskNote: "Mosquito density high",
    trend: "+5%",
    coordinates: [75.984, 11.0519],
  },
  {
    name: "Kozhikode",
    migrants: 13420,
    activeCases: 44,
    risk: "critical",
    riskNote: "Typhoid pockets detected",
    trend: "+4%",
    coordinates: [75.7804, 11.2588],
  },
  {
    name: "Wayanad",
    migrants: 4890,
    activeCases: 17,
    risk: "stable",
    riskNote: "Outreach teams active",
    trend: "-2%",
    coordinates: [76.132, 11.6854],
  },
  {
    name: "Kannur",
    migrants: 10280,
    activeCases: 33,
    risk: "observe",
    riskNote: "Port surveillance",
    trend: "+1%",
    coordinates: [75.3704, 11.8745],
  },
  {
    name: "Kasaragod",
    migrants: 6125,
    activeCases: 21,
    risk: "stable",
    riskNote: "Border clinics stable",
    trend: "Flat",
    coordinates: [75.0017, 12.4996],
  },
>>>>>>> 4196167931069518e1f7a290616a7e55c844204b
];

const riskStyles = {
  stable: {
    label: "Stable",
    color: "#22c55e",
    chip: "bg-green-100 text-green-800",
  },
  observe: {
    label: "Observe",
    color: "#facc15",
    chip: "bg-yellow-100 text-yellow-800",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
    chip: "bg-red-100 text-red-800",
  },
};

const changeBadge = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { label: "--", badge: "bg-gray-100 text-gray-600" };
  }
  const formatted = `${value >= 0 ? "+" : ""}${value}%`;
  if (value >= 30)
    return { label: formatted, badge: "bg-red-100 text-red-800" };
  if (value >= 10)
    return { label: formatted, badge: "bg-yellow-100 text-yellow-800" };
  if (value <= -10)
    return { label: formatted, badge: "bg-emerald-100 text-emerald-800" };
  return { label: formatted, badge: "bg-gray-100 text-gray-700" };
};

function KeralaHeatMap({ compact = false, refreshKey }) {
  const navigate = useNavigate();
  const [riskProfile, setRiskProfile] = useState([]);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeKey, setRangeKey] = useState(heatmapRangeOptions[0].value);

  const rangeConfig = useMemo(
    () =>
      heatmapRangeOptions.find((option) => option.value === rangeKey) ??
      heatmapRangeOptions[0],
    [rangeKey]
  );

  const activeDistrictSlug = useMemo(() => {
    if (!activeDistrict?.name) return null;
    return slugify(activeDistrict.name);
  }, [activeDistrict?.name]);

  const activeDistrictChange = useMemo(
    () => changeBadge(activeDistrict?.changePercent),
    [activeDistrict?.changePercent]
  );

  const radiusScale = useMemo(() => {
    const maxCases =
      riskProfile.length > 0
        ? Math.max(...riskProfile.map((entry) => entry.activeCases || 0))
        : 10;
    return scaleLinear()
      .domain([5, Math.max(maxCases, 10)])
      .range([6, 18]);
  }, [riskProfile]);

  useEffect(() => {
    let ignore = false;
    async function loadRiskMap() {
      try {
        if (!ignore) {
          setLoading(true);
          setError(null);
        }
        const response = await fetchKeralaRiskMap({
          rangeDays: rangeConfig.rangeDays,
          offsetDays: rangeConfig.offsetDays,
        });
        if (ignore) return;
        const districts = Array.isArray(response?.districts)
          ? response.districts
          : [];
        setRiskProfile(districts);
        const persisted = activeDistrictSlug
          ? districts.find(
              (entry) => slugify(entry.name) === activeDistrictSlug
            )
          : null;
        setActiveDistrict(persisted ?? districts[0] ?? null);
        if (districts.length === 0) {
          setError("No heatmap data available yet.");
        }
      } catch (error) {
        console.error("Failed to fetch Kerala risk map", error);
        if (!ignore) {
          setError("Unable to sync heatmap data.");
          setRiskProfile([]);
          setActiveDistrict(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadRiskMap();
    return () => {
      ignore = true;
    };
  }, [
    activeDistrictSlug,
    rangeConfig.offsetDays,
    rangeConfig.rangeDays,
    refreshKey,
  ]);

  const handleDistrictClick = (district) => {
    if (!district?.name) return;
    setActiveDistrict(district);
    navigate(`/disease/district/${slugify(district.name)}`);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 h-full flex flex-col ${
        compact ? "min-h-[360px]" : "min-h-[440px]"
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="text-blue-600" size={24} />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Disease Heatmap</h3>
          <p className="text-sm text-gray-500">
            Interactive Kerala map with district risk indicators
          </p>
        </div>
      </div>
      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {Object.entries(riskStyles).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span
                className="inline-flex h-3 w-3 rounded-full"
                style={{ backgroundColor: value.color }}
              ></span>
              <span className="text-sm text-gray-600">{value.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Window</span>
          {heatmapRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRangeKey(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                rangeKey === option.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`flex-1 ${compact ? "min-h-[240px]" : "min-h-[320px]"}`}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 5200, center: [76.5, 10.2] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies
                .filter((geo) => {
                  const name =
                    geo.properties?.st_nm ||
                    geo.properties?.name ||
                    geo.properties?.NAME_1;
                  return name === "Kerala";
                })
                .map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dbeafe"
                    stroke="#1d4ed8"
                    strokeWidth={0.75}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", fill: "#bfdbfe" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
            }
          </Geographies>

          {riskProfile.map((district) => {
            const style = riskStyles[district.risk] || riskStyles.observe;
            return (
              <Marker
                key={district.name}
                coordinates={district.coordinates}
                onMouseEnter={() => setActiveDistrict(district)}
                onFocus={() => setActiveDistrict(district)}
                onClick={() => handleDistrictClick(district)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleDistrictClick(district);
                  }
                }}
              >
                <g>
                  <circle
                    r={radiusScale(district.activeCases)}
                    fill={style.color}
                    fillOpacity={0.25}
                    stroke={style.color}
                    strokeWidth={2}
                  />
                  <circle r={3.5} fill={style.color} />
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      <div className="mt-4 bg-slate-50 rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">District Focus</p>
        {activeDistrict ? (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-xl font-semibold text-gray-900">
                {activeDistrict.name}
              </p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  riskStyles[activeDistrict.risk]?.chip
                }`}
              >
                {riskStyles[activeDistrict.risk]?.label ?? "--"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-sm text-gray-600">
              <span className="font-medium text-gray-500">Migrants:</span>
              <span>{activeDistrict.migrants?.toLocaleString?.() ?? "--"}</span>
              <span className="font-medium text-gray-500">Active Cases:</span>
              <span>{activeDistrict.activeCases ?? "--"}</span>
              <span className="font-medium text-gray-500">Top Disease:</span>
              <span>{activeDistrict.topDisease ?? "--"}</span>
              <span className="font-medium text-gray-500">Weekly Trend:</span>
              <span>{activeDistrict.trend ?? "--"}</span>
              <span className="font-medium text-gray-500">Change:</span>
              <span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${activeDistrictChange.badge}`}
                >
                  {activeDistrictChange.label}
                </span>
              </span>
              <span className="font-medium text-gray-500">Advisory:</span>
              <span>{activeDistrict.riskNote ?? "--"}</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Click a district marker to jump into drill-down view.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {loading
              ? "Loading live district data..."
              : error ?? "Live district data unavailable."}
          </p>
        )}
      </div>
    </div>
  );
}

export default KeralaHeatMap;
