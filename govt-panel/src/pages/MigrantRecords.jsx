import { useEffect, useState } from "react";
import axios from "axios";
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
  const [migrants, setMigrants] = useState([]);
  const [selectedMigrant, setSelectedMigrant] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch latest 10 treated patients
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3030/api/govt/latestPatients",
          {
            withCredentials: true,
          }
        );

        setMigrants(res.data.latest); // prescriptions populated with patient info
      } catch (err) {
        // console.error("Error loading latest patients", err);

        console.error(
          "Error loading latest patients",
          err.response?.data || err
        );
      }
    };

    fetchLatest();
  }, []);

  // ✅ Search patient by phone number
  // const fetchPatient = async () => {
  //   if (!searchTerm) return;

  //   try {
  //     const res = await axios.get(
  //       `http://localhost:3030/api/govt/patient?phoneNumber=${searchTerm}`,
  //       { withCredentials: true }
  //     );

  //     setSelectedMigrant(res.data.patient);
  //     setPrescriptions(res.data.prescriptions);
  //   } catch (err) {
  //     alert("Patient not found!");
  //   }
  // };
  const openProfile = async (patient) => {
    try {
      const res = await axios.get(
        `http://localhost:3030/api/govt/patient?phoneNumber=${patient.phoneNumber}`,
        { withCredentials: true }
      );

      setSelectedMigrant(res.data.patient); // patient details
      setPrescriptions(res.data.prescriptions); // prescription history
    } catch (err) {
      console.error("Error fetching patient data", err.response?.data || err);
    }
  };

  return (
    <div className="p-8">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Migrant Records Management
        </h2>
        <p className="text-gray-600">
          Search and manage individual migrant health records
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />

          <input
            type="text"
            placeholder="Search by Phone Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchPatient()}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Latest Migrants List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {migrants.map((patient) => (
          <div
            key={patient._id}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Badge size={14} />
                    {patient.phoneNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Age</span>
                <span className="font-semibold text-gray-900">
                  {patient.age}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin size={14} /> District
                </span>
                <span className="font-semibold text-gray-900">
                  {patient.district}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <Calendar size={14} /> Last Visit
                </span>

                <span className="font-semibold text-gray-900">
                  {patient.visits?.length
                    ? new Date(patient.visits.at(-1).date).toLocaleDateString()
                    : "No Visits"}
                </span>
              </div>
            </div>
            <button
              onClick={() => openProfile(patient)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View Profile
            </button>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      {selectedMigrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-2xl font-bold text-gray-900">
                Migrant Profile
              </h3>
              <button
                onClick={() => {
                  setSelectedMigrant(null);
                  setPrescriptions([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* ----------- PERSONAL DETAILS ----------- */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="text-blue-600" size={24} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Personal Details
                  </h3>
                </div>

                <div className="flex items-start gap-5">
                  <div className="p-4 bg-blue-100 rounded-xl">
                    <Users className="text-blue-600" size={48} />
                  </div>

                  <div className="flex-1 space-y-2">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {selectedMigrant.name}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
                      <p>
                        <strong>Phone:</strong> {selectedMigrant.phoneNumber}
                      </p>

                      <p>
                        <strong>Age:</strong> {selectedMigrant.age}
                        <span className="mx-2">|</span>
                        <strong>Gender:</strong> {selectedMigrant.gender}
                      </p>

                      <p>
                        <strong>District:</strong> {selectedMigrant.district}
                        <span className="mx-1">→</span>
                        <strong>Taluk:</strong> {selectedMigrant.taluk}
                        <span className="mx-1">→</span>
                        <strong>Village:</strong> {selectedMigrant.village}
                      </p>

                      <p className="md:col-span-2">
                        <strong>Address:</strong> {selectedMigrant.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ----------- MEDICAL INFORMATION ----------- */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Syringe className="text-red-600" size={22} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Medical Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
                  <p>
                    <strong>Blood Group:</strong>{" "}
                    {selectedMigrant.bloodGroup || "N/A"}
                  </p>
                  <p>
                    <strong>Emergency Contact:</strong>{" "}
                    {selectedMigrant.emergencyContact || "N/A"}
                  </p>

                  <p className="md:col-span-2">
                    <strong>Allergies:</strong>{" "}
                    {selectedMigrant.allergies?.length
                      ? selectedMigrant.allergies.join(", ")
                      : "None"}
                  </p>

                  <p className="md:col-span-2">
                    <strong>Chronic Diseases:</strong>{" "}
                    {selectedMigrant.chronicDiseases?.length
                      ? selectedMigrant.chronicDiseases.join(", ")
                      : "None"}
                  </p>

                  <p className="md:col-span-2">
                    <strong>Current Medication:</strong>{" "}
                    {selectedMigrant.currentMedication?.length
                      ? selectedMigrant.currentMedication.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {/* ----------- VACCINATIONS ----------- */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Syringe className="text-green-600" size={22} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Vaccinations
                  </h3>
                </div>

                {selectedMigrant.vaccinations?.length ? (
                  <div className="space-y-3">
                    {selectedMigrant.vaccinations.map((v, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-lg"
                      >
                        <p className="font-semibold text-gray-900">{v.name}</p>
                        <p className="text-sm text-gray-700">
                          Dose: {v.doseNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date:{" "}
                          {v.date
                            ? new Date(v.date).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No vaccination records available.
                  </p>
                )}
              </div>

              {/* ----------- VISIT HISTORY ----------- */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="text-indigo-600" size={22} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Visit History
                  </h3>
                </div>

                {selectedMigrant.visits?.length ? (
                  selectedMigrant.visits.map((visit, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-2"
                    >
                      <p>
                        <strong>Hospital:</strong>{" "}
                        {visit.hospital || visit.place || "N/A"}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(visit.date).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Notes:</strong> {visit.notes || "—"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No visit records found.</p>
                )}
              </div>

              {/* ----------- PRESCRIPTION TIMELINE ----------- */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="text-blue-600" size={22} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Prescription Timeline
                  </h3>
                </div>

                {prescriptions.length ? (
                  prescriptions.map((pres, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 bg-gray-50 rounded-r-lg p-4 mb-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {pres.confirmedDisease || pres.suspectedDisease}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(pres.dateOfIssue).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        Medicines: {pres.medicinesIssued?.join(", ")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">No prescriptions found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MigrantRecords;
