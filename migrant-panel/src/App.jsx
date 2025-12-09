import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  UserRound,
  FileText,
  FlaskConical,
  LogOut,
  Hospital,
  MapPin,
  Languages,
  PlayCircle,
} from "lucide-react";
import { PatientsProvider } from "./context/PatientsContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import LabReportsPage from "./pages/LabReportsPage";
import LoginPage from "./pages/Login";
import LanguageSwitcher from "./components/LanguageSwitcher";
import NearbyHospitals from "./pages/NearbyHospitals";
import DemoVideoPage from "./pages/DemoVideoPage";
import { translateLocationField } from "./utils/locationTranslations";

const navItems = [
  {
    labelKey: "nav.dashboard",
    to: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    labelKey: "DemoVideo",
    to: "/demo-video",
    icon: PlayCircle, // You can import any icon
  },

  {
    labelKey: "nav.profile",
    to: "/profile",
    icon: UserRound,
  },
  {
    labelKey: "nav.prescriptions",
    to: "/prescriptions",
    icon: FileText,
  },
  {
    labelKey: "nav.labReports",
    to: "/lab-reports",
    icon: FlaskConical,
  },
  {
    labelKey: "nav.nearbyHospitals",
    to: "/nearby-hospitals",
    icon: MapPin,
  },
];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ShellLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="prescriptions" element={<PrescriptionsPage />} />
              <Route path="lab-reports" element={<LabReportsPage />} />
              <Route path="nearby-hospitals" element={<NearbyHospitals />} />
              <Route path="demo-video" element={<DemoVideoPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PatientsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { useNavigate } from "react-router-dom";

function ShellLayout() {
  const navigate = useNavigate();
  const { patient, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || "en").split("-")[0];
  // prefer mapped village if available, otherwise fall back to taluk
  const mappedDistrictHeader = translateLocationField(
    currentLang,
    "district",
    patient?.district
  );
  const mappedVillageHeader = translateLocationField(
    currentLang,
    "village",
    patient?.village || patient?.taluk
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleCancelLogout = () => setShowLogoutConfirm(false);
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <div className="min-h-screen bg-sky-50/70">
      <header className="sticky top-0 z-30 border-b border-sky-100/70 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 text-sky-600">
              <Hospital className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  JeevanRakshak
                </h1>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
                  {t("app.tagline")}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 text-right">
            <button
              onClick={() => navigate("/demo-video")}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-sky-50 transition"
            >
              <PlayCircle className="h-4 w-4 text-sky-600" />
              {t("app.idDemoVideo")}
            </button>

            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800">
              <UserRound className="h-4 w-4 text-sky-500" />
              {patient?.name || "Guest"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-sky-500" />
              {[
                mappedDistrictHeader || patient?.district,
                mappedVillageHeader || patient?.taluk,
              ]
                .filter(Boolean)
                .join(" · ") || t("app.locationFallback")}
            </span>
            <div className="rounded-2xl border border-sky-100 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-600">
              {t("app.idLabel")}:{" "}
              {patient?._id ? patient._id.slice(-6).toUpperCase() : "—"}
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-100 bg-white px-3 py-2">
              <Languages className="h-4 w-4 text-sky-500" aria-hidden="true" />
              <LanguageSwitcher
                ariaLabel={t("language.navbarLabel")}
                className="border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-700 shadow-none focus:ring-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={handleLogoutClick}
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              <LogOut className="h-4 w-4" />
              {t("logout.button")}
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full flex-col gap-6 px-4 pb-12 pt-8 lg:flex-row lg:items-start lg:px-8">
        <div className="w-full lg:w-80 lg:self-start lg:sticky lg:top-[6rem]">
          <div className="rounded-[32px] bg-gradient-to-b from-white/95 to-sky-50/80 p-4 shadow-sm ring-1 ring-sky-100 backdrop-blur">
            <nav className="flex flex-wrap gap-3 lg:flex-col lg:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "border-sky-500 bg-sky-600 text-white shadow"
                          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50"
                      }`
                    }
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      {t(item.labelKey)}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="flex-1 min-w-0 lg:min-h-[calc(100vh-8rem)]">
          <div className="space-y-8 pb-12">
            <Outlet />
          </div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-sky-100 bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-500">
                  {t("logout.confirmLabel")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {
                    t(
                      "logout.confirmHeading"
                    ) /* Ready to exit the Migrant Panel? */
                  }
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {t("logout.confirmMessage")}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                >
                  {t("logout.confirmAccept") /* Yes, log me out */}
                </button>
                <button
                  type="button"
                  onClick={handleCancelLogout}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {t("logout.confirmCancel") /* Stay signed in */}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
