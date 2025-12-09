import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { AlertTriangle, MapPin, Navigation, ShieldCheck } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { translateBatch } from "../utils/translate";

import L from "leaflet";
const userLocationIcon = L.divIcon({
  className: "user-location-icon",
  html: `<div class="dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function NearbyHospitals() {
  const { t, i18n } = useTranslation();
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  // map of translated texts keyed by hospitalKey -> { shortName, address }
  const [translatedMap, setTranslatedMap] = useState({});
  const hospitalFeedTimer = useRef(null);

  const getTranslatedFor = (h) => {
    const key = h.id ?? h.place_id ?? `${h.lat},${h.lon}`;
    return translatedMap[key] || {};
  };

  useEffect(() => {
    return () => {
      if (hospitalFeedTimer.current) {
        clearInterval(hospitalFeedTimer.current);
      }
    };
  }, []);

  const handleRequestLocation = () => {
    if (!navigator?.geolocation) {
      setStatus("error");
      setError("Your device does not support secure location detection.");
      return;
    }
    setStatus("requesting");
    setError(null);
    setLocationDetails(null);
    setLocationAccuracy(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const coordsPair = [coords.latitude, coords.longitude];
        setPosition(coordsPair);
        setLocationAccuracy(
          typeof coords.accuracy === "number" ? coords.accuracy : null
        );
        setStatus("success");
        await Promise.all([
          fetchHospitals(coordsPair),
          resolveAddress(coordsPair),
        ]);
      },
      (geoError) => {
        setStatus("error");
        setLocationAccuracy(null);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError(
            "Permission denied. Please allow location so we can surface hospitals closest to you."
          );
        } else {
          setError("We could not determine your location. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const streamHospitals = (results = []) => {
    if (hospitalFeedTimer.current) {
      clearInterval(hospitalFeedTimer.current);
    }
    const cappedResults = results.slice(0, 20);
    if (!cappedResults.length) {
      setHospitals([]);
      hospitalFeedTimer.current = null;
      return;
    }
    setHospitals([]);
    let index = 0;
    hospitalFeedTimer.current = setInterval(() => {
      const nextHospital = cappedResults[index];
      if (!nextHospital) {
        clearInterval(hospitalFeedTimer.current);
        hospitalFeedTimer.current = null;
        return;
      }
      setHospitals((prev) => [...prev, nextHospital]);
      index += 1;
      if (index >= cappedResults.length) {
        clearInterval(hospitalFeedTimer.current);
        hospitalFeedTimer.current = null;
      }
    }, 350);
  };

  const fetchHospitals = async ([latitude, longitude]) => {
    setIsFetchingHospitals(true);
    try {
      // --- radius settings (tweak these) ---
      // latDelta ~ degrees latitude (~111 km per degree). 0.02 ≈ 2.2 km.
      const latDelta = 0.02; // ~2 km
      // convert to longitude delta (same approximate distance) using cosine of latitude (radians)
      const cosLat = Math.cos((latitude * Math.PI) / 180);
      const lonDelta = latDelta / Math.max(Math.abs(cosLat), 0.0001); // avoid divide-by-zero

      // --- build viewbox: left,top,right,bottom => lon_left,lat_top,lon_right,lat_bottom
      const left = longitude - lonDelta;
      const top = latitude + latDelta;
      const right = longitude + lonDelta;
      const bottom = latitude - latDelta;
      const viewboxStr = `${left},${top},${right},${bottom}`;

      console.log("DEBUG: user coords:", { latitude, longitude });
      console.log("DEBUG: viewbox:", viewboxStr, { latDelta, lonDelta });

      const params = new URLSearchParams({
        format: "json",
        q: "hospital",
        limit: "25",
        bounded: "1",
        viewbox: viewboxStr,
        addressdetails: "1",
        dedupe: "1",
      });

      const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
      console.log("DEBUG: Nominatim URL ->", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);
      const data = await response.json();

      // log first few results for sanity check
      console.log("DEBUG: Nominatim returned:", data.slice(0, 5));

      // Normalize results to numbers and expected fields
      const mapped = data.map((item) => ({
        id: item.place_id,
        name: (item.display_name || "Hospital").split(",")[0],
        lat: Number(item.lat),
        lon: Number(item.lon),
        address: item.display_name,
      }));

      setHospitals(mapped);
    } catch (err) {
      console.error("fetchHospitals error:", err);
      setError("Unable to fetch nearby hospitals right now. Please retry.");
    } finally {
      setIsFetchingHospitals(false);
    }
  };

  const resolveAddress = async ([latitude, longitude]) => {
    setIsResolvingAddress(true);
    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: latitude.toString(),
        lon: longitude.toString(),
        zoom: "18",
        addressdetails: "1",
        "accept-language": "en",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );
      const data = await response.json();
      if (data?.display_name) {
        const components = data.address || {};
        const locality =
          components.village ||
          components.town ||
          components.city ||
          components.county ||
          components.state;
        setLocationDetails({
          displayName: data.display_name,
          locality,
        });
      } else {
        setLocationDetails(null);
      }
    } catch {
      setLocationDetails(null);
    } finally {
      setIsResolvingAddress(false);
    }
  };

  const preparedHospitals = useMemo(() => {
    if (!position) return [];
    return hospitals
      .filter(Boolean)
      .map((hospital) => {
        const lat = Number(hospital.lat);
        const lon = Number(hospital.lon);
        const distance = calculateDistanceKm(
          position[0],
          position[1],
          lat,
          lon
        );
        return {
          ...hospital,
          lat,
          lon,
          distance,
          shortName: hospital.name || "Hospital",
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [hospitals, position]);

  // Translate hospital names & addresses for current UI language (client-side)
  useEffect(() => {
    let mounted = true;
    const lang = (i18n?.language || "en").split("-")[0];
    if (!preparedHospitals || preparedHospitals.length === 0) return;
    if (lang === "en") {
      // clear any previous translations when English selected
      setTranslatedMap({});
      return;
    }

    (async () => {
      try {
        // cap to avoid excessive tokens/cost
        const items = preparedHospitals.slice(0, 40);
        const allTexts = [];
        const keys = [];

        for (const h of items) {
          const key = h.id ?? h.place_id ?? `${h.lat},${h.lon}`;
          keys.push(key);
          // push shortName and address (address may be hospital.address or display_name)
          allTexts.push(h.shortName || h.name || "");
          allTexts.push(h.address || h.display_name || "");
        }

        if (allTexts.length === 0) return;

        const translations = await translateBatch(allTexts, lang);

        if (!mounted || !Array.isArray(translations)) return;

        const next = {};
        for (let i = 0; i < keys.length; i++) {
          const shortIdx = i * 2;
          const addrIdx = shortIdx + 1;
          const shortTranslated =
            translations[shortIdx] || items[i].shortName || items[i].name || "";
          const addrTranslated =
            translations[addrIdx] ||
            items[i].address ||
            items[i].display_name ||
            "";
          next[keys[i]] = {
            shortName: shortTranslated,
            address: addrTranslated,
          };
        }

        setTranslatedMap((prev) => ({ ...prev, ...next }));
      } catch (e) {
        // ignore translation failures — keep originals
        console.warn("NearbyHospitals: translation failed", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [preparedHospitals, i18n?.language]);

  const assurances = [
    {
      icon: ShieldCheck,
      title: "Privacy first",
      body: "Location access is session-based. We never store or share coordinates.",
    },
    {
      icon: AlertTriangle,
      title: "Clear messaging",
      body: "The consent card spells out why GPS is required so every migrant understands the benefit instantly.",
    },
  ];

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-sky-100 bg-white px-6 py-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
          {t("nearby.header", "Nearby Hospitals")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          {t("nearby.title", "Instantly locate the closest clinic")}
        </h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[32px] border border-sky-100 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("nearby.whyRequest.title", "Why we request location")}
          </h2>

          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={status === "requesting"}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {status === "requesting"
              ? t("nearby.actions.detecting", "Detecting location...")
              : t("nearby.actions.allow", "Allow secure location")}
          </button>
          <div className="space-y-3">
            {assurances.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t(`nearby.assurances.${title}.title`, title)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t(`nearby.assurances.${title}.body`, body)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {error && (
            <p className="text-sm font-semibold text-rose-600">
              {t(error) || error}
            </p>
          )}
          {status === "success" && position && (
            <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-700">
              <p className="text-sm font-semibold text-emerald-900">
                {t("nearby.locked", "Location locked")}
              </p>
              <p className="text-xs text-emerald-800">
                {t("nearby.coordinates", "Coordinates")}:{" "}
                {position[0].toFixed(6)}, {position[1].toFixed(6)} (WGS84)
              </p>
              {locationAccuracy !== null && (
                <p className="text-xs text-emerald-800">
                  {t("nearby.accuracy", "Accuracy")} : ±
                  {formatAccuracy(locationAccuracy)}
                </p>
              )}
              <p className="text-xs text-emerald-800">
                {isResolvingAddress &&
                  t("nearby.detectingArea", "Detected area: Resolving…")}
                {!isResolvingAddress &&
                  locationDetails &&
                  t("nearby.detectedArea", {
                    area: locationDetails.displayName,
                  })}
                {!isResolvingAddress &&
                  !locationDetails &&
                  t(
                    "nearby.detectedAreaFallback",
                    "Detected area: Not available, using raw coordinates"
                  )}
              </p>
              <button
                type="button"
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                onClick={() =>
                  window.open(
                    `https://www.gps-coordinates.net/?lat=${position[0]}&lng=${position[1]}`,
                    "_blank"
                  )
                }
              >
                {t("nearby.verifyGps", "Verify on GPS-Coordinates.net")}
              </button>
            </div>
          )}
        </div>
        {/* <div className="rounded-[32px] border border-slate-100 bg-slate-50/70 p-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">How it helps</p>
          <p className="mt-2">
            The map highlights facilities within roughly 15 km of your current pin. Directions open in Google Maps
            so you never have to type Malayalam addresses or landmark names.
          </p>
          <p className="mt-2">
            Close the panel any time — no background tracking runs after you exit, keeping migrants in full control
            of their data.
          </p>
        </div> */}
      </div>

      {position && (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-[32px] border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                  {t("nearby.map.header", "Live Map")}
                </p>
                <h3 className="text-xl font-semibold text-slate-900">
                  {t(
                    "nearby.map.title",
                    "Current location & hospitals within ~15 km"
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("nearby.map.centered", "Centered at")}{" "}
                  {position[0].toFixed(4)}, {position[1].toFixed(4)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchHospitals(position)}
                disabled={isFetchingHospitals}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingHospitals
                  ? t("nearby.map.refreshing", "Refreshing...")
                  : t("nearby.map.refresh", "Refresh list")}
              </button>
            </div>

            <div className="h-[520px] overflow-hidden rounded-[28px]">
              <MapContainer
                center={position}
                zoom={13}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} icon={userLocationIcon}>
                  <Popup>{t("nearby.map.youAreHere", "You are here")}</Popup>
                </Marker>

                {preparedHospitals.map((hospital) => (
                  <Marker
                    key={hospital.id ?? hospital.place_id}
                    position={[hospital.lat, hospital.lon]}
                  >
                    <Popup>
                      <p className="font-semibold">
                        {getTranslatedFor(hospital).shortName ||
                          hospital.shortName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getTranslatedFor(hospital).address || hospital.address}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        ~{hospital.distance.toFixed(1)} km{" "}
                        {t("nearby.map.away", "away")}
                      </p>
                      <button
                        type="button"
                        className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps?q=${hospital.lat},${hospital.lon}`,
                            "_blank"
                          )
                        }
                      >
                        {t("nearby.map.getDirections", "Get Directions")}
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
          <div className="space-y-3 rounded-[32px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {t("nearby.list.title", "Nearest facilities")}
              </h3>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {preparedHospitals.length} {t("nearby.list.results", "results")}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Using the same coordinates ({position[0].toFixed(4)},{" "}
              {position[1].toFixed(4)}) for distance calculations.
            </p>
            <div
              className="space-y-3 overflow-y-auto pr-2"
              style={{ maxHeight: "520px" }}
            >
              {preparedHospitals.map((hospital) => (
                <article
                  key={hospital.id ?? hospital.place_id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {getTranslatedFor(hospital).shortName || hospital.shortName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {getTranslatedFor(hospital).address || hospital.address}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                      <MapPin className="h-3 w-3 text-sky-500" />
                      {hospital.distance.toFixed(1)} {t("nearby.list.km", "km")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                      <Navigation className="h-3 w-3 text-emerald-500" />
                      {t("nearby.list.goInMaps", "Go in Google Maps")}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-2xl bg-sky-600 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm hover:bg-sky-500"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps?q=${hospital.lat},${hospital.lon}`,
                        "_blank"
                      )
                    }
                  >
                    {t("nearby.list.getDirections", "Get Directions")}
                  </button>
                </article>
              ))}
              {preparedHospitals.length === 0 && (
                <p className="text-sm text-slate-500">
                  {t(
                    "nearby.list.empty",
                    "We could not find hospitals within 15 km. Try refreshing or expanding your search radius in Google Maps."
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatAccuracy(meters) {
  if (meters === null || Number.isNaN(meters)) return "unknown";
  if (meters < 1000) return `${meters.toFixed(0)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
