import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { isMobileDevice } from "../lib/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to /home for desktop, /login for mobile
    const redirectPath = isMobileDevice() ? "/login" : "/home";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

