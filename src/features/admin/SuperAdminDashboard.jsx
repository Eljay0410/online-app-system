import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  LayoutDashboard,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const sumCounts = (items = []) =>
  items.reduce((total, item) => total + Number(item.count || 0), 0);

const sidebarItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "create-admin",
    label: "Create Admin",
    icon: UserPlus,
  },
  {
    id: "management-accounts",
    label: "Management Accounts",
    icon: UserCog,
  },
];

export default function SuperAdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [overview, setOverview] = useState({
    users: [],
    jobs: [],
    applications: [],
  });

  const [managementUsers, setManagementUsers] = useState([]);

  const [adminForm, setAdminForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const loadDashboard = async () => {
    const [overviewResult, usersResult] = await Promise.all([
      apiRequest("/api/superadmin/overview"),
      apiRequest("/api/superadmin/users"),
    ]);

    setOverview({
      users: overviewResult.users || [],
      jobs: overviewResult.jobs || [],
      applications: overviewResult.applications || [],
    });

    setManagementUsers(usersResult.users || []);
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/superadmin/overview"),
      apiRequest("/api/superadmin/users"),
    ])
      .then(([overviewResult, usersResult]) => {
        if (!isMounted) return;

        setOverview({
          users: overviewResult.users || [],
          jobs: overviewResult.jobs || [],
          applications: overviewResult.applications || [],
        });

        setManagementUsers(usersResult.users || []);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateAdminForm = (field, value) => {
    setAdminForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();

    setFormError("");
    setFormMessage("");
    setDeleteError("");
    setDeleteMessage("");
    setIsCreating(true);

    try {
      const result = await apiRequest("/api/superadmin/admins", {
        method: "POST",
        body: JSON.stringify(adminForm),
      });

      setManagementUsers((current) => [result.user, ...current]);

      setAdminForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
      });

      setFormMessage("Admin account created successfully.");
      setActiveSection("management-accounts");

      await loadDashboard();
    } catch (err) {
      setFormError(err.message || "Failed to create admin account.");
    } finally {
      setIsCreating(false);
    }
  };

  const openDeleteUserModal = (user) => {
    setUserToDelete(user);
    setDeleteError("");
    setDeleteMessage("");
  };

  const closeDeleteUserModal = () => {
    if (isDeletingUser) return;

    setUserToDelete(null);
    setDeleteError("");
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingUser(true);
    setDeleteError("");
    setDeleteMessage("");

    try {
      await apiRequest(`/api/superadmin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      setManagementUsers((current) =>
        current.filter((user) => user.id !== userToDelete.id)
      );

      setDeleteMessage("User account removed successfully.");
      setUserToDelete(null);

      await loadDashboard();
    } catch (err) {
      setDeleteError(err.message || "Failed to remove user account.");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const totals = useMemo(
    () => ({
      users: sumCounts(overview.users),
      jobs: sumCounts(overview.jobs),
      applications: sumCounts(overview.applications),
    }),
    [overview]
  );

  const activeSidebarLabel =
    sidebarItems.find((item) => item.id === activeSection)?.label ||
    "Superadmin Dashboard";

  return (
    <main className="min-h-screen bg-slate-50 pt-24">
      <div className="flex min-h-[calc(100vh-96px)]">
        <aside
          className={`fixed left-0 top-24 z-30 hidden h-[calc(100vh-96px)] border-r border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 lg:block ${
            isSidebarCollapsed ? "w-20" : "w-72"
          }`}
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex items-center border-b border-slate-200 py-5 ${
                isSidebarCollapsed
                  ? "justify-center px-3"
                  : "justify-between px-5"
              }`}
            >
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Superadmin Panel
                  </p>

                  <h2 className="mt-2 truncate text-xl font-extrabold text-slate-950">
                    OASys Dashboard
                  </h2>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((current) => !current)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-[#0056b3] hover:text-white"
                title={
                  isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen size={20} />
                ) : (
                  <PanelLeftClose size={20} />
                )}
              </button>
            </div>

            <nav className="flex-1 space-y-2 px-3 py-5">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    title={isSidebarCollapsed ? item.label : ""}
                    className={`group flex w-full items-center rounded-xl py-3 text-left text-sm font-semibold transition ${
                      isSidebarCollapsed
                        ? "justify-center px-0"
                        : "gap-3 px-4"
                    } ${
                      isActive
                        ? "bg-[#0056b3] text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#0056b3]"
                    }`}
                  >
                    <Icon size={20} className="shrink-0" />

                    {!isSidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {!isSidebarCollapsed && (
              <div className="border-t border-slate-200 px-6 py-5 text-xs leading-5 text-slate-500">
                Monitor users, job postings, applications, and admin accounts.
              </div>
            )}
          </div>
        </aside>

        <section
          className={`w-full px-4 pb-12 pt-8 transition-all duration-300 sm:px-6 lg:px-8 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="lg:hidden">
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition ${
                        isActive
                          ? "bg-[#0056b3] text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0056b3]">
                {activeSidebarLabel}
              </p>

              <h1 className="text-3xl font-bold text-slate-950">
                Superadmin Dashboard
              </h1>

              <p className="text-sm text-slate-600">
                System-wide monitoring for users, postings, applications, and
                management accounts.
              </p>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-slate-500 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading system overview...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {!isLoading && !error && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <DashboardCard
                    icon={Users}
                    label="Users"
                    value={totals.users}
                    iconClassName="text-blue-700"
                  />

                  <DashboardCard
                    icon={BriefcaseBusiness}
                    label="Job Postings"
                    value={totals.jobs}
                    iconClassName="text-blue-700"
                  />

                  <DashboardCard
                    icon={Shield}
                    label="Applications"
                    value={totals.applications}
                    iconClassName="text-green-700"
                  />
                </div>

                {deleteMessage && (
                  <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {deleteMessage}
                  </div>
                )}

                {activeSection === "overview" && (
                  <OverviewSection overview={overview} />
                )}

                {activeSection === "create-admin" && (
                  <CreateAdminSection
                    adminForm={adminForm}
                    updateAdminForm={updateAdminForm}
                    handleCreateAdmin={handleCreateAdmin}
                    isCreating={isCreating}
                    formError={formError}
                    formMessage={formMessage}
                  />
                )}

                {activeSection === "management-accounts" && (
                  <ManagementAccountsSection
                    managementUsers={managementUsers}
                    onDeleteUser={openDeleteUserModal}
                  />
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {userToDelete && (
        <DeleteUserModal
          user={userToDelete}
          error={deleteError}
          isDeleting={isDeletingUser}
          onClose={closeDeleteUserModal}
          onConfirm={handleDeleteUser}
        />
      )}
    </main>
  );
}

function DashboardCard({
  icon: Icon,
  label,
  value,
  iconClassName = "text-blue-700",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className={`h-7 w-7 ${iconClassName}`} />

      <p className="mt-3 text-sm text-slate-500">{label}</p>

      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function OverviewSection({ overview }) {
  const sections = [
    ["Users by Role", overview.users, "role"],
    ["Jobs by Status", overview.jobs, "status"],
    ["Applications by Status", overview.applications, "status"],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {sections.map(([title, items, labelKey]) => (
        <section
          key={title}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">{title}</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No data yet.</p>
            ) : (
              items.map((item) => (
                <div
                  key={`${title}-${item[labelKey]}`}
                  className="flex items-center justify-between px-5 py-4 text-sm"
                >
                  <span className="font-medium capitalize text-slate-700">
                    {String(item[labelKey]).replaceAll("_", " ")}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {item.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function CreateAdminSection({
  adminForm,
  updateAdminForm,
  handleCreateAdmin,
  isCreating,
  formError,
  formMessage,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-blue-700" />

          <h2 className="font-bold text-slate-900">Create Admin Account</h2>
        </div>
      </div>

      <form onSubmit={handleCreateAdmin} className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600">
              First Name
            </label>

            <input
              value={adminForm.firstName}
              onChange={(event) =>
                updateAdminForm("firstName", event.target.value)
              }
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              Last Name
            </label>

            <input
              value={adminForm.lastName}
              onChange={(event) =>
                updateAdminForm("lastName", event.target.value)
              }
              className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">Email</label>

          <input
            type="email"
            value={adminForm.email}
            onChange={(event) => updateAdminForm("email", event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600">
            Temporary Password
          </label>

          <input
            type="password"
            value={adminForm.password}
            onChange={(event) =>
              updateAdminForm("password", event.target.value)
            }
            className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {formError}
          </div>
        )}

        {formMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {formMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-5 text-sm font-bold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Admin
        </button>
      </form>
    </section>
  );
}

function ManagementAccountsSection({ managementUsers, onDeleteUser }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-bold text-slate-900">Management Accounts</h2>

        <p className="mt-1 text-sm text-slate-500">
          List of admin and management accounts in the system. Remove resigned
          or inactive users when needed.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {managementUsers.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No management accounts yet.
          </p>
        ) : (
          managementUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 px-5 py-4 text-sm lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.email}
                </p>

                <p className="text-slate-500">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                  {String(user.role).replaceAll("_", " ")}
                </span>

                <button
                  type="button"
                  onClick={() => onDeleteUser(user)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DeleteUserModal({ user, error, isDeleting, onClose, onConfirm }) {
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Remove User Account
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                This action will remove the selected user from the system.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-600">
            Are you sure you want to remove{" "}
            <span className="font-bold text-slate-900">{fullName}</span>?
          </p>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-900">{fullName}</p>
            <p className="mt-1 text-slate-500">{user.email}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              {String(user.role).replaceAll("_", " ")}
            </p>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Remove User
          </button>
        </div>
      </div>
    </div>
  );
}