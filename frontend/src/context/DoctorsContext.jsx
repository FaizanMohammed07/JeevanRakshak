import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import api from "../api/axios";
const DoctorsContext = createContext(undefined);

export function DoctorsProvider({ children }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // We ask the backend: "Is the cookie valid?"
        // Browser automatically sends the httpOnly cookie here.
        const response = await api.get("/doctors/me");

        if (response.data?.data?.user) {
          setDoctor(response.data.data.user);
        }
      } catch (err) {
        // If 401 (Unauthorized), it means no valid cookie.
        // We stay logged out (doctor is null).
        setDoctor(null);
      } finally {
        // 3. STOP LOADING regardless of success or failure
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // 1. Login Action
  const login = useCallback(async (phoneNumber, password) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`/doctors/login`, {
        phoneNumber,
        password,
      });

      const data = response.data;

      // Just update state, no persistence for now
      if (data.data && data.data.user) {
        setDoctor(data.data.user);
      }

      return true;
    } catch (err) {
      const message = err.response?.data?.msg || "Login failed";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Register Action
  const register = useCallback(async (doctorData) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post(`/doctors/signup`, { doctorData });

      const data = response.data;

      // Auto-login on success if backend returns the user
      if (data.data && data.data.user) {
        setDoctor(data.data.user);
      }

      return true;
    } catch (err) {
      const message = err.response?.data?.msg || "Sign Up failed";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Logout Action
  const logout = useCallback(async () => {
    try {
      // Call the backend to clear the HttpOnly cookie
      await api.get("/doctors/logout");
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      // Always clear the local state, even if the API fails (e.g., network error)
      setDoctor(null);
      setError("");
    }
  }, []);

  const updateDoctor = useCallback((updates) => {
    setDoctor((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  // 4. Clear Errors
  const clearError = useCallback(() => setError(""), []);

  const value = useMemo(
    () => ({
      doctor,
      isAuthenticated: !!doctor,
      loading,
      error,
      login,
      register,
      logout,
      signOut: logout,
      updateDoctor,
      clearError,
    }),
    [doctor, loading, error, login, register, logout, updateDoctor, clearError]
  );

  return (
    <DoctorsContext.Provider value={value}>{children}</DoctorsContext.Provider>
  );
}

// Custom Hook
export function useDoctors() {
  const context = useContext(DoctorsContext);
  if (!context) {
    throw new Error("useDoctors must be used within a DoctorsProvider");
  }
  return context;
}
