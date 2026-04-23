import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-[#0056b3] z-50 shadow-md">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-20 items-center">
          {/* Left Side: Branding Text */}
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-white hover:text-black font-medium transition-colors"
            >
              Home
            </Link>

            <a
              href="#"
              className="text-white hover:text-black font-medium transition-colors"
            >
              Find Jobs
            </a>

            <a
              href="#"
              className="text-white hover:text-black font-medium transition-colors"
            >
              DepEd
            </a>

            <a
              href="#"
              className="text-white hover:text-black font-medium transition-colors"
            >
              About
            </a>

            <Link
              to="/login"
              className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-full font-semibold hover:bg-slate-200 transition-all"
            >
              Log in
            </Link>
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            Home
          </Link>

          <a
            href="#"
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            Find Jobs
          </a>

          <a
            href="#"
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            DepEd
          </a>

          <a
            href="#"
            className="block px-3 py-4 text-base font-medium text-slate-700"
          >
            About
          </a>

          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/login"
              className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;