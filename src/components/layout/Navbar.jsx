import React, { useState } from "react";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, Briefcase } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, normalizeRole, getAuthenticatedHomePath } from "../../features/auth/auth";
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

  const navLinks = [
    { name: "Job Listings", path: "/", icon: Briefcase },
  ];

  if (isLoggedIn) {
    if (role === "applicant") {
      navLinks.push({ name: "My Applications", path: "/applications", icon: LayoutDashboard });
    } else if (role === "admin") {
      navLinks.push({ name: "Admin Dashboard", path: "/admin", icon: LayoutDashboard });
    } else if (role === "superadmin") {
      navLinks.push({ name: "Superadmin Dashboard", path: "/superadmin", icon: LayoutDashboard });
    }
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed z-50 w-full border-b border-white/10 bg-[#0056b3] shadow-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo Section */}
          <Link to={homePath} className="flex flex-col justify-center leading-tight">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-white/70 font-semibold">
              Department of Education
            </p>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight">
              CITY OF SAN JOSE DEL MONTE
            </h1>
            <p className="text-[12px] sm:text-[13px] text-white/90 font-medium mt-0.5">
              Online Application System
            </p>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <link.icon size={18} />
                {link.name}
              </Link>
            ))}

            <div className="ml-4 h-8 w-px bg-white/10" />

            {isLoggedIn ? (
              <div className="relative ml-4">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 rounded-full bg-white/10 p-1.5 pr-4 transition hover:bg-white/20"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#0056b3] font-bold shadow-sm">
                    {initial}
                  </div>
                  <span className="text-sm font-semibold text-white">Account</span>
                  <ChevronDown size={16} className={`text-white/70 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="p-1.5">
                      {role === "applicant" && (
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 rounded-lg transition hover:bg-blue-50 hover:text-[#0056b3]"
                        >
                          <User size={18} />
                          My Profile
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg transition hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="ml-4 flex items-center gap-3">
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white/90 transition hover:text-white px-3 py-2"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0056b3] shadow-lg transition hover:bg-blue-50 hover:scale-105 active:scale-95"
                >
                  Log in
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn && (
               <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold">
               {initial}
             </div>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 rounded-lg text-white hover:bg-white/10 transition"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top">
          <div className="px-4 py-6 space-y-4">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold transition ${
                    isActive(link.path)
                      ? "bg-blue-50 text-[#0056b3]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="h-px bg-slate-100 mx-4" />

            <div className="px-4">
              {isLoggedIn ? (
                <div className="space-y-3">
                   {role === "applicant" && (
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2 text-slate-700 font-medium"
                    >
                      <User size={20} />
                      My Profile
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 py-2 text-red-600 font-bold"
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
