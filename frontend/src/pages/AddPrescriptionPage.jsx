import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { usePatients, useFetchPatient } from "../context/PatientsContext";

function AddPrescriptionPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { findPatientById, addPrescription } = usePatients();
  const { patient, loading2 } = useFetchPatient(patientId);

  // --- Loading Check ---
  if (loading2) {
    return <div className="p-6">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="p-6">Patient not found.</div>;
  }
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    symptoms: "",
    diagnosis: "",
    notes: "",
    prescribedBy: "",
  });
  const [medicines, setMedicines] = useState([{ name: "", dosage: "" }]);
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

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const addMedicineField = () => {
    setMedicines((prev) => [...prev, { name: "", dosage: "" }]);
  };

  const removeMedicineField = (index) => {
    setMedicines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !formData.symptoms.trim() ||
      !formData.diagnosis.trim() ||
      !formData.prescribedBy.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const validMedicines = medicines
      .map((med) => ({ name: med.name.trim(), dosage: med.dosage.trim() }))
      .filter((med) => med.name && med.dosage);

    if (validMedicines.length === 0) {
      setError("Please add at least one medicine");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newPrescription = {
        id: `rx-${Date.now()}`,
        patient_id: patient.id,
        symptoms: formData.symptoms.trim(),
        diagnosis: formData.diagnosis.trim(),
        medicines: validMedicines,
        notes: formData.notes.trim(),
        prescribed_by: formData.prescribedBy.trim(),
        prescribed_at: new Date().toISOString(),
      };

      addPrescription(patient.id, newPrescription);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${patient.migrant_health_id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Failed to save prescription. Please try again.");
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
              Add Prescription
            </h2>
            <p className="text-gray-600">
              Patient: {patient.name} ({patient.migrant_health_id})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="symptoms"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                id="symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Describe the patient's symptoms"
              />
            </div>

            <div>
              <label
                htmlFor="diagnosis"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Diagnosis <span className="text-red-500">*</span>
              </label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your diagnosis"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medicines <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addMedicineField}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Medicine
                </button>
              </div>

              <div className="space-y-3">
                {medicines.map((medicine, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={medicine.name}
                      onChange={(e) =>
                        handleMedicineChange(index, "name", e.target.value)
                      }
                      placeholder="Medicine name"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) =>
                        handleMedicineChange(index, "dosage", e.target.value)
                      }
                      placeholder="Dosage (e.g., 1-0-1)"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicineField(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Any additional instructions or notes"
              />
            </div>

            <div>
              <label
                htmlFor="prescribedBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Doctor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="prescribedBy"
                name="prescribedBy"
                value={formData.prescribedBy}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                Prescription saved successfully! Redirecting...
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
                  ? "Saving..."
                  : success
                  ? "Saved!"
                  : "Save Prescription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPrescriptionPage;
