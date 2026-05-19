import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  User,
  UserCog,
  UserPlus,
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
  ],
  admin: [
    {
      id: "post-job",
      label: "Post Job Opening",
      mobileLabel: "Post",
      icon: UserPlus,
      path: "/admin",
    },
    {
      id: "job-posting",
      label: "Job Posting",
      mobileLabel: "Posts",
      icon: Briefcase,
      path: "/admin",
    },
    {
      id: "applicant-list",
      label: "Applicant List",
      mobileLabel: "Applicants",
      icon: UserCog,
      path: "/admin",
    },
    {
      id: "job-listing",
      label: "Job Listing",
      mobileLabel: "Jobs",
      icon: ClipboardList,
      path: "/admin",
    },
  ],
  superadmin: [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/superadmin",
    },
    {
      id: "create-admin",
      label: "Create Admin",
      mobileLabel: "Create",
      icon: UserPlus,
      path: "/superadmin",
    },
    {
      id: "management-accounts",
      label: "Management Accounts",
      mobileLabel: "Accounts",
      icon: UserCog,
      path: "/superadmin",
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

  const selectItem = (item) => {
    if (location.pathname === "/profile" || !setActiveTab) {
      navigate(item.path || getRoleHomePath(resolvedRole));
      return;
    }

    setActiveTab(item.id);
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
      <aside
        className={`fixed left-0 top-24 z-30 hidden h-[calc(100vh-96px)] border-r border-slate-200 bg-white transition-all duration-300 lg:flex lg:flex-col ${
          collapsed ? "w-20" : "w-72"
        }`}
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
                  title={collapsed ? item.label : ""}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                    isActive
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                  />

                  {!collapsed && (
                    <span className="truncate text-sm font-semibold">
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
              title={collapsed ? "Profile" : ""}
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200 ${
                isProfileActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              } ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <User
                className={`h-5 w-5 shrink-0 ${
                  isProfileActive ? "text-white" : "text-slate-500"
                }`}
              />

              {!collapsed && (
                <span className="truncate text-sm font-semibold">
                  Profile
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title={collapsed ? "Logout" : ""}
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-red-600 transition-all duration-200 hover:bg-red-50 ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />

              {!collapsed && (
                <span className="truncate text-sm font-semibold">
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-bold transition ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />

                <span>{item.mobileLabel || item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-bold transition ${
              isProfileActive
                ? "bg-blue-700 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-red-50 px-3 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
