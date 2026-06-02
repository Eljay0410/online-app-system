import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, MailCheck, Plus, X } from "lucide-react";
import { apiRequest } from "../../lib/api";
import ActivityLogSection from "./ActivityLogSection";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import { useAuth } from "../auth/auth";
import { VacancySummaryTable } from "../jobs/jobPostingUi";

const emptyAdminForm = {
  firstName: "",
  lastName: "",
  email: "",
};

const pageMeta = {
  dashboard: {
    title: "System Overview",
    description: "Monitor accounts, vacancy postings, and applications.",
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
    title: "Vacancies",
    description: "View posted vacancies from HR/Admin.",
  },
  "activity-logs": {
    title: "Activity Logs",
    description: "Backtrack admin changes across postings, positions, and applications.",
  },
};

const superAdminSections = new Set(Object.keys(pageMeta));

function normalizeSuperAdminSection(section) {
  return superAdminSections.has(section) ? section : "dashboard";
}

const buttonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";
const accountPageSizeOptions = [10, 25, 50];
const jobCardPageSizeOptions = [6, 9, 12];

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

const normalizeAccountEmail = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

function isSameAccount(account, currentUser) {
  if (!account || !currentUser) return false;

  if (account.id && currentUser.id) {
    return Number(account.id) === Number(currentUser.id);
  }

  return (
    normalizeAccountEmail(account.email) === normalizeAccountEmail(currentUser.email)
  );
}

