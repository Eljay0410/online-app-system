import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed z-50 w-full border-b border-blue-900/10 bg-[#0056b3] shadow-sm">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-20 items-center">
          <div className="flex flex-col justify-center leading-tight min-w-0 flex-1 px-4">
            <p className="text-[12px] sm:text-[13px] md:text-xs uppercase tracking-wider text-white/80 font-medium leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
              Department of Education
            </p>

            <h1 className="text-[13px] sm:text-base md:text-lg lg:text-xl font-bold text-white tracking-tight leading-none">
              CITY OF SAN JOSE DEL MONTE
            </h1>

            <p className="text-[14px] sm:text-[15px] text-white/90 font-medium leading-tight break-words mt-1">
              Online Application System - OAS
            </p>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-white/90 font-medium transition-colors hover:text-white"
            >
              Job Listings
            </Link>

            <Link
              to="/apply"
              className="text-white/90 font-medium transition-colors hover:text-white"
            >
              Start Application
            </Link>

            <Link
              to="/login"
              className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
            >
              Log in
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-b border-blue-900/10 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0056b3]"
          >
            Job Listings
          </Link>

          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/login"
              className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-center font-semibold text-[#0056b3]"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>

            <Link
              to="/apply"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-xl bg-[#0056b3] py-3 text-center font-semibold text-white"
            >
              Start Application
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
