import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Activity,
  Tent,
  AlertTriangle,
  Building2,
  Users,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const [govtUser, setGovtUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchGovt = async () => {
      try {
        const res = await axios.get("http://localhost:3030/api/govt/check", {
          withCredentials: true,
        });
        if (mounted) setGovtUser(res.data.govt);
      } catch (err) {
        if (mounted) setGovtUser(null);
      }
    };
    fetchGovt();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3030/api/govt/logout", {
        withCredentials: true,
      });
      setGovtUser(null);
      setShowLogoutConfirm(false);
      navigate("/govt/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setShowLogoutConfirm(false);
    }
  };

  // Sidebar menu items
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      id: "disease",
      label: "Disease Monitoring",
      icon: Activity,
      path: "/disease",
    },
    { id: "camps", label: "Camps", icon: Tent, path: "/camps" },
    {
      id: "alerts",
      label: "Outbreak Alerts",
      icon: AlertTriangle,
      path: "/alerts",
    },
    {
      id: "hospitals",
      label: "Hospitals",
      icon: Building2,
      path: "/hospitals",
    },
    { id: "migrants", label: "Migrants", icon: Users, path: "/migrants" },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  useEffect(() => {
    const target = document.body;
    const html = document.documentElement;
    if (showLogoutConfirm) {
      target.style.overflow = "hidden";
      html.style.overflow = "hidden";
    } else {
      target.style.overflow = "";
      html.style.overflow = "";
    }
    return () => {
      target.style.overflow = "";
      html.style.overflow = "";
    };
  }, [showLogoutConfirm]);

  return (
    <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-900">Kerala Govt</h1>
        <p className="text-xs text-gray-600 mt-1">Migrant Health System</p>
      </div>

      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200">
        {govtUser ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-900 font-semibold">
                {govtUser.govtId.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Govt Officer
                </p>
                <p className="text-xs text-gray-600">ID: {govtUser.govtId}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/govt/login")}
            className="w-full flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <LogIn size={18} />
            Login
          </button>
        )}
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-red-600">
                <LogOut size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  Government Admin Panel
                </p>
                <h2
                  id="logout-confirm-title"
                  className="mt-2 text-2xl font-semibold text-slate-900"
                >
                  Confirm sign out
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  This will end your secure session. Confirm only if you intend
                  to leave the admin console.
                </p>
              </div>
              <div className="flex flex-col gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em] sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-white shadow-sm transition hover:brightness-90"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