function filterVisibleAccounts(users = [], currentUser, allowedRoles = []) {
  const roleSet = new Set(allowedRoles.map((role) => role.toLowerCase()));

  return users.filter((account) => {
    const role = String(account.role || "").toLowerCase();

    if (role === "superadmin") return false;
    if (roleSet.size > 0 && !roleSet.has(role)) return false;

    return !isSameAccount(account, currentUser);
  });
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeTab = normalizeSuperAdminSection(sectionParam);
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
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [modalMode, setModalMode] = useState("view");
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [applicantPage, setApplicantPage] = useState(1);
  const [applicantPageSize, setApplicantPageSize] = useState(10);
  const [applicantPagination, setApplicantPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [officePage, setOfficePage] = useState(1);
  const [officePageSize, setOfficePageSize] = useState(10);
  const [officePagination, setOfficePagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [jobPage, setJobPage] = useState(1);
  const [jobPageSize, setJobPageSize] = useState(9);
  const [jobPagination, setJobPagination] = useState({
    limit: 9,
    offset: 0,
    total: 0,
  });
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const loadDashboard = useCallback(async () => {
    const applicantParams = new URLSearchParams({
      limit: String(applicantPageSize),
      offset: String((applicantPage - 1) * applicantPageSize),
    });
    const officeParams = new URLSearchParams({
      limit: String(officePageSize),
      offset: String((officePage - 1) * officePageSize),
    });
    const jobParams = new URLSearchParams({
      limit: String(jobPageSize),
      offset: String((jobPage - 1) * jobPageSize),
    });

    const [overviewResult, applicantResult, officeResult, jobResult] =
      await Promise.all([
        apiRequest("/api/superadmin/overview"),
        apiRequest(`/api/superadmin/user-accounts?${applicantParams.toString()}`),
        apiRequest(`/api/superadmin/office-accounts?${officeParams.toString()}`),
        apiRequest(`/api/superadmin/job-openings?${jobParams.toString()}`),
      ]);

    setOverview({
      users: overviewResult.users || [],
      jobs: overviewResult.jobs || [],
      applications: overviewResult.applications || [],
    });
    setApplicantUsers(applicantResult.users || []);
    setOfficeUsers(officeResult.users || []);
    setJobListings(jobResult.jobs || []);
    setApplicantPagination(
      applicantResult.pagination || {
        limit: applicantPageSize,
        offset: (applicantPage - 1) * applicantPageSize,
        total: applicantResult.users?.length || 0,
      }
    );
    setOfficePagination(
      officeResult.pagination || {
        limit: officePageSize,
        offset: (officePage - 1) * officePageSize,
        total: officeResult.users?.length || 0,
      }
    );
    setJobPagination(
      jobResult.pagination || {
        limit: jobPageSize,
        offset: (jobPage - 1) * jobPageSize,
        total: jobResult.jobs?.length || 0,
      }
    );
  }, [
    applicantPage,
    applicantPageSize,
    jobPage,
    jobPageSize,
    officePage,
    officePageSize,
  ]);

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

  const visibleApplicantUsers = useMemo(
    () => filterVisibleAccounts(applicantUsers, currentUser, ["applicant"]),
    [applicantUsers, currentUser]
  );

  const visibleOfficeUsers = useMemo(
    () => filterVisibleAccounts(officeUsers, currentUser, ["admin"]),
    [officeUsers, currentUser]
  );

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
    const nextTab = normalizeSuperAdminSection(tab);

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("section", nextTab);
      return nextParams;
    });
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
      const result = await apiRequest("/api/superadmin/admins", {
        method: "POST",
        body: JSON.stringify({
          firstName: adminForm.firstName,
          lastName: adminForm.lastName,
          email: adminForm.email,
        }),
      });
      setAdminForm(emptyAdminForm);
      setAdminErrors({});
      setIsCreateAdminOpen(false);
      showToast({
        type: result.emailSent ? "success" : "warning",
        message:
          result.message ||
          "Office account created. A password setup email was sent.",
      });
      await loadDashboard();
    } catch (err) {
      const errorMessage = err.message || "Failed to create office account.";
      const normalizedMessage = errorMessage.toLowerCase();

      if (normalizedMessage.includes("email")) {
        setAdminErrors({ email: errorMessage });
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
    setSelectedAccount((current) =>
      current?.id === updatedUser.id ? updatedUser : current
    );
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

  const contentPadding = getSidebarContentPadding(collapsed);
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
                  users={visibleApplicantUsers}
                  pagination={applicantPagination}
                  page={applicantPage}
                  pageSize={applicantPageSize}
                  onPageChange={setApplicantPage}
                  onPageSizeChange={(nextSize) => {
                    setApplicantPageSize(nextSize);
                    setApplicantPage(1);
                  }}
                  itemLabel="registered users"
                  emptyLabel="No applicant users yet."
                  onView={(user) => openAccount(user, "view")}
                  onEdit={(user) => openAccount(user, "edit")}
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
                    users={visibleOfficeUsers}
                    pagination={officePagination}
                    page={officePage}
                    pageSize={officePageSize}
                    onPageChange={setOfficePage}
                    onPageSizeChange={(nextSize) => {
                      setOfficePageSize(nextSize);
                      setOfficePage(1);
                    }}
                    itemLabel="office accounts"
                    emptyLabel="No office accounts yet."
                    onView={(user) => openAccount(user, "view")}
                    onEdit={(user) => openAccount(user, "edit")}
                    onToggleStatus={toggleStatus}
                    isSaving={isSaving}
                  />
                </div>
              )}

              {activeTab === "job-listing" && (
                <JobListingSection
                  jobs={jobListings}
                  pagination={jobPagination}
                  page={jobPage}
                  pageSize={jobPageSize}
                  onPageChange={setJobPage}
                  onPageSizeChange={(nextSize) => {
                    setJobPageSize(nextSize);
                    setJobPage(1);
                  }}
                  formatDate={formatDate}
                />
              )}

              {activeTab === "activity-logs" && <ActivityLogSection />}
            </>
          )}
        </div>
      </section>

      {selectedAccount && (
        <AccountModal
          key={`${selectedAccount.id}-${modalMode}`}
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Stat label="Users" value={totals.users} />
        <Stat label="Vacancy Postings" value={totals.jobs} />
        <Stat label="Applications" value={totals.applications} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Users by Role" items={overview.users} labelKey="role" />
        <Breakdown title="Vacancies by Status" items={overview.jobs} labelKey="status" />
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
    <div className="oas-panel p-3 sm:p-5">
      <p className="text-[11px] font-semibold leading-tight text-slate-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold leading-none text-slate-950 sm:mt-2 sm:text-2xl">
        {value}
      </p>
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
              Add an office account and email a secure password setup link.
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

          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 md:col-span-2">
            <div className="flex gap-3">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <p className="leading-6">
                No temporary password is stored. The account stays inactive
                until the recipient opens the emailed setup link and chooses a
                password.
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end">
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
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = "users",
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

      {users.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <>
          <div className="grid gap-2 p-2 sm:p-4 md:hidden">
            {users.map((user) => (
              <article
                key={user.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                    {fullName(user)}
                  </h3>
                  <p className="mt-1 break-all text-xs font-medium text-slate-500">
                    {user.email}
                  </p>
                </div>

                <dl className="mt-3 grid gap-2 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Role</dt>
                    <dd className="text-right font-semibold capitalize text-slate-800">
                      {String(user.role).replaceAll("_", " ")}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd>
                      <StatusPill
                        active={user.isActive}
                        hasPassword={user.hasPassword}
                      />
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Last Login</dt>
                    <dd className="text-right font-semibold text-slate-800">
                      {formatDate(user.lastLogin)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onView(user)}
                    className="oas-action-button oas-card-action-button"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || isPendingSetupAccount(user)}
                    onClick={() => onToggleStatus(user)}
                    className={`oas-card-action-button ${buttonClass} px-2 ${
                      isPendingSetupAccount(user)
                        ? "border border-blue-200 bg-blue-50 text-blue-700"
                        : user.isActive
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {getStatusActionLabel(user)}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
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
                  <StatusPill
                    active={user.isActive}
                    hasPassword={user.hasPassword}
                  />
                </td>
                <td className="px-5 py-4 text-slate-700">
                  {formatDate(user.lastLogin)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView(user);
                      }}
                      className="oas-action-button"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || isPendingSetupAccount(user)}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleStatus(user);
                      }}
                      className={`${buttonClass} ${
                        isPendingSetupAccount(user)
                          ? "border border-blue-200 bg-blue-50 text-blue-700"
                          : user.isActive
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {getStatusActionLabel(user)}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={pagination?.total || users.length}
            currentCount={users.length}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={accountPageSizeOptions}
            itemLabel={itemLabel}
          />
        </>
      )}
    </section>
  );
}

function JobListingSection({
  jobs,
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  formatDate,
}) {
  const [selectedJob, setSelectedJob] = useState(null);

  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Vacancies</h2>
        <p className="mt-1 text-sm text-slate-500">
          View all posted vacancies and open their full details.
        </p>
      </div>

      {jobs.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          No vacancies available.
        </p>
      ) : (
        <div className="grid gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="oas-panel flex h-full min-w-0 flex-col p-4 transition hover:border-blue-200 hover:shadow-md sm:p-5"
            >
              <div className="min-w-0">
                <h3 className="line-clamp-2 min-h-0 break-words text-sm font-bold leading-5 text-slate-950 [overflow-wrap:anywhere] sm:min-h-[2.5rem] sm:text-base">
                  {job.title}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-0 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] sm:min-h-[2.5rem] sm:text-sm">
                  {job.location || job.barangay || "Location not set"}
                </p>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:mt-4 sm:text-sm">
                <p className="truncate">
                  <span className="font-semibold">Vacancy:</span>{" "}
                  <span>{job.vacancy}</span>
                </p>

                <p className="truncate">
                  <span className="font-semibold">Deadline:</span>{" "}
                  {formatDeadline(job, formatDate)}
                </p>
              </div>

              <div className="mt-auto flex justify-end pt-4 sm:pt-5">
                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="oas-action-button"
                >
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {jobs.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={pagination?.total || jobs.length}
          currentCount={jobs.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={jobCardPageSizeOptions}
          itemLabel="vacancies"
        />
      )}

      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </section>
  );
}

function JobDetailsModal({ job, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92dvh]">
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
            aria-label="Close vacancy details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <VacancySummaryTable job={job} />

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Status</span>
            <JobStatusPill status={job.status} />
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 p-3 sm:mt-5 sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">Description</h4>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere] sm:mt-3 sm:text-sm sm:leading-6">
              {job.description || "No description provided yet."}
            </p>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 p-3 sm:mt-5 sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">
              List of Requirements
            </h4>
            {job.requirements?.length ? (
              <ul className="mt-3 space-y-2.5">
                {job.requirements.map((requirement) => (
                  <li
                    key={requirement.field || requirement.label}
                    className="border-b border-slate-200 pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-xs font-semibold text-slate-800 [overflow-wrap:anywhere] sm:text-sm">
                        {requirement.label}
                      </p>
                      {requirement.required === false && (
                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">
                          Optional
                        </span>
                      )}
                    </div>
                    {requirement.description && (
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                        {requirement.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No requirements configured.
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
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92dvh]">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
                {isEditing ? "Edit Account" : "Account Details"}
              </h3>
              <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                {account.email}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close account details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 gap-4 overflow-y-auto p-5 md:grid-cols-2">
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

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
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

function isPendingSetupAccount(user) {
  return !user.isActive && !user.hasPassword;
}

function getStatusActionLabel(user) {
  if (isPendingSetupAccount(user)) return "Awaiting Setup";
  return user.isActive ? "Suspend" : "Activate";
}

function StatusPill({ active, hasPassword }) {
  const isPendingSetup = !active && !hasPassword;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isPendingSetup
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {isPendingSetup ? "Pending Setup" : active ? "Active" : "Suspended"}
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
