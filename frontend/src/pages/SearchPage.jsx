import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, FileText, Search, User } from "lucide-react";
import { usePatients } from "../context/PatientsContext";
import DashboardLayout from "../components/DashboardLayout";

function SearchPage() {
  const navigate = useNavigate();
  const { findPatientByHealthId, fetchPatient } = usePatients();
  const [healthId, setHealthId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewPatient, setPreviewPatient] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMessage, setPreviewMessage] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmedId = healthId.trim();
    if (!trimmedId) {
      setError("Please enter a Migrant Health ID");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let patient = findPatientByHealthId(trimmedId);
      if (!patient) {
        patient = await fetchPatient(trimmedId);
      }

      if (!patient) {
        throw new Error("Patient not found");
      }

      setHealthId("");
      navigate(`/patients/${trimmedId}`);
    } catch (err) {
      setError(err.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const trimmedInput = healthId.trim();

  useEffect(() => {
    if (!trimmedInput) {
      setPreviewPatient(null);
      setPreviewMessage("");
      setPreviewLoading(false);
      return;
    }

    const cached = findPatientByHealthId(trimmedInput);
    if (cached) {
      setPreviewPatient(cached);
      setPreviewMessage("");
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewMessage("");
      try {
        const patient = await fetchPatient(trimmedInput);
        if (!cancelled) {
          setPreviewPatient(patient);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewPatient(null);
          setPreviewMessage(err.message || "No matching patient yet");
        }
      } finally {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
    };
  }, [trimmedInput, findPatientByHealthId, fetchPatient]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Patient</h1>
          <p className="text-gray-600 mt-1">
            Search migrant workers by Smart Health ID. Enter the ID to view a
            patient profile instantly.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Smart Health ID
                </p>
                <p className="text-sm text-blue-800">
                  High-confidence lookup preferred by Kerala Migrant Health
                  System
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="healthId"
                  value={healthId}
                  onChange={(e) => setHealthId(e.target.value)}
                  placeholder="Enter Smart Health ID (e.g., MH2025001234)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>

              <button
                type="button"
                onClick={() => setHealthId("")}
                className="px-6 py-3 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          )}
        </div>

        {trimmedInput && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Suggested Match for {trimmedInput}
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-start justify-between gap-4">
              <div className="flex gap-4 flex-1">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {previewPatient ? previewPatient.name : "Patient preview"}
                    </h3>
                    {previewLoading && (
                      <span className="text-xs font-medium text-blue-600">
                        Checking records…
                      </span>
                    )}
                  </div>

                  {previewPatient ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>
                          Smart ID:{" "}
                          {previewPatient.migrant_health_id || trimmedInput}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>
                          {previewPatient.age
                            ? `${previewPatient.age} yrs • `
                            : ""}
                          {previewPatient.gender || "Gender N/A"}
                        </span>
                      </div>
                      {previewPatient.blood_group && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Blood Group: {previewPatient.blood_group}</span>
                        </div>
                      )}
                      {previewPatient.chronic_diseases?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span>
                            Chronic:{" "}
                            {previewPatient.chronic_diseases
                              .slice(0, 3)
                              .join(", ")}
                            {previewPatient.chronic_diseases.length > 3
                              ? "…"
                              : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {previewMessage ||
                        "Enter a full Smart Health ID to preview"}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  previewPatient && navigate(`/patients/${trimmedInput}`)
                }
                disabled={!previewPatient}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap disabled:bg-blue-200 disabled:cursor-not-allowed"
              >
                View Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default SearchPage;
