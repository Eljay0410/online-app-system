import { Navigate } from "react-router-dom";
import { getRoleHomePath, getStoredUser, normalizeRole } from "./auth";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user.role);

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={getRoleHomePath(userRole)} replace />;
  }

  return children;
};

export default ProtectedRoute;
