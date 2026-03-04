import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { PatientsProvider } from "./context/PatientsContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ContractorProvider, useContractor } from "./context/ContractorContext";
import { EmployerProvider, useEmployer } from "./context/EmployerContext";
import { useTranslation } from "react-i18next";
import {
  Activity,
  BellRing,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Languages,
  LogOut,
  MapPin,
  Megaphone,
  PlayCircle,
  PieChart,
  ShieldCheck,
  UserRound,
  Users,
  Hospital,
} from "lucide-react";

// --- Page Imports ---
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import LabReportsPage from "./pages/LabReportsPage";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import NearbyHospitals from "./pages/NearbyHospitals";
import DemoVideoPage from "./pages/DemoVideoPage";
import ContractorDashboard from "./pages/ContractorDashboard";
import ContractorPatients from "./pages/ContractorPatients";
import ContractorPatientStatus from "./pages/ContractorPatientStatus";
import ManageWorkers from "./pages/ManageWorkers";
import EditWorker from "./pages/EditWorker";
import EmployerLogin from "./pages/EmployerLogin";
import EmployerSignup from "./pages/EmployerSignup";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerContractors from "./pages/EmployerContractors";
import EmployerContractorDetails from "./pages/EmployerContractorDetails";

// --- Component Imports ---
import LanguageSwitcher from "./components/LanguageSwitcher";
import { translateLocationField } from "./utils/locationTranslations";

const navItems = [
  { labelKey: "nav.dashboard", to: "/", icon: LayoutDashboard, end: true },
  { labelKey: "DemoVideo", to: "/demo-video", icon: PlayCircle },
  { labelKey: "nav.profile", to: "/profile", icon: UserRound },
  { labelKey: "nav.prescriptions", to: "/prescriptions", icon: FileText },
  { labelKey: "nav.labReports", to: "/lab-reports", icon: FlaskConical },
  { labelKey: "nav.nearbyHospitals", to: "/nearby-hospitals", icon: MapPin },
];

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ================= PATIENT PORTAL ================= */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {/* CRITICAL: PatientsProvider is now scoped only to patient routes */}
                <PatientsProvider>
                  <ShellLayout />
                </PatientsProvider>
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

          {/* ================= CONTRACTOR PORTAL ================= */}
          <Route
            path="/contractor"
            element={
              <ContractorProtectedRoute>
                <ContractorProvider>
                  <ContractorLayout />
                </ContractorProvider>
              </ContractorProtectedRoute>
            }
          >
            <Route index element={<ContractorDashboard />} />
            <Route path="patients" element={<ContractorPatients />} />
            <Route path="status" element={<ContractorPatientStatus />} />
            <Route path="manage-workers" element={<ManageWorkers />} />
            <Route path="manage-workers/:workerId" element={<EditWorker />} />
          </Route>

          {/* ================= EMPLOYER PORTAL ================= */}
          <Route
            path="/employer/login"
            element={
              <EmployerProvider>
                <EmployerLogin />
              </EmployerProvider>
            }
          />
          <Route
            path="/employer/signup"
            element={
              <EmployerProvider>
                <EmployerSignup />
              </EmployerProvider>
            }
          />
          <Route
            path="/employer"
            element={
              <EmployerProvider>
                <EmployerProtectedRoute>
                  <EmployerLayout />
                </EmployerProtectedRoute>
              </EmployerProvider>
            }
          >
            <Route index element={<EmployerDashboard />} />
            <Route path="contractors" element={<EmployerContractors />} />
            <Route
              path="contractors/:contractorId"
              element={<EmployerContractorDetails />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

/* ========================================================================
                            HELPER COMPONENTS
   ======================================================================== */

// --- 1. ROUTE GUARDS ---

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function ContractorProtectedRoute({ children }) {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated || role !== "contractor")
    return <Navigate to="/login" replace />;
  return children;
}

function EmployerProtectedRoute({ children }) {
  const { loading, employer } = useEmployer();
  if (loading) return <LoadingScreen />;
  if (!employer) return <Navigate to="/employer/login" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
      Checking session...
    </div>
  );
}

// --- 2. LAYOUTS ---

