import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";
import { usePatients, useFetchPatient } from "../context/PatientsContext";

const TIME_SLOTS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "night", label: "Night" },
];

const MEAL_OPTIONS = [
  { key: "before", label: "Before food" },
  { key: "after", label: "After food" },
];

const createMedicineEntry = () => ({
  name: "",
  dosage: "",
  schedule: { morning: false, afternoon: false, night: false },
  mealTiming: "after",
});

function AddPrescriptionPage() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const { addPrescription, addDocument } = usePatients();

  const { patient, loading: fetchLoading } = useFetchPatient(patientId);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Toggle between Manual Entry and File Upload
  const [uploadMode, setUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Form State matching Mongoose Schema
  const [formData, setFormData] = useState({
    symptoms: "",
    durationOfSymptoms: "",
    suspectedDisease: "",
    confirmedDisease: "",
    followUpDate: "",
    notes: "",
    contagious: false,
  });
  const isConfirmedRequiredAndMissing =
    formData.contagious && !formData.confirmedDisease.trim();

  const mustConfirm = formData.contagious && !formData.confirmedDisease.trim();

  // Medicines State (Array of Strings)
  const [medicines, setMedicines] = useState([createMedicineEntry()]);

  if (fetchLoading) return <div className="p-6">Loading patient data...</div>;
  if (!patient) return <div className="p-6">Patient not found</div>;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateMedicine = (index, changes) => {
    setMedicines((prev) => {
      const next = [...prev];
      const current = { ...next[index] };
      next[index] = { ...current, ...changes };
      return next;
    });
  };

  const handleMedicineFieldChange = (index, field, value) => {
    updateMedicine(index, { [field]: value });
  };

  const toggleMedicineTimeSlot = (index, slot) => {
    setMedicines((prev) => {
      const next = [...prev];
      const current = next[index];
      const schedule = {
        ...current.schedule,
        [slot]: !current.schedule?.[slot],
      };
      next[index] = { ...current, schedule };
      return next;
    });
  };

  const setMedicineMealTiming = (index, timing) => {
    updateMedicine(index, { mealTiming: timing });
  };

  const addMedicineField = () => {
    setMedicines((prev) => [...prev, createMedicineEntry()]);
  };

  const removeMedicineField = (index) => {
    setMedicines((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError("");
    }
  };
  const handleFileUploadSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    // HARD VALIDATION → Only when contagious is TRUE
    if (formData.contagious && !formData.confirmedDisease.trim()) {
      setError("Confirmed disease is required for contagious cases.");
      return;
    }

    setSubmitting(true);

    try {
      const docPayload = {
        document_name: selectedFile.name || "Prescription Upload",
        document_type: "Prescription",
        uploaded_at: new Date().toISOString(),
        file: selectedFile,
        confirmedDisease: formData.confirmedDisease.trim(),
        contagious: formData.contagious,
        notes: "Uploaded via File",
      };

      await addDocument(patient.id, docPayload);

      setSuccess(true);
      setTimeout(() => {
        navigate(`/patients/${patient.migrant_health_id}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Failed to upload prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.symptoms.trim()) {
      setError("Please enter symptoms");
      return;
    }
    if (!formData.durationOfSymptoms.trim()) {
      setError("Please enter duration of symptoms");
      return;
    }

    const validMedicines = medicines
      .map((medicine) => ({
        name: medicine.name.trim(),
        dosage: medicine.dosage.trim(),
        schedule: medicine.schedule,
        mealTiming: medicine.mealTiming,
      }))
      .filter((medicine) => medicine.name);

    if (validMedicines.length === 0) {
      setError("Please list at least one medicine");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        patient: patient.id,
        symptoms: formData.symptoms.trim(),
        durationOfSymptoms: formData.durationOfSymptoms.trim(),
        contagious: formData.contagious,
        medicinesIssued: validMedicines,
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

          {/* --- MODE TOGGLE --- */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUploadMode(false)}
              className={`py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                !uploadMode
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"
              }`}
            >
              <Plus className="w-5 h-5" /> Write Prescription
            </button>
            <button
              type="button"
              onClick={() => setUploadMode(true)}
              className={`py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                uploadMode
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"
              }`}
            >
              <Upload className="w-5 h-5" /> Upload File
            </button>
          </div>

          {/* --- RENDER BASED ON MODE --- */}
          {uploadMode ? (
            // --- UPLOAD FORM ---
            <form
              onSubmit={handleFileUploadSubmit}
              className="space-y-6 animate-in fade-in duration-300"
            >
              <div className="border-2 border-dashed border-blue-300 rounded-2xl p-12 text-center bg-blue-50/50 hover:bg-blue-50 transition cursor-pointer relative group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold text-gray-700">
                      {selectedFile
                        ? selectedFile.name
                        : "Drop prescription here"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "Click to browse (PDF, JPG, PNG)"}
                    </p>
                  </div>
                </div>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedFile(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* --- New Fields for Upload Mode --- */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100"> */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                {/* Confirmed Disease */}
                <div
                  className={`grid gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100 
  ${formData.contagious ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
                >
                  {/* Suspected Disease in upload file */}
                  <div
                    className={`${formData.contagious ? "" : "md:col-span-2"}`}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suspected Disease
                    </label>
                    <input
                      type="text"
                      name="suspectedDisease"
                      value={formData.suspectedDisease}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Provisional diagnosis"
                      required
                    />
                  </div>

                  {/* Confirmed Disease in uploadfile */}
                  {formData.contagious && (
                    <div>
                      <label className="block text-sm font-medium text-red-600 mb-2">
                        Confirmed Disease{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        name="confirmedDisease"
                        value={formData.confirmedDisease}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white"
                        placeholder="Final diagnosis"
                        required
                      />

                      {mustConfirm && (
                        <p className="text-red-600 text-sm mt-1">
                          Confirmed disease is required for contagious cases.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Contagious Toggle */}
                  <div className="flex items-center h-full pt-6">
                    <label className="flex items-center cursor-pointer space-x-3 select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          name="contagious"
                          checked={formData.contagious}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div
                          className="w-12 h-7 bg-gray-300 rounded-full peer peer-checked:bg-red-500 peer-focus:outline-none 
        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 
        after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
                        ></div>
                      </div>

                      <div className="flex flex-col">
                        <span
                          className={`font-semibold ${
                            formData.contagious
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {formData.contagious
                            ? "Contagious / High Risk"
                            : "Not Contagious"}
                        </span>
                        <span className="text-xs text-gray-400">
                          Toggle if this requires isolation
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                  File uploaded successfully! Redirecting...
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedFile || mustConfirm}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {submitting ? "Uploading..." : "Submit Prescription File"}
              </button>
            </form>
          ) : (
            // --- MANUAL FORM (Your Existing Form) ---
            <form
              onSubmit={handleSubmit}
              className="space-y-6 animate-in fade-in duration-300"
            >
              {/* Section 1: Symptoms & Nature */}
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

              {/* Section 2: Diagnosis */}
              <div
                className={`grid gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 
            ${
              formData.contagious ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}
              >
                {/* Suspected Disease */}
                <div
                  className={`${formData.contagious ? "" : "md:col-span-2"}`}
                >
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

                {/* Confirmed Disease — only shown if contagious */}
                {formData.contagious && (
                  <div>
                    <label className="block text-sm font-medium text-red-600 mb-2">
                      Confirmed Disease
                    </label>
                    <input
                      type="text"
                      name="confirmedDisease"
                      value={formData.confirmedDisease}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                      placeholder="Final diagnosis"
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Medicines Issued */}
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

                <div className="space-y-4">
                  {medicines.map((medicine, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm bg-white"
                    >
                      <div className="grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                        <input
                          type="text"
                          value={medicine.name}
                          onChange={(e) =>
                            handleMedicineFieldChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder={`Medicine ${index + 1} (Name)`}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) =>
                            handleMedicineFieldChange(
                              index,
                              "dosage",
                              e.target.value
                            )
                          }
                          placeholder="Dosage / Strength"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicineField(index)}
                            className="text-red-600 hover:text-red-800 rounded-full p-2 border border-red-100 hover:bg-red-50"
                            aria-label={`Remove medicine ${index + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                          Timing
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TIME_SLOTS.map((slot) => {
                            const active = medicine.schedule?.[slot.key];
                            return (
                              <button
                                key={slot.key}
                                type="button"
                                onClick={() =>
                                  toggleMedicineTimeSlot(index, slot.key)
                                }
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                                  active
                                    ? "bg-blue-600 text-white border-transparent"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"
                                }`}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-2">
                          With food
                        </p>
                        <div className="flex gap-2">
                          {MEAL_OPTIONS.map((option) => {
                            const active = medicine.mealTiming === option.key;
                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() =>
                                  setMedicineMealTiming(index, option.key)
                                }
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                                  active
                                    ? "bg-emerald-600 text-white border-transparent"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-emerald-200"
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Follow Up & Notes */}
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
                  disabled={
                    submitting || success || isConfirmedRequiredAndMissing
                  }
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium 
             hover:bg-blue-700 transition 
             disabled:bg-blue-300 disabled:cursor-not-allowed 
             shadow-lg shadow-blue-200"
                >
                  {submitting
                    ? "Saving..."
                    : success
                    ? "Saved!"
                    : "Submit Prescription"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddPrescriptionPage;
