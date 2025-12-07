import { Navigate } from "react-router-dom";
import { useLabAssistant } from "../context/LabAssistantContext";

export default function ProtectedRouteLabAssistant({ children }) {
  const { isAuthenticated, loading } = useLabAssistant();

  if (loading) return null; // Or a loader

  if (!isAuthenticated) {
    return <Navigate to="/lab-assistant/login" replace />;
  }

  return children;
}
