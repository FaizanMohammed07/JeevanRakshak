import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate } from "react-router-dom";

function GovtProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await axios.get("http://localhost:8080/api/govt/check", {
          withCredentials: true,
        });
        setAllowed(true);
      } catch {
        setAllowed(false);
      }
      setLoading(false);
    };
    check();
  }, []);

  if (loading) return <div>Loading...</div>;

  return allowed ? children : <Navigate to="/govt/login" replace />;
}

export default GovtProtectedRoute;
