import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { apiRequest } from "../../lib/api";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import { useToast } from "../../components/ui/toastContext";

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
  "job-listing": {
    title: "Job Listing",
    description: "View posted job openings from HR/Admin.",
  },
};

const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

const formatDeadline = (job, formatDateFn = formatDate) =>
  `${formatDateFn(job?.deadline)} ${job?.deadlineTime || ""}`.trim();

const fullName = (user) =>
  [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
  user?.email ||
  "Unnamed account";

function validateAdminAccountForm(form) {
  const errors = {};

  if (!form.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Temporary password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function validateAccountDetailsForm(form) {
  const errors = {};

  if (!form.firstName?.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!form.lastName?.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!form.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

const editableAccountFields = [
  "firstName",
  "lastName",
  "middleName",
  "noMiddleName",
  "email",
  "contactNumber",
];

function normalizeAccountPayload(account = {}) {
  return {
    firstName: String(account.firstName || "").trim(),
    lastName: String(account.lastName || "").trim(),
    middleName: account.noMiddleName
      ? ""
      : String(account.middleName || "").trim(),
    noMiddleName: Boolean(account.noMiddleName),
    email: String(account.email || "").trim(),
    contactNumber: String(account.contactNumber || "").trim(),
  };
}

function hasAccountChanges(original = {}, next = {}) {
  const normalizedOriginal = normalizeAccountPayload(original);
  const normalizedNext = normalizeAccountPayload(next);

  return editableAccountFields.some(
    (field) => normalizedOriginal[field] !== normalizedNext[field]
  );
}

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState({
    users: [],
    jobs: [],
    applications: [],
  });
  const [applicantUsers, setApplicantUsers] = useState([]);
  const [officeUsers, setOfficeUsers] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminErrors, setAdminErrors] = useState({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const loadDashboard = useCallback(async () => {
    const [overviewResult, applicantResult, officeResult, jobResult] =
      await Promise.all([
        apiRequest("/api/superadmin/overview"),
        apiRequest("/api/superadmin/user-accounts"),
        apiRequest("/api/superadmin/office-accounts"),
        apiRequest("/api/superadmin/job-openings"),
      ]);

    setOverview({
      users: overviewResult.users || [],
      jobs: overviewResult.jobs || [],
      applications: overviewResult.applications || [],
    });
    setApplicantUsers(applicantResult.users || []);
    setOfficeUsers(officeResult.users || []);
    setJobListings(jobResult.jobs || []);
  }, []);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => loadDashboard())
      .catch((err) => {
        if (isMounted) {
          const errorMessage = err.message || "Failed to load dashboard.";
          showToast({ type: "error", message: errorMessage });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [loadDashboard, showToast]);

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
    setAdminErrors((current) => {
      if (!current[field] && !current.form) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];
      delete nextErrors.form;
      return nextErrors;
    });
  };

  const resetCreateAdminForm = () => {
    setAdminForm(emptyAdminForm);
    setAdminErrors({});
  };

  const openCreateAdmin = () => {
    resetCreateAdminForm();
    setIsCreateAdminOpen(true);
  };

  const closeCreateAdmin = () => {
    if (isSaving) return;

    setIsCreateAdminOpen(false);
    resetCreateAdminForm();
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setIsCreateAdminOpen(false);
    resetCreateAdminForm();
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = validateAdminAccountForm(adminForm);

    if (Object.keys(validationErrors).length > 0) {
      setAdminErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted office account fields.",
      });
      return;
    }

    setIsSaving(true);
    setAdminErrors({});

    try {
      await apiRequest("/api/superadmin/admins", {
        method: "POST",
        body: JSON.stringify(adminForm),
      });
      setAdminForm(emptyAdminForm);
      setAdminErrors({});
      setIsCreateAdminOpen(false);
      showToast({ type: "success", message: "Office account created." });
      await loadDashboard();
    } catch (err) {
      const errorMessage = err.message || "Failed to create office account.";
      const normalizedMessage = errorMessage.toLowerCase();

      if (normalizedMessage.includes("email")) {
        setAdminErrors({ email: errorMessage });
      } else if (normalizedMessage.includes("password")) {
        setAdminErrors({ password: errorMessage });
      } else if (normalizedMessage.includes("first name")) {
        setAdminErrors({ firstName: errorMessage });
      } else if (normalizedMessage.includes("last name")) {
        setAdminErrors({ lastName: errorMessage });
      } else {
        setAdminErrors({});
      }

      showToast({ type: "error", message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const openAccount = (account, mode) => {
    setSelectedAccount(account);
    setModalMode(mode);
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
    if (isSaving) return;

    if (!hasAccountChanges(selectedAccount, account)) {
      showToast({ type: "info", message: "No changes were made." });
      setModalMode("view");
      return;
    }

    const payload = normalizeAccountPayload(account);

    setIsSaving(true);

    try {
      const result = await apiRequest(`/api/superadmin/users/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      updateAccountInState(result.user);
      showToast({ type: "success", message: "Account information updated." });
      setModalMode("view");
    } catch (err) {
      const errorMessage = err.message || "Failed to update account.";
      showToast({ type: "error", message: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (account) => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const result = await apiRequest(
        `/api/superadmin/users/${account.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: !account.isActive }),
        }
      );
      updateAccountInState(result.user);
      showToast({
        type: "success",
        message: result.user.isActive
          ? "Account activated."
          : "Account suspended.",
      });
    } catch (err) {
      const errorMessage = err.message || "Failed to update account status.";
      showToast({ type: "error", message: errorMessage });
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
        setActiveTab={changeTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <header>
            <h1 className="oas-page-title">{currentPage.title}</h1>
            <p className="oas-page-description">{currentPage.description}</p>
          </header>

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
                  onToggleStatus={toggleStatus}
                  isSaving={isSaving}
                />
              )}

              {activeTab === "office-management" && (
                <div className="space-y-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openCreateAdmin}
                      className={`${buttonClass} gap-2 bg-[#0056b3] text-white hover:bg-[#003a78]`}
                    >
                      <Plus className="h-4 w-4" />
                      Create HR/Admin Account
                    </button>
                  </div>

                  <AccountTable
                    title="Office Accounts"
                    users={officeUsers}
                    emptyLabel="No office accounts yet."
                    onView={(user) => openAccount(user, "view")}
                    onToggleStatus={toggleStatus}
                    isSaving={isSaving}
                  />
                </div>
              )}

              {activeTab === "job-listing" && (
                <JobListingSection
                  jobs={jobListings}
                  formatDate={formatDate}
                />
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

      {isCreateAdminOpen && (
        <CreateOfficeAccountModal
          form={adminForm}
          errors={adminErrors}
          onChange={updateAdminForm}
          onSubmit={createAdmin}
          onClose={closeCreateAdmin}
          isSaving={isSaving}
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

function CreateOfficeAccountModal({
  form,
  errors,
  onChange,
  onSubmit,
  onClose,
  isSaving,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Create HR/Admin Account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a new office account with a temporary password.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create account"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="grid min-h-0 gap-4 overflow-y-auto p-5 md:grid-cols-2"
          noValidate
        >
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(value) => onChange("firstName", value)}
            error={errors.firstName}
            required
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(value) => onChange("lastName", value)}
            error={errors.lastName}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => onChange("email", value)}
            error={errors.email}
            required
          />
          <Input
            label="Temporary Password"
            type="password"
            value={form.password}
            onChange={(value) => onChange("password", value)}
            error={errors.password}
            required
          />
          <div className="flex justify-end gap-2 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`${buttonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`${buttonClass} bg-[#0056b3] text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {isSaving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AccountTable({
  title,
  users,
  emptyLabel,
  onView,
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
                      className="oas-action-button"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => onToggleStatus(user)}
                      className={`${
                        user.isActive
                          ? "oas-danger-button"
                          : `${buttonClass} border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {user.isActive ? "Suspend" : "Activate"}
                    </button>
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

function JobListingSection({ jobs, formatDate }) {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Job Listing</h2>
        <p className="mt-1 text-sm text-slate-500">
          View-only list of job openings posted by HR/Admin.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <TableHead>Job Title</TableHead>
              <TableHead>Barangay</TableHead>
              <TableHead>Vacancies</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-950">{job.title}</p>
                  {job.positionCategory && (
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {job.positionCategory}
                    </p>
                  )}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {job.barangay || job.location || "Not set"}
                </td>
                <td className="px-5 py-4 text-slate-700">{job.vacancy}</td>
                <td className="px-5 py-4 text-slate-700">
                  {formatDeadline(job, formatDate)}
                </td>
                <td className="px-5 py-4">
                  <JobStatusPill status={job.status} />
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="oas-action-button"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {jobs.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            No job listings available.
          </p>
        )}
      </div>

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          formatDate={formatDate}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </section>
  );
}

function JobDetailsModal({ job, formatDate, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white sm:max-h-[92vh]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
              {job.title}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {job.location || job.barangay || "Location not set"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close job details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <JobDetailItem label="Category" value={job.positionCategory || "Not set"} />
            <JobDetailItem label="Barangay" value={job.barangay || "Not set"} />
            <JobDetailItem label="Vacancies" value={job.vacancy} />
            <JobDetailItem
              label="Deadline"
              value={formatDeadline(job, formatDate)}
            />
          </div>

          <section className="mt-5 rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900">Description</h4>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {job.description || "No description provided yet."}
            </p>
          </section>

          <section className="mt-5 rounded-lg border border-slate-200 p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Upload Requirements
            </h4>
            {job.requirements?.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {job.requirements.map((requirement) => (
                  <div
                    key={requirement.field || requirement.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                      {requirement.label}
                    </p>
                    {requirement.description && (
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                        {requirement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No upload requirements configured.
              </p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className={`${buttonClass} bg-[#0056b3] text-white hover:bg-[#003a78]`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function JobDetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function JobStatusPill({ status }) {
  const isOpen = status === "open";
  const isExpired = status === "expired";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        isOpen
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isExpired
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {String(status || "open").replaceAll("_", " ")}
    </span>
  );
}

function AccountModal({ account, mode, isSaving, onClose, onEdit, onSave }) {
  const [draft, setDraft] = useState(account);
  const [modalErrors, setModalErrors] = useState({});
  const { showToast } = useToast();
  const isEditing = mode === "edit";
  const displayedAccount = isEditing ? draft : account;

  const setField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setModalErrors((current) => {
      if (!current[field]) return current;

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const handleSave = () => {
    const validationErrors = validateAccountDetailsForm(draft);

    if (Object.keys(validationErrors).length > 0) {
      setModalErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted account fields.",
      });
      return;
    }

    setModalErrors({});
    onSave(draft);
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
            value={displayedAccount.firstName}
            onChange={(value) => setField("firstName", value)}
            disabled={!isEditing}
            error={isEditing ? modalErrors.firstName : ""}
            required
          />
          <Input
            label="Last Name"
            value={displayedAccount.lastName}
            onChange={(value) => setField("lastName", value)}
            disabled={!isEditing}
            error={isEditing ? modalErrors.lastName : ""}
            required
          />
          <Input
            label="Middle Name"
            value={displayedAccount.middleName}
            onChange={(value) => setField("middleName", value)}
            disabled={!isEditing || displayedAccount.noMiddleName}
          />
          <label className="mt-7 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={Boolean(displayedAccount.noMiddleName)}
              onChange={(event) => setField("noMiddleName", event.target.checked)}
              disabled={!isEditing}
            />
            No middle name
          </label>
          <Input
            label="Email"
            type="email"
            value={displayedAccount.email}
            onChange={(value) => setField("email", value)}
            disabled={!isEditing}
            error={isEditing ? modalErrors.email : ""}
            required
          />
          <Input
            label="Contact Number"
            value={displayedAccount.contactNumber}
            onChange={(value) => setField("contactNumber", value)}
            disabled={!isEditing}
          />
          <div>
            <p className="text-sm font-semibold text-slate-500">Role</p>
            <p className="mt-2 capitalize text-slate-900">
              {String(displayedAccount.role).replaceAll("_", " ")}
            </p>
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
          {isEditing ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
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
  error = "",
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
        aria-invalid={Boolean(error)}
        aria-required={required}
        className={`mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition focus:ring-2 disabled:bg-slate-100 ${
          error
            ? "border-red-500 ring-1 ring-red-100 focus:ring-red-100"
            : "border-slate-300 focus:ring-blue-500"
        }`}
      />
      {error && (
        <p className="mt-1.5 text-[12px] font-semibold text-red-600">
          {error}
        </p>
      )}
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
