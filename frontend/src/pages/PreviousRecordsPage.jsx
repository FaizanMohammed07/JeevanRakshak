import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ChevronRight,
  User,
  AlertCircle,
  Activity,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function PreviousRecordsPage() {
  const navigate = useNavigate();
  const { doctor } = useAuth(); // doctor user
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const url = `/doctors/${doctor._id}/prescriptions`;

        const res = await api.get(url);

        const data = res.data;
        setRecords(data.prescriptions || []);
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [doctor]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Header */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />
            Previous Records
          </h1>
          <p className="text-gray-600 mt-1">
            View all prescriptions issued by you.
          </p>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <p className="text-gray-600 text-center py-8">Loading records…</p>
        )}

        {/* Records List */}
        {!loading && records.length === 0 && (
          <p className="text-gray-500 text-center py-10">
            No prescriptions found.
          </p>
        )}

        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              onClick={() => navigate(`/patients/${rec.patient.phoneNumber}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  {rec.patient.name}
                </div>

                <p className="text-sm text-gray-500">
                  Age: {rec.patient.age} • {rec.patient.district}
                </p>

                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Disease:</span>{" "}
                  {rec.confirmedDisease || "—"}
                </p>

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="h-4 w-4" />
                  {new Date(rec.dateOfIssue).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <ChevronRight className="h-7 w-7 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
