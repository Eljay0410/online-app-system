import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
<<<<<<< HEAD
import Navbar from "./components/layout/PublicNavbar";
import NavbarApplicant from "./components/layout/ApplicantNavbar";
import ApplicationForm from "./features/registration/ApplicationForm";
import ActivateAccount from "./features/auth/ActivateAccount";
import Login from "./features/auth/Login";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import Home from "./pages/Home";
import JobOpenings from "./features/jobs/JobOpenings";
import About from "./pages/About";
import ApplicantDashboard from "./features/applicant/ApplicantDashboard";
import ApplicantProfile from "./features/applicant/ApplicantProfile";
import AdminDashboard from "./features/admin/AdminDashboard";
import SuperAdminDashboard from "./features/admin/SuperAdminDashboard";
=======
import Navbar from "./component/Navbar";
import NavbarApplicant from "./component/Applicant/Navbar-applicant";
import Applicationform from "./component/Applicant/Applicationform";
import Login from "./component/Login";
import Home from "./component/FormSteps/Home";
import Jobopening from "./component/Hr/Jobopening";
import Aboutpage from "./component/Aboutpage";
import Applicantdash from "./component/Applicant/Applicantdash";
import Applicantprofile from "./component/Applicant/Applicantprofile";
import HRAdminApp from "./component/Hr/Hrdash";
import Applynewdash from "./component/Applicant/Applynewdash";
import ApplicantView from "./component/Applicant/ApplicantView";
>>>>>>> e6e0fa7540dbbe077eb45b3b588e9e4d4fa52754

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
      {everyroute ?  <NavbarApplicant />: <Navbar /> }

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<ApplicationForm />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/login" element={<Login />} />
<<<<<<< HEAD
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
=======
        <Route path="/jobopenings" element={<Jobopening />} />
        <Route path="/about" element={<Aboutpage />} />
        <Route path="/Applicantdashboard" element={<Applicantdash />} />
        <Route path="/profile" element={<Applicantprofile />} />
        <Route path="/hr" element={<HRAdminApp />} />
        <Route path="/applynew" element={<Applynewdash />} />
        <Route path="/applicantview/:id" element={<ApplicantView />} />
>>>>>>> e6e0fa7540dbbe077eb45b3b588e9e4d4fa52754
      </Routes>
    </div>
  );
}

export default App;
