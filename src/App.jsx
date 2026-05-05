import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./component/Navbar";
import NavbarApplicant from "./component/Navbar-applicant";
import Applicationform from "./component/Applicationform";
import Login from "./component/Login";
import Home from "./component/FormSteps/Home";
import Jobopening from "./component/Jobopening";
import Aboutpage from "./component/Aboutpage";
import Applicantdash from "./component/Applicantdash";
import Applicantprofile from "./component/Applicantprofile";

function App() {

  const location = useLocation();

  const everyroute =
    location.pathname === "/applicantdashboard" ||
    location.pathname === "/superadmin" ||
    location.pathname === "/hr";
    

  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      {everyroute ?  <NavbarApplicant />: <Navbar /> }

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Applicationform />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobopenings" element={<Jobopening />} />
        <Route path="/about" element={<Aboutpage />} />
        <Route path="/Applicantdashboard" element={<Applicantdash />} />
        <Route path="/profile" element={<Applicantprofile />} />
      </Routes>
    </div>
  );
}

export default App;