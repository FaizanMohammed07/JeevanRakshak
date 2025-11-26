import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Tent,
  Users,
  MapPin,
  AlertTriangle,
  X,
  UserCheck,
  Activity,
  Building2,
  Megaphone,
  CheckCircle,
} from "lucide-react";
import { slugify } from "../utils/slugify";

const hospitalDirectory = {
  Ernakulam: {
    name: "Ernakulam Govt. Medical College",
    distance: "8 km",
    hotline: "0484-2660601",
  },
  Thiruvananthapuram: {
    name: "Trivandrum Medical College",
    distance: "6 km",
    hotline: "0471-2443152",
  },
  Kozhikode: {
    name: "Kozhikode Beach Hospital",
    distance: "5 km",
    hotline: "0495-2765353",
  },
  Thrissur: {
    name: "Jubilee Mission Hospital",
    distance: "4 km",
    hotline: "0487-2432200",
  },
  Kollam: {
    name: "Kollam District Hospital",
    distance: "9 km",
    hotline: "0474-2792345",
  },
  Palakkad: {
    name: "Palakkad District Hospital",
    distance: "7 km",
    hotline: "0491-2506000",
  },
  Default: {
    name: "State General Hospital, Kerala",
    distance: "--",
    hotline: "0471-2330000",
  },
};

