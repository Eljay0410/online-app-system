import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Applicationform from "./component/Applicationform";
import Login from "./component/Login";
import Home from "./component/FormSteps/Home";
import Jobopening from "./component/Jobopening";
import Aboutpage from "./component/Aboutpage";

function App() {
  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Applicationform />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jobopenings" element={<Jobopening />} />
        <Route path="/about" element={<Aboutpage />} />
      </Routes>
    </div>
  );
}

export default App;