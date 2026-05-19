import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

const sumCounts = (items = []) =>
  items.reduce((total, item) => total + Number(item.count || 0), 0);

const pageMeta = {
  dashboard: {
    title: "System Overview",
    description:
      "Monitor system users, job postings, applications, and management accounts in one clean workspace.",
    badge: "Secure Admin Workspace",
  },
  "create-admin": {
    title: "Create Admin Account",
    description:
      "Add new office administrators with verified access to the online application system.",
    badge: "Account Setup",
  },
  "management-accounts": {
    title: "Management Accounts",
    description:
      "Review admin and superadmin accounts, then remove inactive access when needed.",
    badge: "User Control",
  },
};

export default function SuperAdminDashboard() {
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

  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

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
        if (isMounted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
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
      setActiveTab("management-accounts");

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

  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";
  const currentPage = pageMeta[activeTab] || pageMeta.dashboard;

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <section className="px-4 pb-10 pt-6 transition-all duration-300 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              {currentPage.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {currentPage.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {currentPage.description}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-700" />
              Loading system overview...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {deleteMessage && (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {deleteMessage}
                </div>
              )}

              {activeTab === "dashboard" && (
                <OverviewDashboard overview={overview} totals={totals} />
              )}

              {activeTab === "create-admin" && (
                <CreateAdminSection
                  adminForm={adminForm}
                  updateAdminForm={updateAdminForm}
                  handleCreateAdmin={handleCreateAdmin}
                  isCreating={isCreating}
                  formError={formError}
                  formMessage={formMessage}
                />
              )}

              {activeTab === "management-accounts" && (
                <ManagementAccountsSection
                  managementUsers={managementUsers}
                  onDeleteUser={openDeleteUserModal}
                />
              )}
            </div>
          )}
        </div>
      </section>

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

function OverviewDashboard({ overview, totals }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Total Users"
          value={totals.users}
          description="All registered accounts"
        />

        <StatCard
          icon={<BriefcaseBusiness className="h-6 w-6" />}
          label="Job Postings"
          value={totals.jobs}
          description="Created job opportunities"
        />

        <StatCard
          icon={<Shield className="h-6 w-6" />}
          label="Applications"
          value={totals.applications}
          description="Submitted applications"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <BreakdownCard
          title="Users by Role"
          items={overview.users}
          labelKey="role"
        />

        <BreakdownCard
          title="Jobs by Status"
          items={overview.jobs}
          labelKey="status"
        />

        <BreakdownCard
          title="Applications by Status"
          items={overview.applications}
          labelKey="status"
        />
      </div>
    </>
  );
}

function StatCard({ icon, label, value, description }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
          Live
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function BreakdownCard({ title, items, labelKey }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
          {title}
        </h2>
      </div>

      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No data yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item[labelKey]}`}
              className="flex items-center justify-between px-6 py-4"
            >
              <span className="font-semibold capitalize text-slate-700">
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">

      <form onSubmit={handleCreateAdmin} className="space-y-4 p-6">
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

          <div className="relative mt-1">
            <input
              type={isPasswordVisible ? "text" : "password"}
              value={adminForm.password}
              onChange={(event) =>
                updateAdminForm("password", event.target.value)
              }
              className="h-11 w-full rounded-xl border border-slate-300 px-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="button"
              onClick={() => setIsPasswordVisible((current) => !current)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-blue-700"
              aria-label={
                isPasswordVisible ? "Hide password" : "Show password"
              }
              title={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
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
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">

      <div className="divide-y divide-slate-100">
        {managementUsers.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No management accounts yet.
          </p>
        ) : (
          managementUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 px-6 py-4 text-sm lg:flex-row lg:items-center lg:justify-between"
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
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