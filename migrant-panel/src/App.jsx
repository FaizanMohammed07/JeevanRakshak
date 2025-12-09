import { useState } from "react";
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
import { ContractorProvider } from "./context/ContractorContext";
import { EmployerProvider, useEmployer } from "./context/EmployerContext";
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
import EmployerLogin from "./pages/EmployerLogin";
import EmployerSignup from "./pages/EmployerSignup";
import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerContractors from "./pages/EmployerContractors";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Employer Portal</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {employer?.name || "Employer"}
            </span>
            <button
              onClick={() => logout()}
              className="rounded-lg bg-red-600 px-3 py-1 text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 p-6">
        <aside className="w-60 hidden lg:block">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <nav className="flex flex-col gap-2">
              <NavLink
                to="/employer"
                end
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/employer/contractors"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Contractors
              </NavLink>
            </nav>
          </div>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ContractorLayout() {
  const { logout, contractor } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Contractor Portal</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {contractor?.name || "Partner"}
            </span>
            <button
              onClick={() => logout()}
              className="rounded-lg bg-red-600 px-3 py-1 text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full gap-6 p-6">
        <aside className="w-60 hidden lg:block">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <nav className="flex flex-col gap-2">
              <NavLink
                to="/contractor"
                end
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/contractor/patients"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Manage Patients
              </NavLink>
              <NavLink
                to="/contractor/status"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                Patient Status
              </NavLink>
            </nav>
          </div>
        </aside>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
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
    patient?.district
  );
  const mappedVillageHeader = translateLocationField(
    currentLang,
    "village",
    patient?.village || patient?.taluk
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