function CampManagement() {
  const navigate = useNavigate();
  const { campSlug } = useParams();

  const camps = useMemo(
    () => [
      {
        id: 1,
        name: "Kochi Construction Camp 3",
        district: "Ernakulam",
        population: 450,
        risk: "high",
        sick: 23,
        vaccinated: 68,
      },
      {
        id: 2,
        name: "Trivandrum Labor Camp 12",
        district: "Thiruvananthapuram",
        population: 320,
        risk: "medium",
        sick: 12,
        vaccinated: 85,
      },
      {
        id: 3,
        name: "Kozhikode Camp Site A",
        district: "Kozhikode",
        population: 280,
        risk: "low",
        sick: 5,
        vaccinated: 92,
      },
      {
        id: 4,
        name: "Thrissur Industrial Camp",
        district: "Thrissur",
        population: 520,
        risk: "high",
        sick: 31,
        vaccinated: 62,
      },
      {
        id: 5,
        name: "Kollam Seafront Camp",
        district: "Kollam",
        population: 180,
        risk: "low",
        sick: 3,
        vaccinated: 95,
      },
      {
        id: 6,
        name: "Palakkad Agricultural Camp",
        district: "Palakkad",
        population: 390,
        risk: "medium",
        sick: 15,
        vaccinated: 78,
      },
    ],
    []
  );

  const [selectedCamp, setSelectedCamp] = useState(null);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    audience: "Doctors",
  });
  const [announcementFeed, setAnnouncementFeed] = useState([
    {
      id: 1,
      title: "Monsoon Hygiene Drive",
      message: "Remind all patients to use purified drinking water at camps.",
      audience: "Patients",
      timestamp: "08:30 IST",
    },
    {
      id: 2,
      title: "Telemedicine Slots",
      message: "Doctors to open evening tele OP slots for Thrissur cluster.",
      audience: "Doctors",
      timestamp: "Yesterday",
    },
  ]);
  const [lastTransfer, setLastTransfer] = useState(null);

  useEffect(() => {
    if (!campSlug) {
      setSelectedCamp(null);
      return;
    }
    const match = camps.find((camp) => slugify(camp.name) === campSlug);
    if (!match) {
      setSelectedCamp(null);
      navigate("/camps", { replace: true });
      return;
    }
    setSelectedCamp(match);
  }, [campSlug, camps, navigate]);

  const openCampDetails = (camp) => {
    setSelectedCamp(camp);
    navigate(`/camps/${slugify(camp.name)}`);
  };

  const closeCampDetails = () => {
    setSelectedCamp(null);
    navigate("/camps");
  };

  const riskColors = {
    high: "bg-red-100 text-red-800 border-red-300",
    medium: "bg-orange-100 text-orange-800 border-orange-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };

  const summary = useMemo(() => {
    const totalPopulation = camps.reduce(
      (sum, camp) => sum + camp.population,
      0
    );
    const totalSick = camps.reduce((sum, camp) => sum + camp.sick, 0);
    const avgVaccination = Math.round(
      camps.reduce((sum, camp) => sum + camp.vaccinated, 0) / camps.length
    );
    const highRiskCount = camps.filter((camp) => camp.risk === "high").length;
    const topDistrict = camps.reduce(
      (prev, curr) => (curr.sick > prev.sick ? curr : prev),
      camps[0]
    );
    const urgentAlerts = camps
      .filter((camp) => camp.risk !== "low")
      .sort((a, b) => b.sick - a.sick)
      .slice(0, 4);

    return {
      metrics: [
        {
          label: "Total Population",
          value: totalPopulation.toLocaleString(),
          subline: `${totalSick} currently sick`,
          icon: Users,
          accent: "text-blue-600 bg-blue-100",
        },
        {
          label: "High-Risk Camps",
          value: highRiskCount,
          subline: "Requires field inspection",
          icon: AlertTriangle,
          accent: "text-red-600 bg-red-100",
        },
        {
          label: "Avg. Vaccination",
          value: `${avgVaccination}%`,
          subline: "Goal: 85%+",
          icon: UserCheck,
          accent: "text-green-600 bg-green-100",
        },
      ],
      hotspot: topDistrict,
      urgentAlerts,
    };
  }, [camps]);

  const transferQueue = useMemo(() => {
    return camps
      .filter(
        (camp) => camp.risk === "high" || camp.sick / camp.population > 0.08
      )
      .map((camp) => ({
        ...camp,
        hospital: hospitalDirectory[camp.district] || hospitalDirectory.Default,
      }));
  }, [camps]);

  const handleTransfer = (camp) => {
    setLastTransfer({
      campName: camp.name,
      hospitalName: camp.hospital.name,
    });
  };

  const handleAnnouncementSubmit = (event) => {
    event.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      return;
    }
    setAnnouncementFeed((prev) => [
      {
        id: Date.now(),
        title: announcementForm.title,
        message: announcementForm.message,
        audience: announcementForm.audience,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
    setAnnouncementForm({
      title: "",
      message: "",
      audience: announcementForm.audience,
    });
    setAnnouncementModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Migrant Camp Management
          </h2>
          <p className="text-gray-600">
            Monitor and manage migrant camps across Kerala
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last sync:{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <button
          onClick={() => setAnnouncementModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
        >
          <Megaphone size={18} />
          Broadcast Announcement
        </button>
      </div>

      {lastTransfer && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-sm text-green-800">
          <CheckCircle size={18} />
          Transfer request sent to {lastTransfer.hospitalName} for{" "}
          {lastTransfer.campName}. Hospital triage team notified.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summary.metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-gray-500">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-400">{metric.subline}</p>
              </div>
              <div className={`p-3 rounded-full ${metric.accent}`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="text-blue-600" size={24} />
            <div>
              <p className="text-xs uppercase text-blue-600 tracking-wide">
                Hotspot District
              </p>
              <h3 className="text-xl font-bold text-gray-900">
                {summary.hotspot?.district}
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{summary.hotspot?.name}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900">
              {summary.hotspot?.sick} sick
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                riskColors[summary.hotspot?.risk]
              }`}
            >
              {summary.hotspot?.risk.toUpperCase()} RISK
            </span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Urgent Warnings
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Field response queue
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {summary.urgentAlerts.length} camps
            </span>
          </div>
          <div className="space-y-3">
            {summary.urgentAlerts.map((camp) => (
              <div
                key={camp.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-900">{camp.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {camp.district}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">
                    {camp.sick} sick
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      riskColors[camp.risk]
                    }`}
                  >
                    {camp.risk.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-blue-600" size={22} />
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Hospital Coordination
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Camps queued for referrals
              </h3>
            </div>
          </div>
          {transferQueue.length === 0 ? (
            <p className="text-sm text-gray-500">
              All camps are stable right now.
            </p>
          ) : (
            <div className="space-y-4">
              {transferQueue.map((camp) => (
                <div
                  key={camp.id}
                  className="border border-gray-100 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{camp.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {camp.district}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        riskColors[camp.risk]
                      }`}
                    >
                      {camp.risk.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Recommend: {camp.hospital.name}
                      </p>
                      <p>
                        {camp.hospital.distance} • Hotline{" "}
                        {camp.hospital.hotline}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTransfer(camp)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                    >
                      Notify Hospital
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">
                Announcement Feed
              </p>
              <h3 className="text-lg font-bold text-gray-900">
                Live hero banner pushes
              </h3>
            </div>
            <span className="text-xs text-gray-500">Doctor & Patient apps</span>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {announcementFeed.map((item) => (
              <div
                key={item.id}
                className="border border-gray-100 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    {item.audience} hero
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{item.message}</p>
                <p className="text-xs text-gray-400">{item.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {camps.map((camp) => (
          <div
            key={camp.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tent className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{camp.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin size={14} />
                    {camp.district}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <Users size={16} />
                  Population
                </span>
                <span className="font-semibold text-gray-900">
                  {camp.population}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Risk Level
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    riskColors[camp.risk]
                  }`}
                >
                  {camp.risk.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={() => openCampDetails(camp)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Camp Details
            </button>
          </div>
        ))}
      </div>

      {announcementModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Broadcast announcement
                </h3>
                <p className="text-sm text-gray-500">
                  Goes live on the selected hero page instantly.
                </p>
              </div>
              <button
                onClick={() => setAnnouncementModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme / Campaign Title
                </label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Eg: Free Fever Screening Week"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={announcementForm.message}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Details that should pop on the hero banner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Audience hero page
                </label>
                <select
                  value={announcementForm.audience}
                  onChange={(e) =>
                    setAnnouncementForm((prev) => ({
                      ...prev,
                      audience: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option>Doctors</option>
                  <option>Patients</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Will surface on the {announcementForm.audience.toLowerCase()}{" "}
                  hero carousel + push alerts.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Push Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCamp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">Camp Details</h3>
              <button
                onClick={closeCampDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Tent className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedCamp.name}
                    </h4>
                    <p className="text-gray-600 flex items-center gap-1">
                      <MapPin size={16} />
                      {selectedCamp.district} District
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Total Population
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedCamp.population}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Sick Migrants</p>
                    <p className="text-2xl font-bold text-red-900">
                      {selectedCamp.sick}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Vaccination Progress
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {selectedCamp.vaccinated}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedCamp.vaccinated}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Risk Level
                  </p>
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold border ${
                      riskColors[selectedCamp.risk]
                    }`}
                  >
                    {selectedCamp.risk.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <AlertTriangle size={20} />
                  Set as High Risk
                </button>
                <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
                  <UserCheck size={20} />
                  Assign Health Officer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampManagement;
