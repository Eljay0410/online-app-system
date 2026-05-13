import React from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/layout/PublicNavbar";
import NavbarApplicant from "./components/layout/ApplicantNavbar";

import ApplicationForm from "./features/registration/ApplicationForm";
import ActivateAccount from "./features/auth/ActivateAccount";
import Login from "./features/auth/Login";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import { getStoredUser } from "./features/auth/auth";

import JobOpenings from "./features/jobs/JobOpenings";
import JobDetails from "./features/jobs/JobDetails";

import ApplicantDashboard from "./features/applicant/ApplicantDashboard";
import ApplicantProfile from "./features/applicant/ApplicantProfile";

import AdminDashboard from "./features/admin/AdminDashboard";
import SuperAdminDashboard from "./features/admin/SuperAdminDashboard";

function RedirectToHome() {
  return <Navigate to="/" replace />;
}

function App() {
  const user = getStoredUser();
  const showApplicantNav = Boolean(user);

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {showApplicantNav ? <NavbarApplicant /> : <Navbar />}

      <Routes>
        <Route path="/" element={<JobOpenings />} />
        <Route path="/jobs/:jobId" element={<JobDetails />} />
        <Route path="/jobopenings" element={<RedirectToHome />} />
        <Route path="/jobs" element={<RedirectToHome />} />
        <Route path="/apply/jobs" element={<RedirectToHome />} />
        <Route path="/about" element={<RedirectToHome />} />
        <Route path="/hr" element={<Navigate to="/admin" replace />} />

        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/register" element={<Navigate to="/apply" replace />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applicantdashboard"
          element={<Navigate to="/applications" replace />}
        />
        <Route
          path="/Applicantdashboard"
          element={<Navigate to="/applications" replace />}
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantProfile />
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
