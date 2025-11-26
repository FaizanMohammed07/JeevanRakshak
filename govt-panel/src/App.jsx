import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./pages/Sidebar";
import Dashboard from "./pages/Dashboard";
import DiseaseMonitoring from "./pages/DiseaseMonitoring";
import CampManagement from "./pages/CampManagement";
import OutbreakAlerts from "./pages/OutbreakAlerts";
import HospitalCompliance from "./pages/HospitalCompliance";
import MigrantRecords from "./pages/MigrantRecords";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/dashboard/district/:districtId"
            element={<Dashboard />}
          />

          <Route path="/disease" element={<DiseaseMonitoring />} />
          <Route
            path="/disease/district/:districtId"
            element={<DiseaseMonitoring />}
          />
          <Route
            path="/disease/district/:districtId/taluk/:talukId"
            element={<DiseaseMonitoring />}
          />

          <Route path="/camps" element={<CampManagement />} />
          <Route path="/camps/:campSlug" element={<CampManagement />} />

          <Route path="/alerts" element={<OutbreakAlerts />} />
          <Route path="/alerts/:alertId" element={<OutbreakAlerts />} />

          <Route path="/hospitals" element={<HospitalCompliance />} />
          <Route
            path="/hospitals/:hospitalSlug"
            element={<HospitalCompliance />}
          />

          <Route path="/migrants" element={<MigrantRecords />} />
          <Route path="/migrants/:migrantId" element={<MigrantRecords />} />

          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/:section" element={<Settings />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
