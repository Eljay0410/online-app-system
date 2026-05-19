import { Navigate, useLocation } from "react-router-dom";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "./auth";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }

  if (userRole === "applicant" && user.profileComplete === false) {
    const allowedPaths = new Set(["/profile", "/applications"]);
    if (!allowedPaths.has(location.pathname)) {
      return <Navigate to="/profile" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