function EmployerLayout() {
  const { logout, employer } = useEmployer();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [heartbeat, setHeartbeat] = useState(new Date());
  const userName = employer?.name || "Mohammed Faizan Ali";

  useEffect(() => {
    const timer = setInterval(() => setHeartbeat(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const employerNav = [
    { label: "Dashboard", to: "/employer", icon: LayoutDashboard },
    { label: "Contractors", to: "/employer/contractors", icon: Users },
  ];

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-3 text-white shadow-2xl backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-2xl font-black tracking-tight">JeevanRakshak</p>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-200">
              Employer portal
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
              <ShieldCheck className="h-3 w-3" /> Trusted
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
              <PieChart className="h-3 w-3" /> Insights
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]">
            <span className="flex items-center gap-1 text-white/80">
              <UserRound className="h-3 w-3" /> {userName}
            </span>
            <span className="text-white/80">
              Live{" "}
              {heartbeat.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/70"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 px-4 py-8 md:px-6">
        <aside className="hidden lg:block lg:w-80">
          <div className="sticky top-[6rem] space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 text-white shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                Employer cockpit
              </p>
              <h3 className="mt-2 text-lg font-semibold leading-tight">
                {employer?.name ?? "JeevanRakshak Employer"}
              </h3>
              <p className="mt-2 text-xs uppercase tracking-[0.3em] text-white/60">
                Sync{" "}
                {heartbeat.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <nav className="space-y-3 rounded-3xl border border-slate-900 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 text-white shadow-xl">
              {employerNav.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/employer"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "bg-indigo-500 text-white"
                        : "text-white/80 hover:bg-white/10"
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Confirm logout
            </p>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">
              Are you sure?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Logging out will close your employer session. Any unsent
              broadcasts will remain in draft.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const contractorNav = [
  { label: "Dashboard", to: "/contractor", icon: LayoutDashboard, end: true },
  {
    label: "Linked patients",
    to: "/contractor/patients",
    icon: Users,
  },
  {
    label: "Patient status",
    to: "/contractor/status",
    icon: Activity,
  },
  {
    label: "Worker registry",
    to: "/contractor/manage-workers",
    icon: ClipboardList,
  },
];

function ContractorLayout() {
  const { logout, contractor, workers, fetchProfile } = useContractor();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [heartbeat, setHeartbeat] = useState(new Date());

  useEffect(() => {
    fetchProfile().catch(() => {});
  }, [fetchProfile]);

  useEffect(() => {
    const timer = setInterval(() => setHeartbeat(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const alerts = workers?.filter((w) => w?.contagiousAlert?.active).length ?? 0;
  const workerTotal = workers?.length ?? 0;

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-4 shadow-2xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-200">
              Field operations
            </p>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {contractor?.name || "JeevanRakshak Contractor"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/80">
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <Megaphone className="h-3 w-3 text-emerald-200" />
              Alert ready
            </span>
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
              <BellRing className="h-3 w-3 text-amber-200" />
              {alerts || "0"} alerts
            </span>
            <span>
              Live{" "}
              {heartbeat.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/70"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 px-4 py-8 md:px-6">
        <aside className="hidden lg:block lg:w-72">
          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 text-white shadow-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                Contractor cockpit
              </p>
              <h3 className="mt-3 text-lg font-semibold">
                {contractor?.companyName || "Field partner"}
              </h3>
              <p className="mt-3 text-xs uppercase tracking-[0.3em] text-white/50">
                {workerTotal} linked patients · {alerts} live alerts
              </p>
            </div>
            <nav className="space-y-3 rounded-[28px] border border-slate-900 bg-slate-950/60 p-4 shadow-lg">
              {contractorNav.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                      isActive
                        ? "bg-emerald-500/80 text-white"
                        : "text-white/70 hover:bg-white/10"
                    }`
                  }
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="rounded-[28px] border border-slate-900 bg-gradient-to-br from-emerald-500/20 to-slate-900 p-4 text-xs text-white/70">
              <p className="text-white/90">Realtime telemetry</p>
              <p className="mt-2 text-sm text-white">
                {workerTotal} patients tracked · {alerts} active alerts ·{" "}
                {heartbeat.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                sync
              </p>
            </div>
          </div>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-slate-950/90 p-6 text-white shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
              Confirm logout
            </p>
            <h3 className="mt-4 text-xl font-semibold">
              Exit the contractor cockpit
            </h3>
            <p className="mt-2 text-sm text-white/60">
              Logging out will stop live updates and clear session memory.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/70"
              >
                Stay logged in
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShellLayout() {
  const navigate = useNavigate();
  const { patient, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || "en").split("-")[0];

  const mappedDistrictHeader = translateLocationField(
    currentLang,
    "district",
    patient?.district,
  );
  const mappedVillageHeader = translateLocationField(
    currentLang,
    "village",
    patient?.village || patient?.taluk,
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
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
              <h2 className="text-2xl font-semibold text-slate-900">
                {t("logout.confirmHeading")}
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {t("logout.confirmAccept")}
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  {t("logout.confirmCancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
