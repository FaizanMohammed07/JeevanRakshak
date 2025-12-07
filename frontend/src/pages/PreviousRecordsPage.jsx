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
  const [totalCount, setTotalCount] = useState(0);
  const [uniquePatients, setUniquePatients] = useState(0);

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const url = `/doctors/${doctor._id}/prescriptions`;

        const res = await api.get(url);

        const data = res.data;

        setRecords(data.prescriptions || []);
        setTotalCount(data.count || 0);
        setUniquePatients(data.uniquePatients || 0);
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
          {/* <p className="text-gray-700 font-semibold mt-2">
            Total Prescriptions: {totalCount}
          </p> */}
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {totalCount}
            </h3>
            <p className="text-sm text-gray-600 mb-2">Total Prescriptions</p>
            {/* <p className="text-xs text-gray-500">All time</p> */}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {uniquePatients}
            </h3>
            <p className="text-sm text-gray-600 mb-2">Unique Patients Seen</p>
            {/* <p className="text-xs text-gray-500">All time</p> */}
          </div>
        </div>

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
              key={rec._id}
              // onClick={() => navigate(`/patients/${rec.patient.phoneNumber}`)}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md cursor-pointer transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* LEFT COLUMN — PATIENT INFO */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold text-xl mb-1">
                      <User className="h-5 w-5 text-blue-600" />
                      {rec.patient.name}
                    </div>

                    <p className="text-sm text-gray-500">
                      Age: {rec.patient.age} • {rec.patient.district}
                    </p>
                  </div>

                  {/* <div className="text-xs text-gray-500 mt-4 md:mt-auto">
                    Tap to open patient profile →
                  </div> */}
                </div>

                {/* MIDDLE COLUMN — MEDICAL DETAILS */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">
                      Confirmed:
                    </span>
                    <p className="text-gray-600">
                      {rec.confirmedDisease || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">
                      Suspected:
                    </span>
                    <p className="text-gray-600">
                      {rec.suspectedDisease || "—"}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">
                      Symptoms:
                    </span>
                    <p className="text-gray-600">{rec.symptoms || "—"}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-700">
                      Medicines:
                    </span>
                    <p className="text-gray-600">
                      {rec.medicinesIssued?.length
                        ? rec.medicinesIssued.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* RIGHT COLUMN — DATE */}
                <div className="flex flex-col items-start md:items-end justify-between">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(rec.dateOfIssue).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* <ChevronRight className="h-7 w-7 text-gray-400 self-end mt-4" /> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
