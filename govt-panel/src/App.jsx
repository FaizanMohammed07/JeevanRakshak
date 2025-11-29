import { Navigate, Route, Routes } from "react-router-dom";
import GovtLayout from "./pages/GovtLayout";
import GovtProtectedRoute from "./pages/GovtProtectedRoute";
import Dashboard from "./pages/Dashboard";
import DiseaseMonitoring from "./pages/DiseaseMonitoring";
import CampManagement from "./pages/CampManagement";
import OutbreakAlerts from "./pages/OutbreakAlerts";
import HospitalCompliance from "./pages/HospitalCompliance";
import MigrantRecords from "./pages/MigrantRecords";
import Settings from "./pages/Settings";
import GovtLogin from "./pages/GovtLogin";

function App() {
  return (
    <Routes>
      <Route path="/govt/login" element={<GovtLogin />} />
      <Route
        path="/*"
        element={
          <GovtProtectedRoute>
            <GovtLayout />
          </GovtProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route
            path="dashboard/district/:districtId"
            element={<Dashboard />}
          />
        <Route path="disease" element={<DiseaseMonitoring />} />
        <Route
            path="disease/district/:districtId"
            element={<DiseaseMonitoring />}
          />
          <Route
            path="disease/district/:districtId/taluk/:talukId"
            element={<DiseaseMonitoring />}
          />
        <Route path="camps" element={<CampManagement />} />
        <Route path="camps/:campSlug" element={<CampManagement />} />
        <Route path="alerts" element={<OutbreakAlerts />} />
        <Route path="alerts/:alertId" element={<OutbreakAlerts />} />

        <Route path="hospitals" element={<HospitalCompliance />} />
        <Route
            path="hospitals/:hospitalSlug"
            element={<HospitalCompliance />}
          />
        <Route path="migrants" element={<MigrantRecords />} />
        <Route path="migrants/:migrantId" element={<MigrantRecords />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings/:section" element={<Settings />} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>

      {/* DEFAULT REDIRECT */}
      <Route path="*" element={<Navigate to="/govt/login" />} />
    </Routes>
  );
}

export default App;
