import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const LabAssistantContext = createContext(null);

export function LabAssistantProvider({ children }) {
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token on page load
  useEffect(() => {
    const token = localStorage.getItem("reportAssistantToken");
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate token by hitting protected route
    api.get("/report-assistant/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setAssistant(res.data.data.assistant))
      .catch(() => setAssistant(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((assistantData) => {
    setAssistant(assistantData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("reportAssistantToken");
    setAssistant(null);
  }, []);

  return (
    <LabAssistantContext.Provider value={{ assistant, login, logout, loading, isAuthenticated: !!assistant }}>
      {children}
    </LabAssistantContext.Provider>
  );
}

export function useLabAssistant() {
  return useContext(LabAssistantContext);
}
