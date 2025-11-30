import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchMyProfile, loginPatient } from "../api/patients";

const TOKEN_KEY = "migrant-panel-token";
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setPatient(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setPatient(null);
      return;
    }

    let ignore = false;
    const hydrate = async () => {
      setLoading(true);
      try {
        const profile = await fetchMyProfile();
        if (!ignore) {
          setPatient(profile);
          setError(null);
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
  }, [token, logout]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const response = await loginPatient(credentials);
      const authToken = response.token;
      if (!authToken) {
        throw new Error("Authentication token missing in response");
      }
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
      setPatient(response.patient);
      setError(null);
      return response.patient;
    } catch (err) {
      const message = err.response?.data?.msg || err.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const profile = await fetchMyProfile();
      setPatient(profile);
      return profile;
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      patient,
      setPatient,
      loading,
      error,
      isAuthenticated: Boolean(token && patient),
      login,
      logout,
      refreshProfile,
    }),
    [token, patient, loading, error, login, logout, refreshProfile]
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
