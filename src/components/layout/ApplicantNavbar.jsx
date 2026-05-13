"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearStoredUser,
  getStoredUser,
} from "../../features/auth/auth";

export default function NavbarApplicant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const user = getStoredUser();
  const isLoggedIn = Boolean(user);
  const initial = (user?.firstName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const handleLogout = () => {
    clearStoredUser();
    setIsProfileOpen(false);
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed z-50 w-full border-b border-blue-900/10 bg-[#0056b3] shadow-sm">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-20 items-center">
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

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-white/90 font-medium transition-colors hover:text-white"
            >
              Job Listings
            </Link>

            <a
              href="https://depedcsjdm.weebly.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 font-medium transition-colors hover:text-white"
            >
              DepEd
            </a>

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white shadow-sm transition hover:bg-white/15"
                >
                  <span className="font-bold">{initial}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
                    <Link
                      to="/applications"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-[#0056b3]"
                    >
                      My Applications
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-[#0056b3]"
                    >
                      Profile Settings
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-[#0056b3]"
                    >
                      Job Listings
                    </Link>

                    {!user?.profileComplete && (
                      <Link
                        to="/apply"
                        onClick={() => setIsProfileOpen(false)}
                        className="block px-4 py-3 text-slate-700 transition hover:bg-blue-50 hover:text-[#0056b3]"
                      >
                        Complete Profile
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-[#0056b3] transition hover:bg-blue-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-white/25 bg-white/10 px-6 py-2.5 font-semibold text-white transition hover:bg-white/15"
              >
                Log in
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0056b3]"
          >
            Job Listings
          </Link>

          <a
            href="https://depedcsjdm.weebly.com/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-[#0056b3]"
          >
            DepEd
          </a>

          <div className="flex flex-col gap-3 mt-4">
            {isLoggedIn ? (
              <>
                <Link
                  to="/applications"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-center font-semibold text-[#0056b3]"
                >
                  My Applications
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-center font-semibold text-[#0056b3]"
                >
                  Profile Settings
                </Link>

                {!user?.profileComplete && (
                  <Link
                    to="/apply"
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl bg-[#0056b3] py-3 text-center font-semibold text-white"
                  >
                    Complete Profile
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl border border-blue-200 bg-white py-3 font-semibold text-[#0056b3]"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3 text-center font-semibold text-[#0056b3]"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
