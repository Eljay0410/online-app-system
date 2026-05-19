import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  User,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth";
import { apiRequest } from "../../lib/api";

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "create-admin",
    label: "Create Admin",
    mobileLabel: "Create",
    icon: UserPlus,
  },
  {
    id: "management-accounts",
    label: "Management Accounts",
    mobileLabel: "Accounts",
    icon: UserCog,
  },
];

export default function SuperAdminSidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
                  onClick={() => setActiveTab(item.id)}
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
              className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <User className="h-5 w-5 shrink-0 text-slate-500" />

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
        <div className="grid grid-cols-5 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
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
            className="flex flex-col items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
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