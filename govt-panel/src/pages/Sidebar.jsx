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

  // 🔐 Check whether govt user is logged in
  useEffect(() => {
    const fetchGovt = async () => {
      try {
        const res = await axios.get("http://localhost:3030/api/govt/check", {
          withCredentials: true,
        });
        setGovtUser(res.data.govt);
      } catch (err) {
        setGovtUser(null); // no redirect here
      }
    };

    fetchGovt();
  }, []);

  // 🔐 Logout govt user
  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3030/api/govt/logout", {
        withCredentials: true,
      });

      setGovtUser(null);
      navigate("/govt/login");
    } catch (err) {
      console.log("Logout failed:", err);
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
            {/* Govt Logged in */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-900 font-semibold">
                  {govtUser.govtId.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Govt Officer
                </p>
                <p className="text-xs text-gray-600">ID: {govtUser.govtId}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <LogOut size={18} />
              Logout
            </button>
          </>
        ) : (
          // If NOT logged in → Login button
          <button
            onClick={() => navigate("/govt/login")}
            className="w-full flex items-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <LogIn size={18} />
            Login
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
