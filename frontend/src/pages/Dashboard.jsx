import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchDashboardSnapshot,
  fetchDoctorAnnouncements,
} from "../lib/dataClient";
import DashboardLayout from "../components/DashboardLayout";
import {
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
} from "lucide-react";
import api from "../api/axios";

export default function Dashboard() {
  const { doctor } = useAuth();
  const [stats, setStats] = useState({
    todayPatients: 0,
    pendingFollowUps: 0,
    chronicAlerts: 0,
    recentPrescriptions: 0,
    weeklyTrend: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroAnnouncements, setHeroAnnouncements] = useState([]);
  const [activeAnnouncementIndex, setActiveAnnouncementIndex] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (doctor) {
      loadDashboardData();
      loadHeroAnnouncements();
    }
  }, [doctor]);

  const loadDashboardData = async () => {
    if (!doctor) return;
    try {
      setLoading(true);
      const res = await api.get(`/doctors/${doctor._id}/prescriptions/today`);
      // setTodayCount(res.data.count);
      setTodayCount(0);
      const snapshot = await fetchDashboardSnapshot(doctor.id);
      setStats(snapshot.stats);
      setRecentActivity(snapshot.recentActivity);
      setAlerts(snapshot.alerts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeroAnnouncements = async () => {
    try {
      const payload = await fetchDoctorAnnouncements("Doctors");
      setHeroAnnouncements(Array.isArray(payload) ? payload : []);
      setActiveAnnouncementIndex(0);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setHeroAnnouncements([]);
    }
  };

  const statCards = [
    {
      title: "Today's Patients",
      value: todayCount,
      icon: Users,
      color: "blue",
      // trend: "+" + stats.weeklyTrend + "%",
    },
    // {
    //   title: "Pending Follow-ups",
    //   value: stats.pendingFollowUps,
    //   icon: Calendar,
    //   color: "orange",
    //   trend: "Due today",
    // },
    // {
    //   title: "Chronic Alerts",
    //   value: stats.chronicAlerts,
    //   icon: Activity,
    //   color: "red",
    //   trend: "Active cases",
    // },
    // {
    //   title: "Weekly Prescriptions",
    //   value: stats.recentPrescriptions,
    //   icon: FileText,
    //   color: "green",
    //   trend: "Last 7 days",
    // },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  useEffect(() => {
    if (heroAnnouncements.length <= 1) return undefined;
    const intervalId = setInterval(() => {
      setActiveAnnouncementIndex(
        (prev) => (prev + 1) % heroAnnouncements.length
      );
    }, 8000);
    return () => clearInterval(intervalId);
  }, [heroAnnouncements]);

  const formatAnnouncementTime = (timestamp) => {
    if (!timestamp) return "--";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("en-IN", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  const handleAnnouncementNav = (direction) => {
    if (heroAnnouncements.length <= 1) return;
    setActiveAnnouncementIndex((prev) => {
      const total = heroAnnouncements.length;
      return (prev + direction + total) % total;
    });
  };

  const activeAnnouncement = heroAnnouncements[activeAnnouncementIndex];
  const hasHeroAnnouncement = Boolean(
    heroAnnouncements.length && activeAnnouncement
  );

  const diseaseInsights = useMemo(() => {
    if (!alerts.length) return [];
    const counts = alerts.reduce((map, alert) => {
      const key = alert.title || alert.message || "Unknown Alert";
      const normalized = key.trim();
      const entry = map.get(normalized) || { title: normalized, count: 0 };
      entry.count += 1;
      map.set(normalized, entry);
      return map;
    }, new Map());
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [alerts]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, Dr. {doctor?.name}</p>
        </div>

        {/* {hasHeroAnnouncement ? (
          <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 text-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                  Government Broadcast
                </p>
                <h2 className="text-2xl font-semibold mt-1">
                  {activeAnnouncement.title}
                </h2>
              </div>
              <span className="text-sm font-semibold bg-white/15 px-3 py-1 rounded-full">
                {activeAnnouncement.audience} Hero
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              {activeAnnouncement.message}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/80">
              <span>Priority: {activeAnnouncement.priority || "--"}</span>
              <span>
                {formatAnnouncementTime(activeAnnouncement.timestamp)}
              </span>
              <span>
                {activeAnnouncementIndex + 1} / {heroAnnouncements.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {heroAnnouncements.map((item, index) => (
                  <span
                    key={item.id || index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === activeAnnouncementIndex
                        ? "bg-white"
                        : "bg-white/40"
                    }`}
                  ></span>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAnnouncementNav(-1)}
                  className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold"
                  disabled={heroAnnouncements.length <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => handleAnnouncementNav(1)}
                  className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold"
                  disabled={heroAnnouncements.length <= 1}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-blue-700 text-white rounded-2xl shadow-xl p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Disease Watch
                </p>
                <h2 className="text-2xl font-semibold mt-1">
                  Live spread insights
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  No hero broadcasts right now. We surfaced the hottest field
                  alerts so you can prioritize rounds.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10">
                Auto-generated
              </span>
            </div>
            {diseaseInsights.length === 0 ? (
              <p className="text-sm text-white/70">
                Field alerts are quiet. Keep logging cases to power this view.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {diseaseInsights.map((insight) => (
                  <div
                    key={insight.title}
                    className="bg-white/10 rounded-xl p-4"
                  >
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="text-3xl font-bold mt-2">{insight.count}</p>
                    <p className="text-xs text-white/70">alerts logged today</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>View outbreak log in Alerts</span>
              <button
                type="button"
                onClick={loadHeroAnnouncements}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 font-semibold"
              >
                Refresh Broadcasts
              </button>
            </div>
          </div>
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            const bgColor = `bg-${card.color}-50`;
            const textColor = `text-${card.color}-600`;
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <Icon className={`h-6 w-6 ${textColor}`} />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {card.value}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                <p className="text-xs text-gray-500">{card.trend}</p>
              </div>
            );
          })}
        </div>

        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Activity
              </h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {prescription.migrant_workers?.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {prescription.diagnosis}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(prescription.visit_date).toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Active Alerts</h2>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active alerts
                </p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(
                      alert.severity
                    )}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{alert.title}</h3>
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                      {alert.action_required && (
                        <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-50 rounded">
                          ACTION
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div> */}

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Quick Actions</h3>
              <p className="text-blue-100 mb-4">
                Access frequently used features
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/search-patient"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Search Patient
                </a>
                {/* <a
                  href="/previous-records"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
                >
                  Previous Records
                </a> */}
                <a
                  href="/settings"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-400 transition-colors"
                >
                  Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
