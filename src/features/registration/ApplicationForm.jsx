import { Navigate, useLocation } from "react-router-dom";
import { normalizeRole, useAuth } from "../auth/auth";

export default function ApplicationForm() {
  const { user } = useAuth();
  const location = useLocation();
  const jobId = new URLSearchParams(location.search).get("jobId") || "";

  if (!user) {
    return <Navigate to="/register" replace />;
  }

  if (normalizeRole(user.role) !== "applicant") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <Navigate
      to={jobId ? `/profile?jobId=${jobId}` : "/profile"}
      replace
    />
  );
}
