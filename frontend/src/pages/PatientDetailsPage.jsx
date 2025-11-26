import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";
import { useFetchPatient } from "../context/PatientsContext";
import DashboardLayout from "../components/DashboardLayout";

function PatientDetailsPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // --- THE NEW WAY (Simple) ---
  // You do NOT need useState, useEffect, or useContext here anymore.
  // The hook handles all the logic, caching, and state updates for you.
  const { patient, loading, error } = useFetchPatient(patientId);
  console.log(patient);

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

  const vaccinations = patient.vaccinations || [];
  const visits = patient.visits || [];
  const prescriptions = patient.prescriptions || [];
  const documents = patient.documents || [];
  const allergies = patient.allergies || [];
  const chronicDiseases = patient.chronic_diseases || [];
  const currentMedication = patient.current_medication || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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

                {patient.blood_group && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Droplet className="w-5 h-5 text-red-500" />
                    <span>Blood Group: {patient.blood_group}</span>
                  </div>
                )}

                {patient.emergency_contact && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>{patient.emergency_contact}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  navigate(`/patients/${patient.migrant_health_id}/update`)
                }
                className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Add Missing Info
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-bold text-gray-800">Allergies</h3>
              </div>
              {allergies.length > 0 ? (
                <div className="space-y-2">
                  {allergies.map((allergy, index) => (
                    <div
                      key={index}
                      className="bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg text-sm"
                    >
                      {allergy}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No allergies recorded</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Chronic Diseases
                </h3>
              </div>
              {chronicDiseases.length > 0 ? (
                <div className="space-y-2">
                  {chronicDiseases.map((disease, index) => (
                    <div
                      key={index}
                      className="bg-red-50 border border-red-200 px-3 py-2 rounded-lg text-sm"
                    >
                      {disease}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No chronic diseases recorded
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
                <Syringe className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Vaccination Status
                </h3>
              </div>
              {vaccinations.length > 0 ? (
                <div className="space-y-3">
                  {vaccinations.map((vac) => (
                    <div
                      key={vac.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {vac.vaccine_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Administered: {formatDate(vac.date_administered)}
                          </p>
                          {vac.next_dose_date && (
                            <p className="text-sm text-blue-600">
                              Next dose: {formatDate(vac.next_dose_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No vaccination records</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Recent Visits
                </h3>
              </div>
              {visits.length > 0 ? (
                <div className="space-y-3">
                  {visits.map((visit) => (
                    <div
                      key={visit.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {visit.facility_name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(visit.visit_date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Dr. {visit.doctor_name}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        {visit.reason}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No visit records</p>
              )}
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
                      key={rx.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">
                          {rx.diagnosis}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(rx.prescribed_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Symptoms: {rx.symptoms}
                      </p>
                      <p className="text-sm text-gray-600">
                        Dr. {rx.prescribed_by}
                      </p>
                      {rx.medicines && rx.medicines.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">
                            Medicines:
                          </p>
                          {rx.medicines.map((med, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              • {med.name} - {med.dosage}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No prescriptions yet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Uploaded Documents
                </h3>
              </div>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {doc.document_name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {doc.document_type} • {formatDate(doc.uploaded_at)}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PatientDetailsPage;
