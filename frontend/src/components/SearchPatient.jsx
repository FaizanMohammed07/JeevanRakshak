import { useState } from "react";
import { Search } from "lucide-react";

function SearchPatient({ patients, onPatientFound }) {
  const [healthId, setHealthId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!healthId.trim()) {
      setError("Please enter a Migrant Health ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const normalizedId = healthId.trim().toLowerCase();
      const patient = patients.find(
        (item) => item.migrant_health_id.toLowerCase() === normalizedId
      );

      if (!patient) {
        setError("Patient not found. Please check the Health ID.");
      } else {
        onPatientFound(patient.id);
        setHealthId("");
      }
    } catch (err) {
      setError("Error searching for patient. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
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

export default SearchPatient;
