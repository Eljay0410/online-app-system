import React from "react";
import { useNavigate } from "react-router-dom";
import sdoLogo from "../../assets/sdologo.svg";

const Home = () => {
  const navigate = useNavigate();

  return (
    <main className="pt-32 md:pt-40 pb-16 px-4">
      <div className="max-w-7xl mx-auto text-center">

        <div className="flex justify-center mb-6">
          <img
            src={sdoLogo}
            alt="SDO Logo"
            className="h-20 md:h-24 w-auto object-contain"
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Your Future <span className="text-[#0056b3]">Starts Here</span>
        </h1>

        <p className="text-base md:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Join the Department of Education and be part of building a better
          future through quality public service and education.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/jobopenings")}
            className="bg-[#0056b3] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#003a78] transition-all 
             active:scale-95"
          >
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