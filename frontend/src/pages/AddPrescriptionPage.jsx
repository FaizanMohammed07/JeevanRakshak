import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { usePatients, useFetchPatient } from "../context/PatientsContext";

function AddPrescriptionPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { addPrescription } = usePatients();

  const { patient, loading: fetchLoading } = useFetchPatient(patientId);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form State matching Mongoose Schema
  const [formData, setFormData] = useState({
    symptoms: "",
    durationOfSymptoms: "", // New Field
    suspectedDisease: "", // New Field
    confirmedDisease: "", // New Field
    followUpDate: "", // New Field
    notes: "",
    contagious: false, // New Field
  });

  // Medicines State (Array of Strings to match medicinesIssued: [String])
  const [medicines, setMedicines] = useState([""]);

  if (fetchLoading) return <div className="p-6">Loading patient data...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMedicineChange = (index, value) => {
    const updated = [...medicines];
    updated[index] = value;
    setMedicines(updated);
  };

  const addMedicineField = () => {
    setMedicines((prev) => [...prev, ""]);
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

    // Validation based on Schema 'required: true'
    if (!formData.symptoms.trim()) {
      setError("Please enter symptoms");
      return;
    }
    if (!formData.durationOfSymptoms.trim()) {
      setError("Please enter duration of symptoms");
      return;
    }

    // Filter empty medicines
    const validMedicines = medicines
      .map((med) => med.trim())
      .filter((med) => med.length > 0);

    if (validMedicines.length === 0) {
      setError("Please list at least one medicine");
      return;
    }

    setSubmitting(true);

    try {
      // Construct Payload matching Schema
      const payload = {
        patient: patient.id, // Matches 'patient' ref
        // 'doctor' ref should be handled by backend via req.user from token

        symptoms: formData.symptoms.trim(),
        durationOfSymptoms: formData.durationOfSymptoms.trim(),
        contagious: formData.contagious,
        medicinesIssued: validMedicines, // Matches [String]

        suspectedDisease: formData.suspectedDisease.trim(),
        confirmedDisease: formData.confirmedDisease.trim(),
        followUpDate: formData.followUpDate || null,
        notes: formData.notes.trim(),

        dateOfIssue: new Date().toISOString(),
      };

      await addPrescription(patient.id, payload);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${patient.migrant_health_id}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save prescription.");
    } finally {
      setSubmitting(false);
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
          <div className="mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              New Prescription
            </h2>
            <p className="text-gray-600">
              Patient: <span className="font-semibold">{patient.name}</span> (
              {patient.migrant_health_id})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Section 1: Symptoms & Nature --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symptoms <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="High fever, cough, fatigue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="durationOfSymptoms"
                  value={formData.durationOfSymptoms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 3 days, 1 week"
                />
              </div>

              <div className="flex items-center h-full pt-6">
                <label className="flex items-center cursor-pointer space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="contagious"
                      checked={formData.contagious}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </div>
                  <span
                    className={`font-medium ${
                      formData.contagious ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {formData.contagious
                      ? "Contagious / High Risk"
                      : "Not Contagious"}
                  </span>
                </label>
              </div>
            </div>

            {/* --- Section 2: Diagnosis --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspected Disease
                </label>
                <input
                  type="text"
                  name="suspectedDisease"
                  value={formData.suspectedDisease}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Provisional diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmed Disease
                </label>
                <input
                  type="text"
                  name="confirmedDisease"
                  value={formData.confirmedDisease}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Final diagnosis (if available)"
                />
              </div>
            </div>

            {/* --- Section 3: Medicines Issued --- */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medicines Issued <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addMedicineField}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {medicines.map((medicine, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={medicine}
                      onChange={(e) =>
                        handleMedicineChange(index, e.target.value)
                      }
                      placeholder={`Medicine ${index + 1} (Name & Dosage)`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

            {/* --- Section 4: Follow Up & Notes --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Follow-up Date
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor's Remarks / Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional instructions"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                Prescription saved successfully! Redirecting...
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || success}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Saving..."
                  : success
                  ? "Saved!"
                  : "Submit Prescription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPrescriptionPage;
