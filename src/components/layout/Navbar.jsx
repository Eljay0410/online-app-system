import React, { useState } from "react";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useAuth,
  normalizeRole,
  getAuthenticatedHomePath,
} from "../../features/auth/auth";
import { apiRequest } from "../../lib/api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isLoggedIn = Boolean(user);
  const role = normalizeRole(user?.role);
  const homePath = isLoggedIn ? getAuthenticatedHomePath(user) : "/";
  const initial = (user?.firstName || user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    logout();
    setIsProfileOpen(false);
    setIsOpen(false);
    navigate("/login", { replace: true });
  };

  const navLinks = [{ name: "Job Listings", path: "/", icon: Briefcase }];

  if (isLoggedIn) {
    if (role === "applicant") {
      navLinks.push({
        name: "My Applications",
        path: "/applications",
        icon: LayoutDashboard,
      });
    } else if (role === "admin") {
      navLinks.push({
        name: "Admin Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
      });
    } else if (role === "superadmin") {
      navLinks.push({
        name: "Superadmin Dashboard",
        path: "/superadmin",
        icon: LayoutDashboard,
      });
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 z-50 h-[96px] w-full bg-[#0056b3] shadow-md">
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
            Certificate Verifier System - CERVER
          </p>
        </Link>

        {/* Center Spacer */}
        <div className="hidden h-full flex-1 md:block" />

        {/* Desktop Navigation */}
        <div className="hidden h-full items-center justify-end md:flex">
          <div className="flex h-full items-center gap-8 px-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[15px] font-semibold transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-white"
                    : "text-white hover:text-black"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {!isLoggedIn && (
              <>
                <Link
                  to="/about"
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isActive("/about")
                      ? "text-white"
                      : "text-white hover:text-black"
                  }`}
                >
                  About
                </Link>

                <Link
                  to="/contact"
                  className={`text-[15px] font-semibold transition-colors duration-200 ${
                    isActive("/contact")
                      ? "text-white"
                      : "text-white hover:text-black"
                  }`}
                >
                  Contact
                </Link>
              </>
            )}

            {isLoggedIn ? (
              <div className="relative ml-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex h-11 items-center gap-3 rounded-full bg-white/10 p-1.5 pr-4 transition hover:bg-white/20"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-[#0056b3] shadow-sm">
                    {initial}
                  </div>

                  <span className="text-sm font-semibold text-white">
                    Account
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-white/70 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Signed in as
                      </p>

                      <p className="truncate text-sm font-bold text-slate-900">
                        {user?.email}
                      </p>
                    </div>

                    <div className="p-1.5">
                      {role === "applicant" && (
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-[#0056b3]"
                        >
                          <User size={18} />
                          My Profile
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Mobile Button */}
        <div className="ml-auto flex items-center gap-2 px-3 md:hidden">
          {isLoggedIn && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold text-white">
              {initial}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-white transition hover:bg-white/10"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="space-y-4 px-4 py-6">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                    isActive(link.path)
                      ? "bg-blue-50 text-[#0056b3]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}

              {!isLoggedIn && (
                <>
                  <Link
                    to="/about"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                      isActive("/about")
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
                      isActive("/contact")
                        ? "bg-blue-50 text-[#0056b3]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Contact
                  </Link>
                </>
              )}
            </div>

            <div className="mx-4 h-px bg-slate-100" />

            <div className="px-4">
              {isLoggedIn ? (
                <div className="space-y-3">
                  {role === "applicant" && (
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2 font-medium text-slate-700"
                    >
                      <User size={20} />
                      My Profile
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 py-2 font-bold text-red-600"
                  >
                    <LogOut size={20} />
                    Logout
                  </button>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;