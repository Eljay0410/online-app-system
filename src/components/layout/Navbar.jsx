import { Link, useLocation } from "react-router-dom";
import { useAuth, getAuthenticatedHomePath } from "../../features/auth/auth";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isLoggedIn = Boolean(user);
  const homePath = isLoggedIn ? getAuthenticatedHomePath(user) : "/";
  const hidesMobileGuestMenu =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/activate";
  const showMobileGuestActions = !isLoggedIn && !hidesMobileGuestMenu;

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
                  className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-all duration-200 ${
                    location.pathname === "/about"
                      ? "bg-white/20 text-white"
                      : "text-white hover:bg-white/15 hover:text-white"
                  }`}
                >
                  Vacancies
                </Link>

                <div className="ml-4 flex items-center gap-4">
                  <Link
                    to="/register"
                    className={`rounded-full px-4 py-2 text-[15px] font-semibold transition-all duration-200 ${
                      location.pathname === "/register"
                        ? "bg-white/20 text-white"
                        : "text-white hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    SignUp
                  </Link>

                  <Link
                    to="/login"
                    className="rounded-lg bg-white px-5 py-2.5 text-[15px] font-bold text-[#0056b3] shadow-lg transition hover:bg-blue-50"
                  >
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile guest actions */}
        {showMobileGuestActions && (
          <div className="ml-auto flex items-center gap-2 px-3 md:hidden">
            <Link
              to="/login"
              className="rounded-lg border border-white/40 px-3 py-2 text-xs font-semibold text-white"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0056b3]"
            >
              SignUp
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;