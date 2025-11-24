import { useMemo, useState } from "react";
import SearchPatient from "./components/SearchPatient";
import PatientDetails from "./components/PatientDetails";
import AddPrescription from "./components/AddPrescription";
import UploadDocument from "./components/UploadDocument";
import UpdatePatientInfo from "./components/UpdatePatientInfo";
import { mockPatients } from "./data/mockPatients";

function App() {
  const [currentView, setCurrentView] = useState("search");
  const [patients, setPatients] = useState(mockPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handlePatientFound = (patientId) => {
    setSelectedPatientId(patientId);
    setCurrentView("details");
  };

  const handleBackToSearch = () => {
    setCurrentView("search");
    setSelectedPatientId(null);
  };

  const handleBackToDetails = () => {
    setCurrentView("details");
  };

  const handleAddPrescription = () => {
    setCurrentView("prescription");
  };

  const handleUploadDocument = () => {
    setCurrentView("upload");
  };

  const handleUpdateInfo = () => {
    setCurrentView("update");
  };

  const updatePatientRecord = (patientId, updater) => {
    setPatients((prevPatients) =>
      prevPatients.map((patient) =>
        patient.id === patientId ? updater(patient) : patient
      )
    );
  };

  const handlePrescriptionAdded = (newPrescription) => {
    if (!selectedPatient) return;

    updatePatientRecord(selectedPatient.id, (patient) => ({
      ...patient,
      prescriptions: [newPrescription, ...(patient.prescriptions || [])],
    }));

    setCurrentView("details");
  };

  const handleDocumentUploaded = (newDocument) => {
    if (!selectedPatient) return;

    updatePatientRecord(selectedPatient.id, (patient) => ({
      ...patient,
      documents: [newDocument, ...(patient.documents || [])],
    }));

    setCurrentView("details");
  };

  const handleInfoUpdated = (updatedInfo) => {
    if (!selectedPatient) return;

    updatePatientRecord(selectedPatient.id, (patient) => ({
      ...patient,
      allergies: updatedInfo.allergies,
      chronic_diseases: updatedInfo.chronicDiseases,
      current_medication: updatedInfo.currentMedication,
      emergency_contact: updatedInfo.emergencyContact,
      blood_group: updatedInfo.bloodGroup,
    }));

    setCurrentView("details");
  };

  return (
    <>
      {currentView === "search" && (
        <SearchPatient
          patients={patients}
          onPatientFound={handlePatientFound}
        />
      )}

      {currentView === "details" && selectedPatient && (
        <PatientDetails
          patient={selectedPatient}
          onBack={handleBackToSearch}
          onAddPrescription={handleAddPrescription}
          onUploadDocument={handleUploadDocument}
          onUpdateInfo={handleUpdateInfo}
        />
      )}

      {currentView === "prescription" && selectedPatient && (
        <AddPrescription
          patient={selectedPatient}
          onBack={handleBackToDetails}
          onPrescriptionAdded={handlePrescriptionAdded}
        />
      )}

      {currentView === "upload" && selectedPatient && (
        <UploadDocument
          patient={selectedPatient}
          onBack={handleBackToDetails}
          onDocumentUploaded={handleDocumentUploaded}
        />
      )}

      {currentView === "update" && selectedPatient && (
        <UpdatePatientInfo
          patient={selectedPatient}
          onBack={handleBackToDetails}
          onInfoUpdated={handleInfoUpdated}
        />
      )}
    </>
  );
}

export default App;
