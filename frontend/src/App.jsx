import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PatientsProvider } from "./context/PatientsContext";
import SearchPage from "./pages/SearchPage";
import PatientDetailsPage from "./pages/PatientDetailsPage";
import AddPrescriptionPage from "./pages/AddPrescriptionPage";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import UpdatePatientInfoPage from "./pages/UpdatePatientInfoPage";

function App() {
  return (
    <BrowserRouter>
      <PatientsProvider>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/patients/:patientId" element={<PatientDetailsPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PatientsProvider>
    </BrowserRouter>
  );
}

export default App;
