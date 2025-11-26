import { Navigate, useLocation } from "react-router-dom";
import { useDoctors } from "../context/DoctorsContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useDoctors();
  const location = useLocation();

  // 1. Loading State: Wait for the auth check to complete
  // If we don't wait, the app might kick the user out before the token is verified.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg font-medium text-gray-600 animate-pulse">
          Verifying access...
        </div>
      </div>
    );
  }

  // 2. Auth Check: Redirect if not logged in
  if (!isAuthenticated) {
    // Redirect to the specific doctor login route.
    // We save the current location in 'state' so we can redirect them back after login.
    return <Navigate to="/doctors/login" state={{ from: location }} replace />;
  }

  // 3. Access Granted: Render the protected page
  return children;
};

export default ProtectedRoute;
