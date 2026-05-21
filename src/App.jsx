import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/layout/Navbar";

import Register from "./features/auth/Register";
import ActivateAccount from "./features/auth/ActivateAccount";
import Login from "./features/auth/Login";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import {
  getAuthenticatedHomePath,
  normalizeRole,
  useAuth,
} from "./features/auth/auth";

import JobOpenings from "./features/jobs/JobOpenings";
import JobDetails from "./features/jobs/JobDetails";

import ApplicantDashboard from "./features/applicant/ApplicantDashboard";
import ApplicantInformation from "./features/applicant/ApplicantInformation";
import ApplicantDocuments from "./features/applicant/ApplicantDocuments";
import Profile from "./features/Profile/Profile";

import AdminDashboard from "./features/admin/AdminDashboard";
import SuperAdminDashboard from "./features/admin/SuperAdminDashboard";

function RedirectToHome() {
  const { user } = useAuth();
  return <Navigate to={user ? getAuthenticatedHomePath(user) : "/"} replace />;
}

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && normalizeRole(user.role) !== "applicant") {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }

  return <JobOpenings />;
}

function PublicJobDetailsRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user && normalizeRole(user.role) !== "applicant") {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }

  return <JobDetails />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      <Navbar />

      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/jobs/:jobId" element={<PublicJobDetailsRoute />} />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/apply"
          element={<Navigate to="/applicant-information" replace />}
        />

        <Route path="/jobopenings" element={<RedirectToHome />} />
        <Route path="/jobs" element={<RedirectToHome />} />
        <Route path="/apply/jobs" element={<RedirectToHome />} />
        <Route path="/about" element={<RedirectToHome />} />
        <Route path="/hr" element={<Navigate to="/admin" replace />} />
        <Route
          path="/applicantdashboard"
          element={<Navigate to="/applications" replace />}
        />
        <Route
          path="/Applicantdashboard"
          element={<Navigate to="/applications" replace />}
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant-information"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantInformation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requirements"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDocuments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["applicant", "admin", "superadmin"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<RedirectToHome />} />
      </Routes>
    </div>
  );
}

export default App;
