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

const geoUrl =
  "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

const heatmapRangeOptions = [
  { label: "Today", value: "today", rangeDays: 1, offsetDays: 0 },
  { label: "Yesterday", value: "yesterday", rangeDays: 1, offsetDays: 1 },
  { label: "7 Days", value: "7d", rangeDays: 7, offsetDays: 0 },
  { label: "14 Days", value: "14d", rangeDays: 14, offsetDays: 0 },
  { label: "30 Days", value: "30d", rangeDays: 30, offsetDays: 0 },
];

const riskStyles = {
  stable: {
    label: "Stable",
    color: "#22c55e",
    chip: "bg-green-100 text-green-800",
  },
  observe: {
    label: "Observe",
    color: "#fde047",
    chip: "bg-yellow-100 text-yellow-800",
  },
  moderate: {
    label: "Moderate",
    color: "#fb923c",
    chip: "bg-orange-100 text-orange-800",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
    chip: "bg-red-100 text-red-800",
  },
};

const riskOrder = ["critical", "moderate", "observe", "stable"];

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

const computeRiskLevel = (activeCases) => {
  const cases = Number(activeCases) || 0;
  if (cases >= 6) return "critical";
  if (cases >= 3) return "moderate";
  if (cases >= 1) return "observe";
  return "stable";
};

