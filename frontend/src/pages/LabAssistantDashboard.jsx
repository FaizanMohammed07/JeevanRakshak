import { useState, useEffect } from "react";
import { Search, UploadCloud, Loader2 } from "lucide-react";
import { usePatients } from "../context/PatientsContext";
import api from "../api/axios";

export default function LabAssistantDashboard() {
  const { findPatientByHealthId, fetchPatient } = usePatients();

  const [inputId, setInputId] = useState("");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ------------------ SEARCH PATIENT ------------------
  const handleSearch = async (e) => {
    e.preventDefault();

    const trimmed = inputId.trim();
    if (!trimmed) {
      setMessage("Please enter a Migrant Health ID");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // 1. check cache first
      let p = findPatientByHealthId(trimmed);

      // 2. if not in cache, fetch from API
      if (!p) {
        p = await fetchPatient(trimmed);
      }

      if (!p) throw new Error("Patient not found");

      setPatient(p);
    } catch (err) {
      setPatient(null);
      setMessage(err.message);
    }
    setLoading(false);
  };

  // ------------------ UPLOAD REPORT ------------------
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a PDF file");
      return;
    }

    if (!doctorName.trim() || !documentName.trim()) {
      setMessage("Please fill all fields");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("pdf", selectedFile);
    formData.append("patientId", patient.id);
    formData.append("doctor", doctorName);
    formData.append("documentName", documentName);

    try {
      await api.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("Report uploaded successfully!");
      setMessageType("success");
      setSelectedFile(null);
      setDoctorName("");
      setDocumentName("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.msg || "Upload failed");
      setMessageType("error");
    }

    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Lab Assistant Dashboard
      </h1>

      {/* ------------------ SEARCH FORM ------------------ */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter Migrant Health ID"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          className="flex-1 p-3 border rounded-lg"
        />
        <button className="bg-purple-600 text-white px-5 py-3 rounded-lg flex items-center gap-2">
          <Search size={18} />
          Search
        </button>
      </form>

      {message && (
        <p
          className={`text-center mb-4 font-semibold ${
            messageType === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {loading && <p className="text-center">Loading...</p>}

      {/* ------------------ DISPLAY PATIENT ------------------ */}
      {patient && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p>
            <strong>Name:</strong> {patient.name}
          </p>
          <p>
            <strong>Age:</strong> {patient.age}
          </p>
          <p>
            <strong>Health ID:</strong> {patient.migrant_health_id}
          </p>
        </div>
      )}

      {/* ------------------ UPLOAD REPORT ------------------ */}
      {patient && (
        <div className="border p-5 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Upload Report</h2>

          {/* Doctor Name */}
          <input
            type="text"
            placeholder="Enter Doctor Name"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            required
          />

          {/* Document Name */}
          <input
            type="text"
            placeholder="Enter Document Name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4"
            required
          />

          {/* PDF File */}
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full mb-4"
            accept="application/pdf"
            required
          />

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-600 text-white px-5 py-3 rounded-lg w-full flex justify-center gap-2"
          >
            {uploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {uploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      )}
    </div>
  );
}
