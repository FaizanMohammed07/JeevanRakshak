import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Mail,
  Lock,
  User,
  Phone,
  FileBadge,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useDoctors } from "../context/DoctorsContext";

function DoctorAuthPage() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, error, clearError } = useDoctors();

  // Toggle between Login (true) and Signup (false)
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    license_number: "",
    specialization: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
  }, [isLoginMode, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let success = false;

    if (isLoginMode) {
      success = await login(formData.phone, formData.password);
    } else {
      // Basic validation for signup
      if (!formData.name || !formData.license_number) {
        // You can add local validation error handling here
      }
      success = await register(formData);
    }

    setIsLoading(false);
    // Navigation handled by useEffect above if success changes auth state
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-teal-500 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Left Side - Decorative (Hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-50 p-12 text-center">
          <div className="bg-white p-6 rounded-full shadow-lg mb-8">
            <Stethoscope className="w-16 h-16 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Migrant Health System
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Join our network of dedicated professionals providing healthcare
            access to migrant workers across Kerala.
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-8 md:hidden">
            <Stethoscope className="w-12 h-12 text-blue-600 mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-gray-800">Portal Access</h2>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isLoginMode ? "Welcome Back, Doctor" : "Create Account"}
          </h1>
          <p className="text-gray-500 mb-8">
            {isLoginMode
              ? "Please sign in to access patient records."
              : "Register your medical license to get started."}
          </p>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Signup Extra Fields */}
            {!isLoginMode && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <FileBadge className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="license_number"
                      placeholder="License No."
                      value={formData.license_number}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="specialization"
                      placeholder="Specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </>
            )}

            {/* Common Fields */}
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  {isLoginMode ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isLoginMode
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="ml-2 text-blue-600 font-bold hover:underline focus:outline-none"
              >
                {isLoginMode ? "Sign Up" : "Log In"}
              </button>
            </p>
          </div>
          <div className="mt-4 text-center">
  <button
    onClick={() => navigate("/lab-assistant/login")}
    className="text-purple-600 font-semibold hover:underline focus:outline-none"
  >
    Lab Assistant Login →
  </button>
</div>
        </div>
      </div>
    </div>
  );
}

export default DoctorAuthPage;
