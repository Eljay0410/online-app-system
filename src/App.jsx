import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./component/Navbar";
import Applicationform from "./component/Applicationform";
import Login from "./component/Login";
import Home from "./component/FormSteps/Home";

function App() {
  return (
    <div className="min-h-screen bg-white font-['Poppins']">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/apply" element={<Applicationform />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  );
}

export default App;