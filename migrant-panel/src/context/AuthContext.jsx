import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMyProfile, loginPatient } from "../api/patients";
// Assuming fetchContractorProfile exists to restore session on refresh
import {
  loginContractor,
  signupContractor,
  fetchContractorProfile,
} from "../api/contractors";

const TOKEN_KEY = "migrant-panel-token";
const ROLE_KEY = "migrant-panel-role"; // New key to track user type

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [role, setRole] = useState(
    () => localStorage.getItem(ROLE_KEY) || "user"
  ); // Default to user

  const [patient, setPatient] = useState(null);
  const [contractor, setContractor] = useState(null); // New state for contractor

  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setToken(null);
    setPatient(null);
    setContractor(null);
    setRole(null);
    setError(null);
  }, []);

  // 1. Hydration Logic (Restore session on refresh)
  useEffect(() => {
    if (!token) {
      setLoading(false);
      setPatient(null);
      setContractor(null);
      return;
    }

    let ignore = false;
    const hydrate = async () => {
      setLoading(true);
      try {
        // Decide which profile to fetch based on the stored role
        if (role === "contractor") {
          const profile = await fetchContractorProfile();
          if (!ignore) {
            setContractor(profile);
            setError(null);
          }
        } else {
          // Default to patient
          const profile = await fetchMyProfile();
          if (!ignore) {
            setPatient(profile);
            setError(null);
          }
        }
      } catch (err) {
        console.error("Auth hydrate failed", err);
        if (!ignore) {
          logout();
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    hydrate();

    return () => {
      ignore = true;
    };
  }, [token, role, logout]);

  // 2. Unified Login Logic
  const login = useCallback(async (credentials) => {
    setLoading(true);
    const isContractorLogin = credentials.role === "contractor";

    try {
      let response;

      if (isContractorLogin) {
        response = await loginContractor(credentials);
      } else {
        response = await loginPatient(credentials);
      }

      const authToken = response.token;
      if (!authToken) {
        throw new Error("Authentication token missing in response");
      }

      // Save to LocalStorage
      localStorage.setItem(TOKEN_KEY, authToken);
      localStorage.setItem(ROLE_KEY, isContractorLogin ? "contractor" : "user");

      // Update State
      setToken(authToken);
      setRole(isContractorLogin ? "contractor" : "user");

      if (isContractorLogin) {
        setContractor(response.contractor);
        setPatient(null); // Ensure no patient state lingers
        return response.contractor;
      } else {
        setPatient(response.patient);
        setContractor(null);
        return response.patient;
      }
    } catch (err) {
      const message = err.response?.data?.msg || err.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Registration Logic (Specifically for Contractors based on request)
  const register = useCallback(async (data) => {
    setLoading(true);
    const isContractorSignup = data.role === "contractor";

    try {
      let response;

      if (isContractorSignup) {
        response = await signupContractor(data);
        // Assuming signup returns { token, contractor: {...} } similar to login
        // If it doesn't return a token (e.g., email verification required), handle accordingly.

        const authToken = response.token;
        if (authToken) {
          localStorage.setItem(TOKEN_KEY, authToken);
          localStorage.setItem(ROLE_KEY, "contractor");
          setToken(authToken);
          setRole("contractor");
          setContractor(response.contractor);
          setPatient(null);
        }
        console.log("Contractor registered:", response.contractor);
        return response;
      } else {
        // Placeholder if you add patient signup later
        throw new Error(
          "Patient registration not implemented in this context yet."
        );
      }
    } catch (err) {
      const message =
        err.response?.data?.msg || err.message || "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      let profile;
      if (role === "contractor") {
        profile = await fetchContractorProfile();
        setContractor(profile);
      } else {
        profile = await fetchMyProfile();
        setPatient(profile);
      }
      return profile;
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  }, [token, role, logout]);

  const value = useMemo(
    () => ({
      token,
      role, // Exposed so UI knows if user is contractor or patient
      patient,
      contractor,
      setPatient,
      setContractor,
      loading,
      error,
      // Authenticated if token exists AND (patient profile OR contractor profile exists)
      isAuthenticated: Boolean(token && (patient || contractor)),
      login,
      register, // Exported register function
      logout,
      refreshProfile,
    }),
    [
      token,
      role,
      patient,
      contractor,
      loading,
      error,
      login,
      register,
      logout,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
