import React, { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, getAuthenticatedHomePath } from "../../features/auth/auth";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const mobileMenuRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);

  const isLoggedIn = Boolean(user);
  const homePath = isLoggedIn ? getAuthenticatedHomePath(user) : "/";
  const initial = (user?.firstName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedMobileOutside =
        mobileMenuRef.current && !mobileMenuRef.current.contains(event.target);

      if (clickedMobileOutside) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed left-0 top-0 z-[60] h-[96px] w-full bg-[#0056b3] shadow-md">
      <div className="flex h-full w-full items-center">
        {/* Left Branding */}
        <Link
          to={homePath}
          className="flex h-full w-[300px] shrink-0 flex-col justify-center px-3 leading-tight sm:w-[360px] md:w-[420px]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
            Department of Education
          </p>

          <h1 className="mt-0.5 whitespace-nowrap text-[18px] font-bold tracking-tight text-white sm:text-[22px] md:text-[24px]">
            CITY OF SAN JOSE DEL MONTE
          </h1>

          <p className="mt-0.5 text-[12px] font-medium text-white/90 sm:text-[14px]">
            Online Application System - OASys
          </p>
        </Link>

        <div className="hidden h-full flex-1 md:block" />

        {/* Desktop Right Side */}
        <div className="hidden h-full items-center justify-end md:flex">
          <div className="flex h-full items-center gap-8 px-5">
            {!isLoggedIn && (
              <>
                <Link
                  to="/about"
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    location.pathname === "/about"
                      ? "text-white"
                      : "text-white hover:text-black"
                  }`}
                >
                  Job Listing
                </Link>

                <div className="ml-2 flex items-center gap-3">
                  <Link
                    to="/register"
                    className="px-3 py-2 text-sm font-semibold text-white transition hover:text-black"
                  >
                    Register
                  </Link>

                  <Link
                    to="/login"
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0056b3] shadow-lg transition hover:bg-blue-50"
                  >
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Button */}
        <div
          ref={mobileMenuRef}
          className="ml-auto flex items-center gap-2 px-3 md:hidden"
        >
          {isLoggedIn && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold text-white">
              {initial}
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((current) => !current);
            }}
            className="rounded-lg p-2 text-white transition hover:bg-white/10"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && !isLoggedIn && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="space-y-4 px-4 py-6">
            <div className="space-y-1">
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                  location.pathname === "/about"
                    ? "bg-blue-50 text-[#0056b3]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                About
              </Link>

              <Link
                to="/contact"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                  location.pathname === "/contact"
                    ? "bg-blue-50 text-[#0056b3]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Contact
              </Link>
            </div>

            <div className="mx-4 h-px bg-slate-100" />

            <div className="px-4">
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl border border-blue-200 bg-blue-50 py-3.5 text-center font-bold text-[#0056b3]"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full rounded-xl bg-[#0056b3] py-3.5 text-center font-bold text-white shadow-lg"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;