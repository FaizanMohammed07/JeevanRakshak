import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search,
  Users,
  Badge,
  Calendar,
  MapPin,
  X,
  Syringe,
  FileText,
} from "lucide-react";

function MigrantRecords() {
  const navigate = useNavigate();
  const { migrantId } = useParams();

  const migrants = useMemo(
    () => [
      {
        id: "MH2024001",
        name: "Rajesh Kumar",
        age: 32,
        district: "Ernakulam",
        lastVisit: "2 days ago",
        camp: "Kochi Construction Camp 3",
        vaccinated: true,
      },
      {
        id: "MH2024002",
        name: "Suresh Babu",
        age: 28,
        district: "Thiruvananthapuram",
        lastVisit: "1 week ago",
        camp: "Trivandrum Labor Camp 12",
        vaccinated: false,
      },
      {
        id: "MH2024003",
        name: "Anil Kumar",
        age: 35,
        district: "Kozhikode",
        lastVisit: "3 days ago",
        camp: "Kozhikode Camp Site A",
        vaccinated: true,
      },
      {
        id: "MH2024004",
        name: "Vikram Singh",
        age: 29,
        district: "Thrissur",
        lastVisit: "1 day ago",
        camp: "Thrissur Industrial Camp",
        vaccinated: true,
      },
      {
        id: "MH2024005",
        name: "Prakash Reddy",
        age: 40,
        district: "Kollam",
        lastVisit: "5 days ago",
        camp: "Kollam Seafront Camp",
        vaccinated: false,
      },
      {
        id: "MH2024006",
        name: "Mohan Lal",
        age: 26,
        district: "Palakkad",
        lastVisit: "4 days ago",
        camp: "Palakkad Agricultural Camp",
        vaccinated: true,
      },
    ],
    []
  );

  const [selectedMigrant, setSelectedMigrant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!migrantId) {
      setSelectedMigrant(null);
      return;
    }
    const match = migrants.find((migrant) => migrant.id === migrantId);
    if (!match) {
      setSelectedMigrant(null);
      navigate("/migrants", { replace: true });
      return;
    }
    setSelectedMigrant(match);
  }, [migrantId, migrants, navigate]);

  const healthTimeline = [
    {
      date: "2024-11-20",
      event: "General Check-up",
      status: "Healthy",
      doctor: "Dr. Priya Kumar",
    },
    {
      date: "2024-11-15",
      event: "Vaccination - Hepatitis B",
      status: "Completed",
      doctor: "Nurse Station",
    },
    {
      date: "2024-11-08",
      event: "Treatment - Fever",
      status: "Recovered",
      doctor: "Dr. Suresh Menon",
    },
    {
      date: "2024-11-01",
      event: "Initial Health Screening",
      status: "Completed",
      doctor: "Camp Medical Officer",
    },
  ];

  const filteredMigrants = migrants.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Migrant Records Management
        </h2>
        <p className="text-gray-600">
          Search and manage individual migrant health records
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by Migrant Health ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMigrants.map((migrant) => (
          <div
            key={migrant.id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{migrant.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Badge size={14} />
                    {migrant.id}
                  </p>
                </div>
              </div>
              {migrant.vaccinated && (
                <div className="p-1 bg-green-100 rounded-full">
                  <Syringe className="text-green-600" size={16} />
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Age</span>
                <span className="font-semibold text-gray-900">
                  {migrant.age} years
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin size={14} />
                  District
                </span>
                <span className="font-semibold text-gray-900">
                  {migrant.district}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar size={14} />
                  Last Visit
                </span>
                <span className="font-semibold text-gray-900">
                  {migrant.lastVisit}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedMigrant(migrant);
                navigate(`/migrants/${migrant.id}`);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {selectedMigrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">
                Migrant Profile
              </h3>
              <button
                onClick={() => {
                  setSelectedMigrant(null);
                  navigate("/migrants");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-4 bg-blue-100 rounded-xl">
                  <Users className="text-blue-600" size={48} />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedMigrant.name}
                  </h4>
                  <p className="text-gray-600 flex items-center gap-2 mb-2">
                    <Badge size={16} />
                    Health ID: {selectedMigrant.id}
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                      Age: {selectedMigrant.age}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                      {selectedMigrant.district}
                    </span>
                    {selectedMigrant.vaccinated && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Syringe size={14} />
                        Vaccinated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Current Camp</p>
                  <p className="font-semibold text-gray-900">
                    {selectedMigrant.camp}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Last Medical Visit
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedMigrant.lastVisit}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Syringe className="text-blue-600" size={20} />
                  <h4 className="text-lg font-bold text-gray-900">
                    Vaccination Status
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-gray-700">
                      Hepatitis B
                    </span>
                    <span className="text-xs font-semibold text-green-700">
                      ✓ Done
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-gray-700">
                      Tetanus
                    </span>
                    <span className="text-xs font-semibold text-green-700">
                      ✓ Done
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-gray-700">
                      Typhoid
                    </span>
                    <span className="text-xs font-semibold text-yellow-700">
                      ⊗ Pending
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm font-medium text-gray-700">
                      COVID-19 Booster
                    </span>
                    <span className="text-xs font-semibold text-yellow-700">
                      ⊗ Pending
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-blue-600" size={20} />
                  <h4 className="text-lg font-bold text-gray-900">
                    Health Timeline
                  </h4>
                </div>
                <div className="space-y-3">
                  {healthTimeline.map((record, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {record.event}
                        </span>
                        <span className="text-xs text-gray-600">
                          {record.date}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Status:{" "}
                        <span className="font-semibold">{record.status}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        By: {record.doctor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Edit Missing Info
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MigrantRecords;
