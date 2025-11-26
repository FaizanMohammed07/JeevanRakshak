import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  Calendar,
  X,
  ClipboardList,
  UserCheck,
  Send,
  Clock,
  BellRing,
} from "lucide-react";

function OutbreakAlerts() {
  const navigate = useNavigate();
  const { alertId } = useParams();
  const officerDirectory = {
    Ernakulam: [
      "Officer Anita Mathew",
      "Officer Dileep Kumar",
      "Officer Sara Jose",
    ],
    Thiruvananthapuram: ["Officer Arya Menon", "Officer Sunil Raj"],
    Kozhikode: ["Officer Faizal Rahman", "Officer Neethu P"],
    Thrissur: ["Officer Riya Francis", "Officer Jithin P"],
    Kollam: ["Officer Robin Lal"],
    Palakkad: ["Officer Devika Unni"],
    default: ["Officer on-call"],
  };

  const [actionState, setActionState] = useState({});
  const [responseTick, setResponseTick] = useState(Date.now());
  const [pendingOfficer, setPendingOfficer] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setResponseTick(Date.now()), 15000);
    return () => clearInterval(interval);
  }, []);

  const alerts = useMemo(
    () => [
      {
        id: 1,
        title: "Dengue Outbreak",
        disease: "Dengue Fever",
        camp: "Kochi Construction Camp 3",
        district: "Ernakulam",
        severity: "red",
        date: "2 hours ago",
        details: "12 new cases reported in the last 24 hours",
        immediateActions: [
          "Activate fever clinics and IV fluid support",
          "Deploy fogging units within 5 km radius",
          "Collect larval samples for entomology lab",
        ],
        slaMinutes: 30,
      },
      {
        id: 2,
        title: "Malaria Cases Rising",
        disease: "Malaria",
        camp: "Trivandrum Labor Camp 12",
        district: "Thiruvananthapuram",
        severity: "orange",
        date: "5 hours ago",
        details: "8 confirmed cases, vector control measures initiated",
        immediateActions: [
          "Issue rapid diagnostic kits to PHCs",
          "Replenish Artemisinin-based therapy",
          "Activate community awareness leaders",
        ],
        slaMinutes: 45,
      },
      {
        id: 3,
        title: "Typhoid Detection",
        disease: "Typhoid",
        camp: "Kozhikode Camp Site A",
        district: "Kozhikode",
        severity: "yellow",
        date: "1 day ago",
        details: "Water supply contamination suspected",
        immediateActions: [
          "Switch camp to emergency water tankers",
          "Collect stool samples for lab confirmation",
          "Deploy hygiene volunteers for chlorination",
        ],
        slaMinutes: 60,
      },
      {
        id: 4,
        title: "Respiratory Infection Cluster",
        disease: "Upper Respiratory Infection",
        camp: "Thrissur Industrial Camp",
        district: "Thrissur",
        severity: "red",
        date: "3 hours ago",
        details: "15 cases reported, poor ventilation identified",
        immediateActions: [
          "Set up isolation bay with oxygen support",
          "Inspect dorm ventilation and air circulation",
          "Coordinate antiviral stock with district hospital",
        ],
        slaMinutes: 20,
      },
      {
        id: 5,
        title: "Gastroenteritis Outbreak",
        disease: "Gastroenteritis",
        camp: "Kollam Seafront Camp",
        district: "Kollam",
        severity: "orange",
        date: "8 hours ago",
        details: "Food safety inspection scheduled",
        immediateActions: [
          "Seal suspect kitchen block",
          "Issue ORS + probiotic packs",
          "Collect food and water samples",
        ],
        slaMinutes: 40,
      },
      {
        id: 6,
        title: "Skin Infection Spread",
        disease: "Bacterial Skin Infection",
        camp: "Palakkad Agricultural Camp",
        district: "Palakkad",
        severity: "yellow",
        date: "2 days ago",
        details: "Hygiene awareness program initiated",
        immediateActions: [
          "Distribute medicated soaps and ointments",
          "Inspect bathing water storage",
          "Schedule dermatology tele-consult",
        ],
        slaMinutes: 70,
      },
    ],
    []
  );

  const activeAlert = useMemo(() => {
    if (!alertId) return null;
    const parsedId = Number(alertId);
    return alerts.find((alert) => alert.id === parsedId) ?? null;
  }, [alertId, alerts]);

  useEffect(() => {
    if (!alertId || activeAlert) return;
    navigate("/alerts", { replace: true });
  }, [alertId, activeAlert, navigate]);

  const severityConfig = {
    red: {
      badge: "bg-red-100 text-red-800 border-red-300",
      border: "border-l-red-500",
      label: "CRITICAL",
    },
    orange: {
      badge: "bg-orange-100 text-orange-800 border-orange-300",
      border: "border-l-orange-500",
      label: "MODERATE",
    },
    yellow: {
      badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
      border: "border-l-yellow-500",
      label: "LOW",
    },
  };

  const getActionState = (id) => actionState[id] ?? {};

  const activeAlertState = activeAlert ? getActionState(activeAlert.id) : null;
  const activeOfficers = activeAlert
    ? officerDirectory[activeAlert.district] || officerDirectory.default
    : [];

  useEffect(() => {
    setPendingOfficer(activeAlertState?.officer ?? "");
  }, [activeAlert?.id, activeAlertState?.officer]);

  const handleOfficerAssign = (alertId, officer) => {
    if (!officer) return;
    setActionState((prev) => ({
      ...prev,
      [alertId]: {
        ...prev[alertId],
        officer,
        officerAssignedAt: new Date().toISOString(),
      },
    }));
  };

  const handleTriggerNotification = (alertId) => {
    setActionState((prev) => ({
      ...prev,
      [alertId]: {
        ...prev[alertId],
        notificationSentAt: new Date().toISOString(),
      },
    }));
  };

  const handleResponseTimer = (alertId) => {
    setActionState((prev) => ({
      ...prev,
      [alertId]: {
        ...prev[alertId],
        responseStart: prev[alertId]?.responseStart ?? Date.now(),
      },
    }));
  };

  const getElapsedMinutes = (alertId) => {
    const start = actionState[alertId]?.responseStart;
    if (!start) return 0;
    return Math.max(0, Math.round((responseTick - start) / 60000));
  };

  const formatTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Outbreak Alerts
        </h2>
        <p className="text-gray-600">
          Monitor and respond to disease outbreaks
        </p>
      </div>

      {activeAlert && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-blue-600 tracking-wide">
              Selected alert
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {activeAlert.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Target camp:{" "}
              <span className="font-semibold">{activeAlert.camp}</span>
            </p>
            <p className="text-sm text-gray-600">
              Severity: {severityConfig[activeAlert.severity].label}
            </p>
          </div>
          <button
            onClick={() => navigate("/alerts")}
            className="p-2 rounded-lg hover:bg-blue-100 text-blue-700"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500 tracking-wide">
              Emergency Alerts & Action System
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              Immediate field coordination
            </h3>
          </div>
          <div className="text-xs text-gray-500">
            {activeAlert ? (
              <span>
                SLA target: respond within {activeAlert.slaMinutes} min
              </span>
            ) : (
              <span>Select an alert to unlock response controls</span>
            )}
          </div>
        </div>

        {activeAlert ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="text-blue-600" size={20} />
                <p className="text-sm font-semibold text-gray-900">
                  Immediate action steps
                </p>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                {activeAlert.immediateActions.map((step, index) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="text-emerald-600" size={20} />
                <p className="text-sm font-semibold text-gray-900">
                  Assign field officer
                </p>
              </div>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                value={pendingOfficer}
                onChange={(event) => setPendingOfficer(event.target.value)}
              >
                <option value="" disabled>
                  Select on-ground lead
                </option>
                {activeOfficers.map((officer) => (
                  <option key={officer}>{officer}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                {activeAlertState?.officer
                  ? `Assigned to ${activeAlertState.officer} at ${
                      activeAlertState.officerAssignedAt
                        ? formatTimestamp(activeAlertState.officerAssignedAt)
                        : "just now"
                    }`
                  : "No officer locked in yet"}
              </p>
              <button
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400"
                onClick={() =>
                  handleOfficerAssign(activeAlert.id, pendingOfficer)
                }
                disabled={!pendingOfficer}
              >
                Lock Assignment
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <BellRing className="text-orange-500" size={20} />
                  <p className="text-sm font-semibold text-gray-900">
                    District notification
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Push alert to {activeAlert.district} control room and DDMA
                  WhatsApp channel.
                </p>
                <button
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
                    activeAlertState?.notificationSentAt
                      ? "bg-gray-100 text-gray-500"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  onClick={() => handleTriggerNotification(activeAlert.id)}
                  disabled={Boolean(activeAlertState?.notificationSentAt)}
                >
                  <Send size={18} />
                  {activeAlertState?.notificationSentAt
                    ? `Sent ${formatTimestamp(
                        activeAlertState.notificationSentAt
                      )}`
                    : "Trigger district notification"}
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-purple-600" size={20} />
                  <p className="text-sm font-semibold text-gray-900">
                    Response time tracker
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {activeAlertState?.responseStart
                    ? `Live clock running for ${getElapsedMinutes(
                        activeAlert.id
                      )} min`
                    : "Clock not started"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>Target SLA: {activeAlert.slaMinutes} min</span>
                  <span>
                    {activeAlertState?.responseStart
                      ? `Started ${formatTimestamp(
                          activeAlertState.responseStart
                        )}`
                      : "Awaiting start"}
                  </span>
                </div>
                <button
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700"
                  onClick={() => handleResponseTimer(activeAlert.id)}
                >
                  Start / View Response Clock
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 border border-dashed border-gray-200 rounded-lg text-sm text-gray-500">
            Choose an alert to auto-populate action steps, assign the nearest
            officer, notify districts, and track response time against the SLA.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Critical: 2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Moderate: 2
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm font-medium text-gray-700">Low: 2</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Filter by Severity
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Filter by District
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const isActive = activeAlert?.id === alert.id;
          return (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-md border-l-4 ${
                severityConfig[alert.severity].border
              } transition-shadow ${
                isActive ? "ring-2 ring-blue-200" : "hover:shadow-lg"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle
                        className={`text-${alert.severity}-600`}
                        size={24}
                      />
                      <h3 className="text-xl font-bold text-gray-900">
                        {alert.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          severityConfig[alert.severity].badge
                        }`}
                      >
                        {severityConfig[alert.severity].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Disease:</span>{" "}
                      {alert.disease}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-semibold">Location:</span>{" "}
                      {alert.camp}
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
                      {alert.details}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={16} />
                      <span>{alert.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Mark as Resolved
                  </button>
                  <button
                    className="px-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => navigate(`/alerts/${alert.id}`)}
                  >
                    View Details
                  </button>
                  <button className="px-6 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Assign Team
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OutbreakAlerts;