function KeralaHeatMap({ compact = false, refreshKey }) {
  const navigate = useNavigate();
  const [riskProfile, setRiskProfile] = useState([]);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeKey, setRangeKey] = useState(heatmapRangeOptions[0].value);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [mapLayer, setMapLayer] = useState("district");

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

  const riskSummary = useMemo(() => {
    const totals = riskProfile.reduce(
      (acc, district) => {
        const risk = computeRiskLevel(district.activeCases);
        acc[risk] = (acc[risk] ?? 0) + 1;
        acc.totalActive += district.activeCases ?? 0;
        return acc;
      },
      { totalActive: 0, stable: 0, observe: 0, moderate: 0, critical: 0 }
    );
    const topDistrict = riskProfile.reduce((prev, next) => {
      if (!prev) return next;
      return (next.activeCases ?? 0) > (prev.activeCases ?? 0) ? next : prev;
    }, null);
    return {
      ...totals,
      total: riskProfile.length,
      topDistrict,
    };
  }, [riskProfile]);

  const groupedDistricts = useMemo(() => {
    const sorted = [...riskProfile].sort(
      (a, b) => (b.activeCases ?? 0) - (a.activeCases ?? 0)
    );
    return sorted.reduce(
      (acc, district) => {
        const risk = computeRiskLevel(district.activeCases);
        acc[risk] = acc[risk] ?? [];
        acc[risk].push(district);
        return acc;
      },
      { critical: [], moderate: [], observe: [], stable: [] }
    );
  }, [riskProfile]);

  const activeDistrictRisk = useMemo(
    () => computeRiskLevel(activeDistrict?.activeCases),
    [activeDistrict?.activeCases]
  );

  const customRangeActive = customRangeOpen && customStartDate && customEndDate;

  const heatmapQueryParams = useMemo(() => {
    if (customRangeActive) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }
    return {
      rangeDays: rangeConfig.rangeDays,
      offsetDays: rangeConfig.offsetDays,
    };
  }, [
    customRangeActive,
    customStartDate,
    customEndDate,
    rangeConfig.rangeDays,
    rangeConfig.offsetDays,
  ]);

  useEffect(() => {
    let ignore = false;
    async function loadRiskMap() {
      try {
        if (!ignore) {
          setLoading(true);
          setError(null);
        }
        const response = await fetchKeralaRiskMap(heatmapQueryParams);
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
  }, [activeDistrictSlug, heatmapQueryParams, refreshKey]);

  const handleDistrictClick = (district) => {
    if (!district?.name) return;
    setActiveDistrict(district);
    navigate(`/disease/district/${slugify(district.name)}`);
  };

  const mapHeight = compact ? "min-h-[360px]" : "min-h-[460px]";

  return (
    <div
      className={`bg-gradient-to-br from-slate-900/5 via-white to-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full ${
        compact ? "min-h-[380px]" : "min-h-[520px]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <MapPin className="text-blue-600" size={24} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Disease Heatmap</h3>
            <p className="text-sm text-gray-500">
              District risk levels mapped across Kerala
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => setCustomRangeOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              customRangeOpen
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Custom range
          </button>
        </div>
      </div>
      {customRangeOpen && (
        <div className="grid w-full gap-3 md:grid-cols-3 mb-4">
          <label className="flex flex-col text-xs text-gray-600">
            Start date
            <input
              type="date"
              value={customStartDate}
              onChange={(event) => setCustomStartDate(event.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-slate-500 focus:ring-0"
            />
          </label>
          <label className="flex flex-col text-xs text-gray-600">
            End date
            <input
              type="date"
              value={customEndDate}
              onChange={(event) => setCustomEndDate(event.target.value)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-slate-500 focus:ring-0"
            />
          </label>
          {customRangeActive && (
            <p className="text-xs text-slate-500 flex items-end">
              Showing data from {customStartDate} to {customEndDate}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-500">Map</span>

        {["district", "taluk"].map((layer) => (
          <button
            key={layer}
            onClick={() => setMapLayer(layer)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
              mapLayer === layer
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {layer === "district" ? "Districts" : "Taluks"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.8fr,1fr]">
        <div
          className={`relative ${mapHeight} rounded-2xl border border-slate-100 shadow-inner overflow-hidden bg-slate-950/5`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white" />
          <div className="relative flex h-full flex-col p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                {Object.entries(riskStyles).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 text-xs text-gray-600"
                  >
                    <span
                      className="inline-flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: value.color }}
                    />
                    {value.label}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                Total districts: {riskSummary.total}
              </span>
            </div>
            <div className="relative flex-1 min-h-[220px]">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 9000, center: [76.5, 10.2] }}
                style={{ width: "100%", height: "100%" }}
              >
                <Geographies
                  geography={
                    mapLayer === "district"
                      ? "https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/district.geojson"
                      : "https://raw.githubusercontent.com/geohacker/kerala/master/geojsons/taluk.geojson"
                  }
                >
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={1.2}
                        style={{
                          default: { opacity: 0.15 },
                          hover: { opacity: 0.2 },
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
                          fillOpacity={0.35}
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
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white/90 border border-gray-100 p-4 shadow-sm max-h-[520px]">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              Quick view
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-gray-500">Active districts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {riskSummary.total}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-gray-500">Active cases</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {riskSummary.totalActive.toLocaleString?.() ?? "--"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-gray-500">Critical districts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {riskSummary.critical}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] text-gray-500">Moderate districts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {riskSummary.moderate}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
                  District risk watch
                </p>
                <span className="text-xs text-gray-500">Scroll for more</span>
              </div>
              <div
                className="mt-3 space-y-3 overflow-y-auto pr-1"
                style={{ maxHeight: 230 }}
              >
                {riskOrder.map((key) => {
                  const districts = groupedDistricts[key] ?? [];
                  const percentage = riskSummary.total
                    ? Math.round((districts.length / riskSummary.total) * 100)
                    : 0;
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-inner"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            {riskStyles[key].label}
                          </p>
                          <p className="text-xl font-semibold text-gray-900">
                            {districts.length}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {percentage}% of districts
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: riskStyles[key].color,
                          }}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                        {districts.length ? (
                          districts.map((district) => (
                            <button
                              key={district.name}
                              type="button"
                              onClick={() => handleDistrictClick(district)}
                              className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-slate-400"
                            >
                              {district.name}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-400">
                            No districts highlighted
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/90 border border-gray-100 p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-2">District Focus</p>
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
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-600">
                  <span className="font-medium text-gray-500">Migrants:</span>
                  <span>
                    {activeDistrict.migrants?.toLocaleString?.() ?? "--"}
                  </span>
                  <span className="font-medium text-gray-500">
                    Active Cases:
                  </span>
                  <span>{activeDistrict.activeCases ?? "--"}</span>
                  <span className="font-medium text-gray-500">
                    Top Disease:
                  </span>
                  <span>{activeDistrict.topDisease ?? "--"}</span>
                  <span className="font-medium text-gray-500">
                    Weekly Trend:
                  </span>
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
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {loading
                  ? "Loading live district data..."
                  : error ?? "Live district data unavailable."}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Click a district marker to jump into drill-down view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeralaHeatMap;
