import { ReactNode, FC } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../app/auth";

interface RequireAuthProps {
  children: ReactNode;
}
export const RequireAuth: FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace></Navigate>;
  }

  return children ? <>{children}</> : <Outlet></Outlet>;
};
