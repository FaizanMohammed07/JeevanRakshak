import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import {
  ClipboardList,
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  UserPlus,
} from "lucide-react";

function LabAssistantAuthPage() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    password: "",
    passwordConfirm: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLoginMode) {
        // LOGIN
        const res = await api.post("/report-assistant/login", {
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        });

        localStorage.setItem("reportAssistantToken", res.data.token);
        navigate("/lab-assistant/dashboard");
      } else {
        // SIGNUP
        await api.post("/report-assistant/signup", formData);
        alert("Signup successful! You can now login.");
        setIsLoginMode(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

        {/* LEFT SIDE (INFO) */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-purple-50 p-12">
          <div className="bg-white p-6 rounded-full shadow-lg mb-8">
            <ClipboardList className="w-16 h-16 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Lab Assistant Portal
          </h2>
          <p className="text-gray-600 leading-relaxed text-center">
            Upload medical reports and manage laboratory records efficiently.
          </p>
        </div>

        {/* RIGHT SIDE (FORM) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8 md:hidden">
            <ClipboardList className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-800">Lab Portal</h2>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLoginMode ? "Lab Assistant Login" : "Create Lab Assistant Account"}
          </h1>
          <p className="text-gray-500 mb-6">
            {isLoginMode
              ? "Enter your credentials to upload patient reports."
              : "Register to access the lab assistant portal."}
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* SIGNUP FIELDS */}
            {!isLoginMode && (
              <>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <input
                    type="password"
                    name="passwordConfirm"
                    placeholder="Confirm Password"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>
              </>
            )}

            {/* COMMON FIELDS */}
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {isLoginMode ? "Login" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* SWITCH MODE */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="ml-2 text-purple-600 font-bold hover:underline"
              >
                {isLoginMode ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>

          {/* Back to Doctor Login */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/doctors/login")}
              className="text-blue-600 font-semibold hover:underline"
            >
              ← Back to Doctor Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabAssistantAuthPage;
