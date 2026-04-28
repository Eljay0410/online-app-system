import React from "react";
import sdoLogo from "../assets/sdologo.svg";

const Aboutpage = () => {
  return (
    <main className="min-h-screen bg-white pt-32 px-6 pb-16">
      <div className="max-w-5xl mx-auto text-center">

        {/* LOGO */}
        <div className="flex justify-center mb-6">
          <img
            src={sdoLogo}
            alt="DepEd Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">
          About the System
        </h1>

        {/* DESCRIPTION */}
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          The Department of Education Online Application System is designed to
          streamline and simplify the hiring process for applicants seeking to
          join the Schools Division Office of City of San Jose del Monte.
        </p>

      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mt-10">

        {/* MISSION */}
        <div className="p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <h3 className="text-xl font-semibold text-[#0056b3] mb-3">
            Our Mission
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            To provide an efficient, transparent, and accessible platform for
            job applicants, ensuring equal opportunities for all individuals
            who wish to serve in the education sector.
          </p>
        </div>

        {/* VISION */}
        <div className="p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <h3 className="text-xl font-semibold text-[#0056b3] mb-3">
            Our Vision
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            To become a modern and fully digital recruitment system that
            supports the continuous improvement of education through
            competent and qualified professionals.
          </p>
        </div>

        {/* PURPOSE */}
        <div className="p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <h3 className="text-xl font-semibold text-[#0056b3] mb-3">
            Our Purpose
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            This system allows applicants to easily browse job openings,
            submit applications, and track their status while helping the
            Department manage recruitment efficiently.
          </p>
        </div>

      </div>

      {/* FOOTER NOTE */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Department of Education – Schools Division Office.
          All rights reserved.
        </p>
      </div>
    </main>
  );
};

export default Aboutpage;