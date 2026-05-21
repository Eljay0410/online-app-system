import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

const emptyAdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const pageMeta = {
  dashboard: {
    title: "System Overview",
    description: "Monitor accounts, job postings, and applications.",
  },
  "user-management": {
    title: "User Management",
    description: "Applicant accounts created through sign up.",
  },
  "office-management": {
    title: "Office Management",
    description: "HR/Admin office accounts managed by the Superadmin.",
  },
};

const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";

const formatDate = (value) => {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const fullName = (user) =>
  [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "Unnamed account";

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState({
    users: [],
    jobs: [],
    applications: [],
  });
  const [applicantUsers, setApplicantUsers] = useState([]);
  const [officeUsers, setOfficeUsers] = useState([]);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    const [overviewResult, applicantResult, officeResult] = await Promise.all([
      apiRequest("/api/superadmin/overview"),
      apiRequest("/api/superadmin/user-accounts"),
      apiRequest("/api/superadmin/office-accounts"),
    ]);

    setOverview({
      users: overviewResult.users || [],
      jobs: overviewResult.jobs || [],
      applications: overviewResult.applications || [],
    });
    setApplicantUsers(applicantResult.users || []);
    setOfficeUsers(officeResult.users || []);
  };

  useEffect(() => {
    let isMounted = true;

    loadDashboard()
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load dashboard.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const sum = (items = []) =>
      items.reduce((total, item) => total + Number(item.count || 0), 0);

    return {
      users: sum(overview.users),
      jobs: sum(overview.jobs),
      applications: sum(overview.applications),
    };
  }, [overview]);

  const updateAdminForm = (field, value) => {
    setAdminForm((current) => ({ ...current, [field]: value }));
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      await apiRequest("/api/superadmin/admins", {
        method: "POST",
        body: JSON.stringify(adminForm),
      });
      setAdminForm(emptyAdminForm);
      setMessage("Office account created.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to create office account.");
    } finally {
      setIsSaving(false);
    }
  };

  const openAccount = (account, mode) => {
    setSelectedAccount(account);
    setModalMode(mode);
    setMessage("");
    setError("");
  };

  const updateAccountInState = (updatedUser) => {
    setApplicantUsers((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setOfficeUsers((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setSelectedAccount(updatedUser);
  };

  const saveAccount = async (account) => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await apiRequest(`/api/superadmin/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify(account),
      });
      updateAccountInState(result.user);
      setMessage("Account information updated.");
      setModalMode("view");
    } catch (err) {
      setError(err.message || "Failed to update account.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (account) => {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const result = await apiRequest(
        `/api/superadmin/users/${account.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !account.isActive }),
        }
      );
      updateAccountInState(result.user);
      setMessage(result.user.isActive ? "Account activated." : "Account suspended.");
    } catch (err) {
      setError(err.message || "Failed to update account status.");
    } finally {
      setIsSaving(false);
    }
  };

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

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <header>
            <p className="oas-page-kicker">Superadmin</p>
            <h1 className="oas-page-title mt-2">{currentPage.title}</h1>
            <p className="oas-page-description">{currentPage.description}</p>
          </header>

          {message && (
            <Notice type="success" text={message} />
          )}
          {error && (
            <Notice type="error" text={error} />
          )}

          {isLoading ? (
            <div className="oas-panel flex items-center gap-2 p-5 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading superadmin workspace...
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Overview totals={totals} overview={overview} />
              )}

              {activeTab === "user-management" && (
                <AccountTable
                  title="Registered Users"
                  users={applicantUsers}
                  emptyLabel="No applicant users yet."
                  onView={(user) => openAccount(user, "view")}
                  onEdit={(user) => openAccount(user, "edit")}
                  onToggleStatus={toggleStatus}
                  isSaving={isSaving}
                />
              )}

              {activeTab === "office-management" && (
                <div className="space-y-5">
                  <CreateOfficeAccount
                    form={adminForm}
                    onChange={updateAdminForm}
                    onSubmit={createAdmin}
                    isSaving={isSaving}
                  />
                  <AccountTable
                    title="Office Accounts"
                    users={officeUsers}
                    emptyLabel="No office accounts yet."
                    onView={(user) => openAccount(user, "view")}
                    onEdit={(user) => openAccount(user, "edit")}
                    onToggleStatus={toggleStatus}
                    isSaving={isSaving}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedAccount && (
        <AccountModal
          account={selectedAccount}
          mode={modalMode}
          isSaving={isSaving}
          onClose={() => setSelectedAccount(null)}
          onEdit={() => setModalMode("edit")}
          onSave={saveAccount}
        />
      )}
    </main>
  );
}

