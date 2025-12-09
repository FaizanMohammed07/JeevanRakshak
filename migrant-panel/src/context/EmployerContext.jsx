import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loginEmployer,
  signupEmployer,
  fetchEmployerProfile,
  listContractorsForEmployer,
} from "../api/employers";

const TOKEN_KEY = "employer-token";

const EmployerContext = createContext(undefined);

export function EmployerProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [employer, setEmployer] = useState(null);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEmployer(null);
    setContractors([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let ignore = false;
    const hydrate = async () => {
      setLoading(true);
      try {
        const profile = await fetchEmployerProfile();
        if (!ignore) {
          setEmployer(profile);
          setError(null);
        }
      } catch (err) {
        console.error("Employer hydrate failed", err);
        if (!ignore) logout();
      } finally {
        if (!ignore) setLoading(false);
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
      const resp = await loginEmployer(credentials);
      const authToken = resp.token;
      if (authToken) {
        localStorage.setItem(TOKEN_KEY, authToken);
        setToken(authToken);
      }
      // fetch profile
      const profile =
        resp.data?.user || resp.employer || (await fetchEmployerProfile());
      setEmployer(profile);
      return profile;
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      const resp = await signupEmployer(payload);
      const authToken = resp.token;
      if (authToken) {
        localStorage.setItem(TOKEN_KEY, authToken);
        setToken(authToken);
      }
      const profile =
        resp.data?.user || resp.employer || (await fetchEmployerProfile());
      setEmployer(profile);
      return resp;
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Good: useCallback ensures this function reference is stable
  // This prevents the infinite loop in your consuming components
  const fetchContractors = useCallback(async () => {
    // REMOVED: setLoading(true);  <-- This was causing the loop
    try {
      const data = await listContractorsForEmployer();
      setContractors(data.contractors || []);
      setError(null);
      return data;
    } catch (err) {
      setError(
        err.response?.data?.msg || err.message || "Failed to load contractors"
      );
      throw err;
    } finally {
      // REMOVED: setLoading(false); <-- This was causing the loop
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      employer,
      contractors,
      loading,
      error,
      login,
      register,
      logout,
      fetchContractors,
      setEmployer,
    }),
    [
      token,
      employer,
      contractors,
      loading,
      error,
      login,
      register,
      logout,
      fetchContractors,
    ]
  );

  return (
    <EmployerContext.Provider value={value}>
      {children}
    </EmployerContext.Provider>
  );
}

export function useEmployer() {
  const ctx = useContext(EmployerContext);
  if (!ctx) throw new Error("useEmployer must be used within EmployerProvider");
  return ctx;
}
