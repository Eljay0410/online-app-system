import React, { useState } from "react";
import { Search } from "lucide-react";

export default function ApplicantDash() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    console.log("Search keyword:", keyword);
    console.log("Search location:", location);

    // Later pwede mo ito i-connect sa job listing/filter page
  };

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8">
          JOIN <span className="text-[#0056b3]">DepEd TEAM</span>
        </h2>
      
          {/* SEARCH BOX */}
          <form
            onSubmit={handleSearch}
            className="mx-auto flex w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-white"
          >
            {/* FIND JOBS */}
            <div className="flex-1 px-5 py-3 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Find Jobs
              </label>

              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, skill, keyword"
                className="w-full text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {/* DIVIDER */}
            <div className="w-px bg-slate-500 my-4" />

            {/* LOCATION */}
            <div className="flex-1 px-5 py-3 text-left">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Schools, Office"
                className="w-full text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {/* SEARCH BUTTON */}
            <button
              type="submit"
              className="w-16 sm:w-20 border-l border-slate-500 flex items-center justify-center hover:bg-slate-100 transition"
              aria-label="Search jobs"
            >
              <Search size={22} className="text-black" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}