function Overview({ totals, overview }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Users" value={totals.users} />
        <Stat label="Job Postings" value={totals.jobs} />
        <Stat label="Applications" value={totals.applications} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Users by Role" items={overview.users} labelKey="role" />
        <Breakdown title="Jobs by Status" items={overview.jobs} labelKey="status" />
        <Breakdown
          title="Applications by Status"
          items={overview.applications}
          labelKey="status"
        />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="oas-panel p-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Breakdown({ title, items, labelKey }) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No data yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={`${title}-${item[labelKey]}`}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="font-semibold capitalize text-slate-700">
                {String(item[labelKey]).replaceAll("_", " ")}
              </span>
              <span className="font-semibold text-slate-950">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function CreateOfficeAccount({ form, onChange, onSubmit, isSaving }) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Create HR/Admin Account</h2>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2">
        <Input
          label="First Name"
          value={form.firstName}
          onChange={(value) => onChange("firstName", value)}
          required
        />
        <Input
          label="Last Name"
          value={form.lastName}
          onChange={(value) => onChange("lastName", value)}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => onChange("email", value)}
          required
        />
        <Input
          label="Temporary Password"
          type="password"
          value={form.password}
          onChange={(value) => onChange("password", value)}
          required
        />
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className={`${buttonClass} bg-[#0056b3] text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70`}
          >
            {isSaving ? "Creating..." : "Create Account"}
          </button>
        </div>
      </form>
    </section>
  );
}

function AccountTable({
  title,
  users,
  emptyLabel,
  onView,
  onEdit,
  onToggleStatus,
  isSaving,
}) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-semibold text-slate-950">
                  {fullName(user)}
                </td>
                <td className="px-5 py-4 text-slate-700">{user.email}</td>
                <td className="px-5 py-4 capitalize text-slate-700">
                  {String(user.role).replaceAll("_", " ")}
                </td>
                <td className="px-5 py-4">
                  <StatusPill active={user.isActive} />
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {formatDate(user.lastLogin)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView(user)}
                      className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                    >
                      View
                    </button>
                    {String(user.role) !== "superadmin" && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => onToggleStatus(user)}
                          className={`${buttonClass} ${
                            user.isActive
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          {user.isActive ? "Suspend" : "Activate"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">{emptyLabel}</p>
        )}
      </div>
    </section>
  );
}

function AccountModal({ account, mode, isSaving, onClose, onEdit, onSave }) {
  const [draft, setDraft] = useState(account);
  const isEditing = mode === "edit";

  useEffect(() => {
    setDraft(account);
  }, [account]);

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-950">
            {isEditing ? "Edit Account" : "Account Details"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{account.email}</p>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Input
            label="First Name"
            value={draft.firstName}
            onChange={(value) => setField("firstName", value)}
            disabled={!isEditing}
            required
          />
          <Input
            label="Last Name"
            value={draft.lastName}
            onChange={(value) => setField("lastName", value)}
            disabled={!isEditing}
            required
          />
          <Input
            label="Middle Name"
            value={draft.middleName}
            onChange={(value) => setField("middleName", value)}
            disabled={!isEditing || draft.noMiddleName}
          />
          <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(draft.noMiddleName)}
              onChange={(event) => setField("noMiddleName", event.target.checked)}
              disabled={!isEditing}
            />
            No middle name
          </label>
          <Input
            label="Email"
            type="email"
            value={draft.email}
            onChange={(value) => setField("email", value)}
            disabled={!isEditing}
            required
          />
          <Input
            label="Contact Number"
            value={draft.contactNumber}
            onChange={(value) => setField("contactNumber", value)}
            disabled={!isEditing}
          />
          <div>
            <p className="text-sm font-semibold text-slate-500">Role</p>
            <p className="mt-2 capitalize text-slate-900">
              {String(draft.role).replaceAll("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Status</p>
            <div className="mt-2">
              <StatusPill active={draft.isActive} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          >
            Close
          </button>
          {String(account.role) !== "superadmin" && (
            isEditing ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onSave(draft)}
                className={`${buttonClass} bg-[#0056b3] text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className={`${buttonClass} bg-[#0056b3] text-white hover:bg-[#003a78]`}
              >
                Edit
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
      />
    </label>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Suspended"}
    </span>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function Notice({ type, text }) {
  const isError = type === "error";
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {text}
    </div>
  );
}
