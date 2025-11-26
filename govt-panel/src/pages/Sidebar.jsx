import { NavLink } from "react-router-dom";
import {
  Home,
  Activity,
  Tent,
  AlertTriangle,
  Building2,
  Users,
  Settings,
} from "lucide-react";

function Sidebar() {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
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
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
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

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-900 font-semibold">AD</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-600">admin@kerala.gov.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
