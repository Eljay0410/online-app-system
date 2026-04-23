import React from "react";
import { useNavigate } from "react-router-dom";
import sdoLogo from "../../assets/sdologo.svg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="pt-40 pb-16 px-4">
      <div className="max-w-7xl mx-auto text-center">

        {/* LOGO */}
        <div className="flex justify-center mb-4">
        <img
            src={sdoLogo}
            alt="SDO Logo"
            className="h-50 w-auto object-contain"
            />
        </div>

        {/* TITLE */}
        <h1 className="text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Your Future <span className="text-[#0056b3]">Starts Here</span>
        </h1>

        {/* DESCRIPTION */}
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Join a world-class team and build the next generation of online
          solutions. Find your dream role today.
        </p>

        {/* BUTTONS */}
        <div className="flex gap-4 justify-center">
          <button className="bg-[#0056b3] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#003a78] transition-all">
            Browse Openings
          </button>

          <button
            onClick={() => navigate("/apply")}
            className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-full font-bold text-lg hover:border-[#003a78] hover:text-[#003a78] transition-all"
          >
            Apply Now
          </button>
        </div>

      </div>
    </main>
  );
};

export default Home;