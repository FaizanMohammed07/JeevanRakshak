import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Search,
  FileText,
  Bell,
  Calendar,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ScanLine,
} from "lucide-react";
import { useDoctors } from "../context/DoctorsContext";

export default function DashboardLayout({ children }) {
  const { doctor, signOut } = useDoctors();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const navigation = [
    { name: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { name: "Search Patient", to: "/search-patient", icon: Search },
    // { name: "Alerts", to: "/alerts", icon: Bell },
    // { name: "Follow-ups", to: "/follow-ups", icon: Calendar },
    // { name: "Chronic Cases", to: "/chronic-cases", icon: Activity },
    // { name: "Emergency", to: "/emergency", icon: AlertTriangle },
    // { name: "Scan Prescription", to: "/scan-prescription", icon: ScanLine },
    // { name: "Analytics", to: "/analytics", icon: BarChart3 },
  ];

  const requestSignOut = () => setConfirmSignOut(true);

  const cancelSignOut = () => setConfirmSignOut(false);

  const handleConfirmSignOut = async () => {
    setConfirmSignOut(false);
    await signOut();
    navigate("/doctors/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-gray-900">JeevanRakshak</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">JeevanRakshak 360</h1>
                <p className="text-xs text-gray-500">Doctor Panel</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900">
                {doctor?.name}
              </p>
              <p className="text-xs text-blue-700">{doctor?.specialization}</p>
              <p className="text-xs text-blue-600 mt-1">{doctor?.email}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <NavLink
              to="/settings"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Settings</span>
            </NavLink>
            <button
              onClick={requestSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64 pt-16 lg:pt-0">
        <main className="p-6">{children ?? <Outlet />}</main>
      </div>

      {confirmSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">
                  Confirm Sign Out
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Exit the Doctor Console?
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  You will return to the login screen and any unsaved
                  prescription or record changes will be discarded.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleConfirmSignOut}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
                >
                  Yes, sign me out
                </button>
                <button
                  type="button"
                  onClick={cancelSignOut}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Stay in console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
