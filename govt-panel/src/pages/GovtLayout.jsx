import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function GovtLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Outlet />
      </div>
    </div>
  );
}

export default GovtLayout;
