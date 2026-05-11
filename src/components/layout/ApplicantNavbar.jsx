"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearStoredUser,
  getRoleHomePath,
  getStoredUser,
} from "../../features/auth/auth";

export default function NavbarApplicant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const user = getStoredUser();
  const isLoggedIn = Boolean(user);
  const homePath = getRoleHomePath(user?.role);
  const initial = (user?.firstName || user?.email || "U").charAt(0).toUpperCase();

  const handleLogout = () => {
    clearStoredUser();
    setIsProfileOpen(false);
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed w-full bg-[#0056b3] z-50 shadow-md">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-20 items-center">
          {/* Left Side: Branding Text */}
          <div className="flex flex-col justify-center leading-tight min-w-0 flex-1 px-4">
            <p className="text-[12px] sm:text-[13px] md:text-xs uppercase tracking-wider text-white/80 font-medium leading-relaxed whitespace-nowrap overflow-hidden text-ellipsis">
              DEPARTMENT OF EDUCATION
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
              href="https://depedcsjdm.weebly.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-black font-medium transition-colors"
            >
              DepEd
            </a>

            <Link
              to="/about"
              className="text-white hover:text-black font-medium transition-colors"
            >
              About
            </Link>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow hover:scale-105 transition"
                >
<<<<<<<< HEAD:src/components/layout/ApplicantNavbar.jsx
                    <span className="text-slate-700 font-bold">{initial}</span>
========
                  <span className="text-slate-700 font-bold">P</span>
>>>>>>>> e6e0fa7540dbbe077eb45b3b588e9e4d4fa52754:src/component/Applicant/Navbar-applicant.jsx
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
                    <Link
                      to="/apply"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 hover:bg-slate-100"
                    >
                      Apply New
                    </Link>

                    <Link
                      to="/application-history"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 hover:bg-slate-100"
                    >
                      History
                    </Link>

                    <Link
                      to={homePath}
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 hover:bg-slate-100"
                    >
                      Dashboard
                    </Link>

                    {user?.role === "applicant" && (
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-3 text-slate-700 hover:bg-slate-100"
                      >
                        My Profile
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-full font-semibold hover:bg-slate-200 transition-all"
              >
                Log in
              </Link>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
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

          <Link
            to="/jobopenings"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            Find Jobs
          </Link>

          <a
            href="https://depedcsjdm.weebly.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            DepEd
          </a>

          <Link
            to="/about"
            onClick={() => setIsOpen(false)}
            className="block px-3 py-4 text-base font-medium text-slate-700 border-b border-slate-50"
          >
            About
          </Link>

<<<<<<<< HEAD:src/components/layout/ApplicantNavbar.jsx
          <div className="flex flex-col gap-3 mt-4">
            {isLoggedIn ? (
              <>
                <Link
                  to={homePath}
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
                >
                  Dashboard
                </Link>

                {user?.role === "applicant" && (
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
                  >
                    My Profile
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
========
          {isLoggedIn ? (
            <div className="flex flex-col gap-3 mt-4">
              <Link
                to="/apply"
                onClick={() => setIsOpen(false)}
                className="w-full bg-[#0056b3] text-white py-3 rounded-xl font-semibold text-center"
              >
                Apply New
              </Link>

              <Link
                to="/application-history"
                onClick={() => setIsOpen(false)}
                className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
              >
                History
              </Link>

              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
              >
                My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
>>>>>>>> e6e0fa7540dbbe077eb45b3b588e9e4d4fa52754:src/component/Applicant/Navbar-applicant.jsx
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-semibold text-center"
              >
                Log in
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
