import { useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { usePatientReports } from "../context/PatientsreportsContext";

import {
  User,
  Calendar,
  Droplet,
  AlertCircle,
  Activity,
  Syringe,
  FileText,
  ArrowLeft,
  Plus,
  Pill,
  Phone,
  HomeIcon,
  Home,
} from "lucide-react";
import {
  usePatients,
  useFetchPatient,
  usePrescriptions,
} from "../context/PatientsContext";
// import { useFetchPatient } from "../context/PatientsContext";
import DashboardLayout from "../components/DashboardLayout";
import { useDoctors } from "../context/DoctorsContext";
import api from "../api/axios";

function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { doctor } = useDoctors();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [previousDiseases, setPreviousDiseases] = useState([]);
  const { patient, loading, error } = useFetchPatient(patientId);
  // console.log(patient);
  const {
    prescriptions,
    loading: prescriptionsLoading,
    error: prescriptionsError,
  } = usePrescriptions(patient?.id);

  const {
    reports,
    loading: reportsLoading,
    error: reportsError,
  } = usePatientReports(patient?.id);

  useEffect(() => {
    const loadPreviousDiseases = async () => {
      if (!patient?.id) return;

      try {
        const res = await api.get(`/patients/${patient.id}/diseases`);
        console.log(res);

        setPreviousDiseases(res.data.diseases || []);
      } catch (err) {
        console.error("Failed to load previous diseases:", err);
      }
    };

    loadPreviousDiseases();
  }, [patient]);
  // console.log(prescriptions);

  // 3. NOW you can do your conditional returns (after all hooks are declared)

  // Combined loading state (optional, or handle individually)

  // --- Render Logic ---
  if (loading) {
    return <div>Loading...</div>; // Or your full screen loader component
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }
  if (prescriptionsLoading) {
    return <div className="p-8 text-center">Loading patient data...</div>;
  }

  if (prescriptionsError) {
    return (
      <div className="p-8 text-center text-red-500">{prescriptionsError}</div>
    );
  }

  const visits = patient.visits || [];
  const documents = patient.documents || [];
  const chronicDiseases = patient.chronic_diseases || [];
  const currentMedication = patient.current_medication || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const totalPrescriptions = prescriptions.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <button
            onClick={() => navigate("/search-patient")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Search
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                {patient.photo_url ? (
                  <img
                    src={patient.photo_url}
                    alt={patient.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                    <User className="w-16 h-16 text-blue-600" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                  {patient.name}
                </h2>
                <p className="text-blue-600 font-medium">
                  ID: {patient.migrant_health_id}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>
                    {patient.age} years, {patient.gender}
                  </span>
                </div>

                {patient.district && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-green-500" />
                    <span>District: {patient.district},</span>
                  </div>
                )}

                {patient.taluk && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-green-600" />
                    <span>Taluk: {patient.taluk},</span>
                  </div>
                )}
                {patient.village && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-green-600" />
                    <span>Village: {patient.village},</span>
                  </div>
                )}

                {patient.address && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Home className="w-5 h-5 text-green-600" />
                    <span>Address: {patient.address},</span>
                  </div>
                )}
              </div>

              {/* <button
                onClick={() =>
                  navigate(`/patients/${patient.migrant_health_id}/update`)
                }
                className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add Missing Info
              </button> */}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Previous Diseases
                </h3>
              </div>

              {previousDiseases.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {previousDiseases.map((disease, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No previous diseases found
                </p>
              )}
            </div>

            {currentMedication.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">
                    Current Medication
                  </h3>
                </div>
                <div className="space-y-2">
                  {currentMedication.map((med, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-sm"
                    >
                      {med}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() =>
                  navigate(
                    `/patients/${patient.migrant_health_id}/prescriptions/new`
                  )
                }
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">Add Prescription</h3>
                  <p className="text-sm text-gray-600">
                    Create new prescription
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  navigate(
                    `/patients/${patient.migrant_health_id}/documents/upload`
                  )
                }
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">Upload Document</h3>
                  <p className="text-sm text-gray-600">Add medical records</p>
                </div>
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Number of Visits
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Total Prescriptions Issued: <b>{totalPrescriptions}</b>
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Prescriptions Timeline
                </h3>
              </div>
              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div
                      key={rx._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-600">
                          <span className="text-gray-500 mr-1">Diagnosis:</span>
                          {rx.confirmedDisease ||
                            rx.suspectedDisease ||
                            "Prescription"}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(rx.dateOfIssue)}
                        </span>
                      </div>

                      {/* Symptoms */}
                      {rx.symptoms && (
                        <p className="text-sm text-gray-700 mb-1">
                          <b>Symptoms:</b> {rx.symptoms}
                        </p>
                      )}

                      {/* Duration */}
                      {rx.durationOfSymptoms && (
                        <p className="text-sm text-gray-700 mb-1">
                          <b>Duration:</b> {rx.durationOfSymptoms}
                        </p>
                      )}

                      {/* Contagious */}
                      <p className="text-sm text-gray-700 mb-1">
                        <b>Contagious:</b> {rx.contagious ? "Yes" : "No"}
                      </p>

                      {/* Medicines */}
                      {rx.medicinesIssued && rx.medicinesIssued.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Medicines Issued:
                          </p>
                          {rx.medicinesIssued.map((med, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              {/* • {med.name} – {med.dosage} */}• {med}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Follow-up Date */}
                      {rx.followUpDate && (
                        <p className="text-sm text-gray-700 mt-2">
                          <b>Follow-up:</b> {formatDate(rx.followUpDate)}
                        </p>
                      )}

                      {/* Notes */}
                      {rx.notes && (
                        <p className="text-sm text-gray-700 mt-2">
                          <b>Notes:</b> {rx.notes}
                        </p>
                      )}

                      {/* Doctor Name */}
                      {rx.doctor && (
                        <p className="text-sm text-gray-600 mt-2">
                          <h4 className="font-semibold text-gray-800">
                            Doctor: {rx.doctor.name}
                          </h4>
                        </p>
                      )}

                      {/* Images (Uploaded prescription files) */}
                      {rx.images && rx.images.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-1">
                            <b>Prescription Files:</b>
                          </p>
                          <div className="flex gap-3 mt-2">
                            {rx.images.map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedFile(img);
                                  setShowModal(true);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                              >
                                View Prescription {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No prescriptions yet</p>
              )}
            </div>
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-xl shadow-lg max-w-3xl w-[90%] relative">
                  {/* Close Button */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-3 right-3 text-gray-600 text-xl font-bold hover:text-black"
                  >
                    ✕
                  </button>

                  {/* Content Wrapper to center image */}
                  <div className="flex justify-center items-center">
                    {/* Image */}
                    <img
                      src={selectedFile}
                      alt="Prescription"
                      className="max-h-[80vh] max-w-full object-contain rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Uploaded Documents
                </h3>
              </div>

              {reportsLoading && (
                <p className="text-gray-500">Loading documents...</p>
              )}
              {reportsError && <p className="text-red-500">{reportsError}</p>}

              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map((doc) => (
                    <div
                      key={doc._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-600">
                          <span className="text-gray-500 mr-1">Document:</span>
                          {doc.documentName}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.createdAt)}
                        </span>
                      </div>

                      {/* Type */}
                      <p className="text-sm text-gray-700 mb-1">
                        <b>Type:</b> {doc.notes}
                      </p>

                      {/* Uploaded By */}
                      <p className="text-sm text-gray-700 mb-1">
                        <b>Uploaded By:</b> {doc.doctor}
                      </p>

                      {/* View button */}
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            setSelectedFile(doc.file);
                            setShowModal(true);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
                        >
                          View Document
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No documents uploaded.</p>
              )}
            </div>
            {showModal && selectedFile && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-xl shadow-lg max-w-4xl w-[95%] h-[90vh] relative">
                  {/* Close Button */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-3 right-3 text-gray-600 text-xl font-bold hover:text-black"
                  >
                    ✕
                  </button>

                  {/* PDF Viewer */}
                  <iframe
                    src={selectedFile}
                    className="w-full h-full rounded-md"
                    style={{ border: "none" }}
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PatientDetailsPage;
