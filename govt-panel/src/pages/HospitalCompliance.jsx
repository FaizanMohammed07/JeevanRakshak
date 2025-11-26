import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Users,
} from "lucide-react";
import { slugify } from "../utils/slugify";

function HospitalCompliance() {
  const navigate = useNavigate();
  const { hospitalSlug } = useParams();

  const hospitals = useMemo(
    () => [
      {
        name: "General Hospital Thiruvananthapuram",
        district: "Thiruvananthapuram",
        reports: 8,
        doctors: 12,
        status: "compliant",
      },
      {
        name: "Medical College Kochi",
        district: "Ernakulam",
        reports: 15,
        doctors: 24,
        status: "compliant",
      },
      {
        name: "District Hospital Kozhikode",
        district: "Kozhikode",
        reports: 6,
        doctors: 9,
        status: "pending",
      },
      {
        name: "Taluk Hospital Thrissur",
        district: "Thrissur",
        reports: 0,
        doctors: 5,
        status: "missing",
      },
      {
        name: "Community Health Centre Kollam",
        district: "Kollam",
        reports: 4,
        doctors: 6,
        status: "compliant",
      },
      {
        name: "Primary Health Centre Palakkad",
        district: "Palakkad",
        reports: 2,
        doctors: 3,
        status: "pending",
      },
      {
        name: "Medical College Kannur",
        district: "Kannur",
        reports: 12,
        doctors: 18,
        status: "compliant",
      },
      {
        name: "District Hospital Alappuzha",
        district: "Alappuzha",
        reports: 0,
        doctors: 7,
        status: "missing",
      },
      {
        name: "General Hospital Pathanamthitta",
        district: "Pathanamthitta",
        reports: 5,
        doctors: 8,
        status: "compliant",
      },
      {
        name: "Taluk Hospital Malappuram",
        district: "Malappuram",
        reports: 3,
        doctors: 4,
        status: "pending",
      },
    ],
    []
  );

  const activeHospital = useMemo(() => {
    if (!hospitalSlug) return null;
    return (
      hospitals.find((hospital) => slugify(hospital.name) === hospitalSlug) ??
      null
    );
  }, [hospitalSlug, hospitals]);

  useEffect(() => {
    if (!hospitalSlug || activeHospital) return;
    navigate("/hospitals", { replace: true });
  }, [hospitalSlug, activeHospital, navigate]);

  const statusConfig = {
    compliant: {
      icon: CheckCircle,
      badge: "bg-green-100 text-green-800 border-green-300",
      iconColor: "text-green-600",
      label: "Compliant",
    },
    pending: {
      icon: AlertCircle,
      badge: "bg-orange-100 text-orange-800 border-orange-300",
      iconColor: "text-orange-600",
      label: "Pending",
    },
    missing: {
      icon: XCircle,
      badge: "bg-red-100 text-red-800 border-red-300",
      iconColor: "text-red-600",
      label: "Missing",
    },
  };

  const stats = {
    compliant: hospitals.filter((h) => h.status === "compliant").length,
    pending: hospitals.filter((h) => h.status === "pending").length,
    missing: hospitals.filter((h) => h.status === "missing").length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Hospital Reporting Compliance
        </h2>
        <p className="text-gray-600">
          Track daily reporting from healthcare facilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-600" size={32} />
            <span className="text-3xl font-bold text-gray-900">
              {stats.compliant}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">
            Compliant Hospitals
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="text-orange-600" size={32} />
            <span className="text-3xl font-bold text-gray-900">
              {stats.pending}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Pending Reports</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="text-red-600" size={32} />
            <span className="text-3xl font-bold text-gray-900">
              {stats.missing}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Missing Reports</p>
        </div>
      </div>

      {activeHospital && (
        <div className="mb-6 bg-white border border-blue-200 rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-blue-600 tracking-wide">
              Selected hospital
            </p>
            <h3 className="text-xl font-bold text-gray-900">
              {activeHospital.name}
            </h3>
            <p className="text-sm text-gray-600">
              District: {activeHospital.district}
            </p>
            <p className="text-sm text-gray-600">
              Reports today: {activeHospital.reports}
            </p>
          </div>
          <button
            onClick={() => navigate("/hospitals")}
            className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium"
          >
            Clear Selection
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-600" size={24} />
              <h3 className="text-xl font-bold text-gray-900">
                Hospital Status
              </h3>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Export Report
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                Send Reminder
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Hospital Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  District
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Reports Today
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Doctors Active
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {hospitals.map((hospital, index) => {
                const config = statusConfig[hospital.status];
                const StatusIcon = config.icon;
                const isActive = activeHospital?.name === hospital.name;
                return (
                  <tr
                    key={index}
                    onClick={() =>
                      navigate(`/hospitals/${slugify(hospital.name)}`)
                    }
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isActive ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="text-blue-600" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {hospital.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {hospital.district}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                          hospital.reports > 0
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {hospital.reports} Reports
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="text-gray-400" size={16} />
                        <span className="text-sm font-medium text-gray-900">
                          {hospital.doctors}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${config.badge}`}
                      >
                        <StatusIcon size={14} className={config.iconColor} />
                        {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default HospitalCompliance;
