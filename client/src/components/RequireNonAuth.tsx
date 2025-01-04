import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../app/auth";

interface RequireNonAuthProps {
  children: React.ReactNode;
}

export const RequireNonAuth: React.FC<RequireNonAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    // Redirect to the page they came from, or /app as default
    const from =
      (location.state as { from?: Location })?.from?.pathname || "/app";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
