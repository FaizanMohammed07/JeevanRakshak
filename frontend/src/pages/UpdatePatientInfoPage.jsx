import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { usePatients, useFetchPatient } from "../context/PatientsContext";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function UpdatePatientInfoPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { findPatientById, updatePatientInfo } = usePatients();
  const { patient, loading2 } = useFetchPatient(patientId);

  // --- Loading Check ---
  if (loading2) {
    return <div className="p-6">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found.</div>;
  }

  const [allergies, setAllergies] = useState(patient?.allergies || []);
  const [chronicDiseases, setChronicDiseases] = useState(
    patient?.chronic_diseases || []
  );
  const [currentMedication, setCurrentMedication] = useState(
    patient?.current_medication || []
  );
  const [emergencyContact, setEmergencyContact] = useState(
    patient?.emergency_contact || ""
  );
  const [bloodGroup, setBloodGroup] = useState(patient?.blood_group || "");

  const [newAllergy, setNewAllergy] = useState("");
  const [newDisease, setNewDisease] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg text-center space-y-4">
          <p className="text-lg font-semibold text-gray-800">
            Patient not found. Please return to the details page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Return to Search
          </button>
        </div>
      </div>
    );
  }

  const addEntry = (setter, entries, value, reset) => {
    if (value.trim()) {
      setter([...entries, value.trim()]);
      reset("");
    }
  };

  const removeEntry = (setter, entries, index) => {
    setter(entries.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      updatePatientInfo(patient.id, {
        allergies,
        chronicDiseases,
        currentMedication,
        emergencyContact: emergencyContact.trim(),
        bloodGroup,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${patient.migrant_health_id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to update patient information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Patient Details
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Update Patient Information
            </h2>
            <p className="text-gray-600">
              Patient: {patient.name} ({patient.migrant_health_id})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="bloodGroup"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Blood Group
              </label>
              <select
                id="bloodGroup"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Select blood group</option>
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="emergencyContact"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Emergency Contact
              </label>
              <input
                type="tel"
                id="emergencyContact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter emergency contact number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <div className="space-y-2 mb-3">
                {allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-orange-50 border border-orange-200 px-4 py-2 rounded-lg"
                  >
                    <span className="text-gray-800">{allergy}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeEntry(setAllergies, allergies, index)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addEntry(
                      setAllergies,
                      allergies,
                      newAllergy,
                      setNewAllergy
                    ))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Add new allergy"
                />
                <button
                  type="button"
                  onClick={() =>
                    addEntry(setAllergies, allergies, newAllergy, setNewAllergy)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chronic Diseases
              </label>
              <div className="space-y-2 mb-3">
                {chronicDiseases.map((disease, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-red-50 border border-red-200 px-4 py-2 rounded-lg"
                  >
                    <span className="text-gray-800">{disease}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeEntry(setChronicDiseases, chronicDiseases, index)
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDisease}
                  onChange={(e) => setNewDisease(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addEntry(
                      setChronicDiseases,
                      chronicDiseases,
                      newDisease,
                      setNewDisease
                    ))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Add chronic disease"
                />
                <button
                  type="button"
                  onClick={() =>
                    addEntry(
                      setChronicDiseases,
                      chronicDiseases,
                      newDisease,
                      setNewDisease
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Medication
              </label>
              <div className="space-y-2 mb-3">
                {currentMedication.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg"
                  >
                    <span className="text-gray-800">{med}</span>
                    <button
                      type="button"
                      onClick={() =>
                        removeEntry(
                          setCurrentMedication,
                          currentMedication,
                          index
                        )
                      }
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addEntry(
                      setCurrentMedication,
                      currentMedication,
                      newMedication,
                      setNewMedication
                    ))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Add current medication"
                />
                <button
                  type="button"
                  onClick={() =>
                    addEntry(
                      setCurrentMedication,
                      currentMedication,
                      newMedication,
                      setNewMedication
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                Patient information updated successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Updating..."
                  : success
                  ? "Updated!"
                  : "Update Information"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdatePatientInfoPage;
