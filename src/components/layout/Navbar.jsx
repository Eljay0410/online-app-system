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
  const hidesMobileGuestMenu =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/activate";
  const showMobileGuestMenu = !isLoggedIn && !hidesMobileGuestMenu;

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

  return (
    <nav className="fixed left-0 top-0 z-[60] h-[96px] w-full bg-[#0056b3] shadow-md">
      <div className="flex h-full w-full items-center">
        {/* Left Branding */}
        <Link
          to={homePath}
          className="flex h-full min-w-0 flex-1 flex-col justify-center pl-4 pr-2 leading-tight sm:w-[360px] sm:flex-none sm:pl-8 md:w-[420px] lg:pl-10"
        >
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 sm:text-[11px]">
            Department of Education
          </p>

          <h1 className="mt-0.5 truncate whitespace-nowrap text-[15px] font-bold tracking-tight text-white sm:text-[22px] md:text-[24px]">
            CITY OF SAN JOSE DEL MONTE
          </h1>

          <p className="mt-0.5 truncate text-[11px] font-medium text-white/90 sm:text-[14px]">
            Online Application System - OASys
          </p>
        </Link>

        <div className="hidden h-full flex-1 md:block" />

        {/* Desktop Right Side */}
        <div className="hidden h-full items-center justify-end md:flex">
          <div className="flex h-full items-center gap-10 px-8">
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

                <div className="ml-4 flex items-center gap-4">
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

        {/* Mobile guest menu */}
        {showMobileGuestMenu && (
          <div
            ref={mobileMenuRef}
            className="ml-auto flex items-center gap-2 px-3 md:hidden"
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsOpen((current) => !current);
              }}
              className="rounded-lg p-2 text-white transition hover:bg-white/10"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isOpen && showMobileGuestMenu && (
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
