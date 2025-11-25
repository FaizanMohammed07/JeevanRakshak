import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { usePatients } from "../context/PatientsContext";

function SearchPage() {
  const navigate = useNavigate();
  const { findPatientByHealthId, upsertPatient } = usePatients();
  const [healthId, setHealthId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmedId = healthId.trim();
    if (!trimmedId) {
      setError("Please enter a Migrant Health ID");
      return;
    }

    // const cachedPatient = findPatientByHealthId(trimmedId);
    // if (cachedPatient) {
    //   navigate(`/patients/${cachedPatient.id}`);
    //   setHealthId("");
    //   return;
    // }

    // setLoading(true);
    setError("");

    // try {
    //   const headers = { "Content-Type": "application/json" };
    //   const token = localStorage.getItem("doctorToken");
    //   if (token) {
    //     headers.Authorization = `Bearer ${token}`;
    //   }

    // const response = await fetch(
    //   "http://localhost:3030/api/doctors/patient-by-phone",
    //   {
    //     method: "POST",
    //     headers,
    //     body: JSON.stringify({ phoneNumber: trimmedId }),
    //   }
    // );

    // const payload = await response.json().catch(() => null);
    // if (!response.ok) {
    //   setError(payload?.msg || payload?.error || "Patient not found");
    //   return;
    // }

    // const normalizedPatient = upsertPatient(
    //   payload?.patient || payload?.data
    // );
    // if (!normalizedPatient) {
    //   setError("Patient not found. Please check the Health ID.");
    // } else {
    setHealthId("");
    navigate(`/patients/${trimmedId}`);
    // }
    // } catch (err) {
    //   console.error(err);
    //   setError("Something went wrong. Please try again.");
    // } finally {
    // setLoading(false);
    // }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Doctor Panel
          </h1>
          <p className="text-gray-600">Kerala SIH 2025 Migrant Health System</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label
              htmlFor="healthId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Enter Migrant Health ID
            </label>
            <input
              type="text"
              id="healthId"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              placeholder="e.g., MH2025001234"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search Patient"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SearchPage;
