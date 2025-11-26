import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Outlet,
} from "react-router-dom";
import { PatientsProvider } from "./context/PatientsContext";
import { DoctorsProvider } from "./context/DoctorsContext";
import ProtectedRouteDoctor from "./components/ProtectedRouteDoctor";

// Pages
import SearchPage from "./pages/SearchPage";
import PatientDetailsPage from "./pages/PatientDetailsPage";
import AddPrescriptionPage from "./pages/AddPrescriptionPage";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import UpdatePatientInfoPage from "./pages/UpdatePatientInfoPage";
import DoctorAuthPage from "./pages/DoctorsAuthPage";

// --- THE ARCHITECTURE HELPER ---
// This corresponds to: Protected Route -> Patient Context -> Page
const ProtectedLayout = () => {
  return (
    <ProtectedRouteDoctor>
      <PatientsProvider>
        <Outlet /> {/* This renders the child route (Search, Details, etc.) */}
      </PatientsProvider>
    </ProtectedRouteDoctor>
  );
};

function App() {
  return (
    <BrowserRouter>
      {/* 1. Doctor Auth covers the WHOLE app */}
      <DoctorsProvider>
        <Routes>
          {/* 2. Login Route (Public, No Patient Data) */}
          <Route path="/doctors/login" element={<DoctorAuthPage />} />

          {/* 3. Protected Routes (Wrapped in Layout) */}
          {/* Anything inside this Route automatically gets Protected + Patient Context */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<SearchPage />} />

            <Route
              path="/patients/:patientId"
              element={<PatientDetailsPage />}
            />

            <Route
              path="/patients/:patientId/prescriptions/new"
              element={<AddPrescriptionPage />}
            />

            <Route
              path="/patients/:patientId/documents/upload"
              element={<UploadDocumentPage />}
            />

            <Route
              path="/patients/:patientId/update"
              element={<UpdatePatientInfoPage />}
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DoctorsProvider>
    </BrowserRouter>
  );
}

export default App;
