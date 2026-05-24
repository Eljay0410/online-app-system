import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getRoleHomePath,
  normalizeRole,
  useAuth,
} from "../../features/auth/auth";
import { apiRequest } from "../../lib/api";

const roleNavItems = {
  applicant: [
    {
      id: "jobs",
      label: "Job Listings",
      mobileLabel: "Jobs",
      icon: Briefcase,
      path: "/",
    },
    {
      id: "applications",
      label: "My Applications",
      mobileLabel: "Apps",
      icon: ClipboardList,
      path: "/applications",
    },
    {
      id: "applicant-info",
      label: "Applicant Information",
      mobileLabel: "Info",
      icon: UserCog,
      path: "/applicant-information",
    },
    {
      id: "documents",
      label: "Requirements / Documents",
      mobileLabel: "Docs",
      icon: ClipboardList,
      path: "/requirements",
    },
  ],
  admin: [
    {
      id: "job-posting",
      label: "Manage Job Openings",
      mobileLabel: "Manage",
      icon: Briefcase,
      path: "/admin?section=job-posting",
    },
    {
      id: "positions",
      label: "Positions",
      mobileLabel: "Positions",
      icon: ClipboardList,
      path: "/admin?section=positions",
    },
    {
      id: "applicant-list",
      label: "Applicant List",
      mobileLabel: "Applicants",
      icon: UserCog,
      path: "/admin?section=applicant-list",
    },
    {
      id: "job-listing",
      label: "Job Listing",
      mobileLabel: "Jobs",
      icon: ClipboardList,
      path: "/admin?section=job-listing",
    },
    {
      id: "activity-logs",
      label: "Activity Logs",
      mobileLabel: "Logs",
      icon: History,
      path: "/admin?section=activity-logs",
    },
  ],
  superadmin: [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/superadmin?section=dashboard",
    },
    {
      id: "user-management",
      label: "User Management",
      mobileLabel: "Users",
      icon: Users,
      path: "/superadmin?section=user-management",
    },
    {
      id: "office-management",
      label: "Office Management",
      mobileLabel: "Accounts",
      icon: UserCog,
      path: "/superadmin?section=office-management",
    },
    {
      id: "job-listing",
      label: "Job Listing",
      mobileLabel: "Jobs",
      icon: Briefcase,
      path: "/superadmin?section=job-listing",
    },
    {
      id: "activity-logs",
      label: "Activity Logs",
      mobileLabel: "Logs",
      icon: History,
      path: "/superadmin?section=activity-logs",
    },
  ],
};

export default function SuperAdminSidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  role,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const resolvedRole = normalizeRole(role || user?.role);
  const navItems = roleNavItems[resolvedRole] || roleNavItems.applicant;
  const isProfileActive =
    activeTab === "profile" || location.pathname === "/profile";
  const sidebarWidthClass = collapsed
    ? "w-20"
    : "w-[min(18rem,calc(100vw-1rem))] sm:w-72";
  const labelClass = collapsed ? "hidden" : "block";
  const navItemClass = collapsed ? "justify-center px-0" : "px-5";

  const selectItem = (item) => {
    if (location.pathname === "/profile" || !setActiveTab) {
      navigate(item.path || getRoleHomePath(resolvedRole));
      return;
    }

    setActiveTab(item.id);

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 639px)").matches
    ) {
      setCollapsed?.(true);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {!collapsed && (
        <button
          type="button"
          aria-label="Collapse sidebar overlay"
          onClick={() => setCollapsed(true)}
          className="fixed inset-x-0 bottom-0 top-24 z-40 bg-slate-950/35 backdrop-blur-sm sm:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-24 z-50 flex h-[calc(100dvh-96px)] flex-col border-r border-slate-200 bg-white shadow-xl transition-all duration-300 sm:shadow-none ${sidebarWidthClass}`}
      >
        <div className="flex items-center border-b border-slate-200 px-4 py-3">
          <div className="flex w-full items-center justify-end">
            {collapsed ? (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectItem(item)}
                  title={item.label}
                  aria-label={item.label}
                  className={`oas-sidebar-button group flex w-full items-center gap-4 rounded-2xl py-3 text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  } ${navItemClass}`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                  />

                  {!collapsed && (
                    <span
                      className={`${labelClass} truncate text-sm font-semibold`}
                    >
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              title="Profile"
              aria-label="Profile"
              className={`oas-sidebar-button group flex w-full items-center gap-4 rounded-2xl py-3 text-left transition-all duration-200 ${
                isProfileActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              } ${navItemClass}`}
            >
              <User
                className={`h-5 w-5 shrink-0 ${
                  isProfileActive ? "text-white" : "text-slate-500"
                }`}
              />

              {!collapsed && (
                <span
                  className={`${labelClass} truncate text-sm font-semibold`}
                >
                  Profile
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className={`oas-sidebar-button group flex w-full items-center gap-4 rounded-2xl py-3 text-left text-red-600 transition-all duration-200 hover:bg-red-50 ${
                navItemClass
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />

              {!collapsed && (
                <span
                  className={`${labelClass} truncate text-sm font-semibold`}
                >
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
