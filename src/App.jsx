import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/layout/PublicNavbar";
import NavbarApplicant from "./components/layout/ApplicantNavbar";

import ApplicationForm from "./features/registration/ApplicationForm";
import ActivateAccount from "./features/auth/ActivateAccount";
import Login from "./features/auth/Login";
import ProtectedRoute from "./features/auth/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";

import JobOpenings from "./features/jobs/JobOpenings";

import ApplicantDashboard from "./features/applicant/ApplicantDashboard";
import ApplicantProfile from "./features/applicant/ApplicantProfile";

import AdminDashboard from "./features/admin/AdminDashboard";
import SuperAdminDashboard from "./features/admin/SuperAdminDashboard";
import ApplyJobs from "./features/applicant/ApplyJobs";

function App() {
  const location = useLocation();

  const everyroute =
    location.pathname === "/profile" ||
    location.pathname.toLowerCase() === "/applicantdashboard" ||
    location.pathname === "/admin" ||
    location.pathname === "/superadmin" ||
    location.pathname === "/hr" ||
    location.pathname === "/applicantview";

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {everyroute ? <NavbarApplicant /> : <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/apply" element={<ApplicationForm />} />
                <Route
        path="/apply/jobs"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplyJobs />
            </ProtectedRoute>
          }
        />

        <Route path="/activate" element={<ActivateAccount />} />

        <Route path="/login" element={<Login />} />

        <Route path="/jobopenings" element={<JobOpenings />} />

        <Route path="/about" element={<About />} />

        <Route
          path="/applicantdashboard"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/Applicantdashboard"
          element={
            <ProtectedRoute allowedRoles={["applicant"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
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
      </Routes>
    </div>
  );
}

export default App;