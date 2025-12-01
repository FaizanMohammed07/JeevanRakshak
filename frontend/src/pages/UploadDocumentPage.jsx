import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, File, CheckCircle } from "lucide-react";
import { usePatients, useFetchPatient } from "../context/PatientsContext";
import api from "../api/axios";

const documentTypes = [
  "Lab Report",
  "X-Ray",
  "MRI Scan",
  "CT Scan",
  "Prescription",
  "Discharge Summary",
  "Medical Certificate",
  "Other",
];

function UploadDocumentPage() {
  const navigate = useNavigate();
  const {  patientId } = useParams();
  const { addDocument } = usePatients();
  const { patient, loading2 } = useFetchPatient(patientId);

  // -----------------------
  // ✅ ALL HOOKS MUST BE HERE
  // -----------------------

  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "",
    uploadedBy: "",
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  // -----------------------
  // ❗ CONDITIONAL RETURNS ONLY AFTER HOOKS
  // -----------------------

  if (loading2) {
    return <div className="p-6">Loading patient data...</div>;
  }

  if (!patient) {
    return <div className="p-6 text-red-600">Patient not found.</div>;
  }

  // -----------------------
  // Handlers
  // -----------------------

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result?.toString() || "");
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!formData.documentName || !formData.documentType || !formData.uploadedBy) {
      setError("Please fill in all fields");
      return;
    }

    if (!file) {
      setError("Please select a file");
      return;
    }

    const form = new FormData();
    form.append("patientId", patient?.id);
    form.append("doctor", formData.uploadedBy);
    form.append("documentName", formData.documentName);
    form.append("notes", formData.documentType);
    form.append("pdf", file); // Important field name

    try {
      setLoading(true);
      const res = await api.post("/reports", form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

     const savedDocument =
          res.data?.report || res.data?.data;

        if (!savedDocument) {
          throw new Error("Server did not return the new document data");
        }

      setSuccess(true);

      setTimeout(() => {
        navigate(`/patients/${patientId}`);
      }, 1000);

    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // UI SECTION
  // -----------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        
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
          
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Upload Document
            </h2>
            <p className="text-gray-600">
              Patient: {patient.name} ({patient.migrant_health_id})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Document Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="documentName"
                name="documentName"
                value={formData.documentName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Blood Test Report"
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : "Click to upload PDF"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Only PDF allowed
                    </p>
                  </div>
                </label>
              </div>

              {/* File Preview */}
              {filePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img
                    src={filePreview}
                    className="max-w-full h-48 object-cover rounded-lg"
                    alt="Preview"
                  />
                </div>
              )}

              {file && !filePreview && (
                <div className="mt-4 flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                  <File className="w-5 h-5" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {/* Uploaded By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uploaded By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="uploadedBy"
                name="uploadedBy"
                value={formData.uploadedBy}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="Enter your name"
              />
            </div>

            {/* Errors */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Document uploaded successfully! Redirecting...
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-gray-200 py-3 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                {loading ? "Uploading..." : success ? "Uploaded!" : "Upload Document"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadDocumentPage;
