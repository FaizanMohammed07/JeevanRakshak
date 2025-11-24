import { useState } from "react";
import { ArrowLeft, Upload, File, CheckCircle } from "lucide-react";

function UploadDocument({ patient, onBack, onDocumentUploaded }) {
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (
      !formData.documentName.trim() ||
      !formData.documentType ||
      !formData.uploadedBy.trim()
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const fallbackUrl = URL.createObjectURL(file);
      const newDocument = {
        id: `doc-${Date.now()}`,
        patient_id: patient.id,
        document_name: formData.documentName.trim(),
        document_type: formData.documentType,
        file_url: filePreview || fallbackUrl,
        uploaded_by: formData.uploadedBy.trim(),
        uploaded_at: new Date().toISOString(),
      };

      setSuccess(true);
      setTimeout(() => {
        onDocumentUploaded(newDocument);
      }, 1200);
    } catch (err) {
      setError("Failed to upload document. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
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
            <div>
              <label
                htmlFor="documentName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="documentName"
                name="documentName"
                value={formData.documentName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Blood Test Report"
              />
            </div>

            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">Select document type</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG, PNG, DOC up to 10MB
                    </p>
                  </div>
                </label>
              </div>

              {filePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview:
                  </p>
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {file && !filePreview && (
                <div className="mt-4 flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <File className="w-5 h-5" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="uploadedBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Uploaded By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="uploadedBy"
                name="uploadedBy"
                value={formData.uploadedBy}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your name"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Document uploaded successfully! Redirecting...
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {loading
                  ? "Uploading..."
                  : success
                  ? "Uploaded!"
                  : "Upload Document"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UploadDocument;
