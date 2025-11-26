import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import {
  User,
  Bell,
  Shield,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function Settings() {
  const { doctor, updateDoctor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    if (doctor) {
      setName(doctor.name);
      setPhone(doctor.phone);
      setSpecialization(doctor.specialization);
      setLanguages(doctor.languages || []);
    }
  }, [doctor]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (!doctor) throw new Error("Doctor profile not loaded");

      // TODO: Replace updateDoctor with an API call when backend is ready
      updateDoctor({
        name,
        phone,
        specialization,
        languages,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const availableLanguages = [
    "English",
    "Malayalam",
    "Hindi",
    "Tamil",
    "Telugu",
    "Kannada",
    "Bengali",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account and preferences
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800 font-semibold">
              Profile updated successfully!
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Profile Information
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={doctor?.email || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                License Number
              </label>
              <input
                type="text"
                value={doctor?.license_number || ""}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                License number cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Languages Spoken
              </label>
              <div className="flex flex-wrap gap-3">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      languages.includes(lang)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Notification Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">Emergency Alerts</p>
                <p className="text-sm text-gray-600">
                  Receive notifications for critical cases
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">Follow-up Reminders</p>
                <p className="text-sm text-gray-600">
                  Get reminded about upcoming follow-ups
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Chronic Disease Alerts
                </p>
                <p className="text-sm text-gray-600">
                  Alerts for patients with deteriorating conditions
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Security & Privacy
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Hospital:</span>{" "}
                {doctor?.hospital_id}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Approval Status:</span>{" "}
                <span className="text-green-600 font-medium">Approved</span>
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                All your actions are logged for security and compliance. Patient
                data is protected with end-to-end encryption and follows all
                healthcare privacy regulations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
