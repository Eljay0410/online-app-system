import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Download,
  FileText,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";
import { API_BASE_URL, apiRequest, getAuthToken } from "../../lib/api";
import { useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import {
  QualificationStandards,
  RequirementSummary,
  VacancyBreakdown,
  VacancyDescription,
  VacancySummaryTable,
  formatTime,
} from "../jobs/jobPostingUi";
import { getApplicationSubmissionRule } from "../../lib/applicationRequirements";

const statusLabels = {
  draft: "Draft",
  submitted: "Pending Review",
  reviewed: "Reviewed",
  qualified: "Qualified",
  disqualified: "Disqualified",
  shortlisted: "Shortlisted",
  selected: "Selected",
  rejected: "Rejected",
  hired: "Hired",
  pending_review: "Pending Review",
  for_compliance: "Pending Review",
  under_review: "Under Review",
};

const statusStyles = {
  submitted: {
    badge: "border-slate-300 bg-white text-slate-700",
    accent: "border-l-slate-400",
    dot: "bg-slate-500",
  },
  pending_review: {
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    accent: "border-l-blue-500",
    dot: "bg-blue-600",
  },
  reviewed: {
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    accent: "border-l-blue-500",
    dot: "bg-blue-600",
  },
  for_compliance: {
    badge: "border-orange-300 bg-orange-50 text-orange-800",
    accent: "border-l-orange-500",
    dot: "bg-orange-600",
  },
  under_review: {
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    accent: "border-l-amber-400",
    dot: "bg-amber-500",
  },
  qualified: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-600",
  },
  shortlisted: {
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    accent: "border-l-amber-500",
    dot: "bg-amber-600",
  },
  selected: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-600",
  },
  disqualified: {
    badge: "border-red-300 bg-red-50 text-red-700",
    accent: "border-l-red-500",
    dot: "bg-red-600",
  },
  rejected: {
    badge: "border-red-300 bg-red-50 text-red-700",
    accent: "border-l-red-500",
    dot: "bg-red-600",
  },
  hired: {
    badge: "border-emerald-300 bg-emerald-50 text-emerald-800",
    accent: "border-l-emerald-600",
    dot: "bg-emerald-700",
  },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "qualified", label: "Qualified" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "selected", label: "Selected" },
  { value: "disqualified", label: "Disqualified" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const compactButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";
const applicationPageSizeOptions = [5, 10, 20];

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getStatusLabel = (status) =>
  statusLabels[status] || status || "Pending Review";

const getApplicationPosition = (application) =>
  application.jobTitle || application.position || "Not specified";

const getApplicationLocation = (application) =>
  application.jobLocation || "Location not set";

const getDeadlineText = (application) => {
  const date = formatDate(application.jobDeadline);
  if (date === "N/A") return "No deadline listed";
  const time = application.jobDeadlineTime
    ? formatTime(application.jobDeadlineTime)
    : "";
  return `${date} ${time}`.trim();
};

const requirementStatusLabels = {
  pending: "Pending",
  checked: "Checked",
  incomplete: "Incomplete",
  invalid: "Invalid",
  approved: "Checked",
  missing: "Incomplete",
  rejected: "Invalid",
};

const requirementStatusClasses = {
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  checked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  incomplete: "border-orange-200 bg-orange-50 text-orange-800",
  invalid: "border-red-200 bg-red-50 text-red-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  missing: "border-orange-200 bg-orange-50 text-orange-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const getRequirementStatusLabel = (status) =>
  requirementStatusLabels[status] || status || "Pending";

const getRequirementStatusClass = (status) =>
  requirementStatusClasses[status] ||
  "border-slate-200 bg-slate-50 text-slate-700";

const getRequirementFileName = (file) =>
  file?.name || file?.fileName || file?.filename || "No file attached";

const normalizeRequirementKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getRequirementKey = (requirement = {}) =>
  normalizeRequirementKey(
    requirement.field || requirement.requirementField || requirement.label
  );

function buildSubmittedRequirementRows(
  submittedRequirements = [],
  vacancyRequirements = []
) {
  const submittedByKey = new Map();
  const usedSubmitted = new Set();

  submittedRequirements.forEach((requirement, index) => {
    const key = getRequirementKey(requirement) || `submitted-${index}`;
    const group = submittedByKey.get(key) || [];
    group.push({ requirement, index });
    submittedByKey.set(key, group);
  });

  const rows = [];

  vacancyRequirements.forEach((requirement, index) => {
    const key = getRequirementKey(requirement) || `vacancy-${index}`;
    const submittedGroup = submittedByKey.get(key) || [];

    if (submittedGroup.length === 0) {
      rows.push({
        ...requirement,
        id: requirement.id || key,
        field: requirement.field || key,
        status: "incomplete",
        file: null,
        missing: true,
      });
      return;
    }

    submittedGroup.forEach(({ requirement: submittedRequirement, index: submittedIndex }) => {
      usedSubmitted.add(submittedIndex);
      rows.push({
        ...requirement,
        ...submittedRequirement,
        label: submittedRequirement.label || requirement.label,
        description:
          submittedRequirement.description || requirement.description || "",
      });
    });
  });

  submittedRequirements.forEach((requirement, index) => {
    if (!usedSubmitted.has(index)) {
      rows.push(requirement);
    }
  });

  return rows;
}

function buildFileUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;

  return `${API_BASE_URL}${path}`;
}

async function downloadRequirementFile(file = {}) {
  const path = file.dataUrl || file.downloadUrl || file.previewUrl || "";

  if (!path) return;

  const token = getAuthToken();
  const response = await fetch(buildFileUrl(path), {
    headers: token && !path.startsWith("data:") ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Could not download this file.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getRequirementFileName(file);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [statusCounts, setStatusCounts] = useState({ all: 0 });
  const { showToast } = useToast();
  const restoreApplicationId = location.state?.restoreApplicationId;
  const restoreApplication = location.state?.restoreApplication || null;

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String((page - 1) * pageSize),
        });

        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }

        const [profileResult, applicationsResult] = await Promise.all([
          apiRequest("/api/applicant/profile").catch(() => null),
          apiRequest(`/api/applicant/applications?${params.toString()}`).catch(
            () => null
          ),
        ]);

        if (!isMounted) return;

        setProfile(profileResult?.profile || null);
        setApplications(applicationsResult?.applications || []);
        setPagination(
          applicationsResult?.pagination || {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            total: applicationsResult?.applications?.length || 0,
          }
        );
        setStatusCounts(applicationsResult?.statusCounts || { all: 0 });
      } catch (error) {
        if (isMounted) {
          showToast({
            type: "error",
            message: error.message || "Failed to load applications.",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [page, pageSize, showToast, statusFilter]);

  useEffect(() => {
    if (!restoreApplicationId || selectedApplication) return undefined;

    const restoredFromPage = applications.find(
      (application) => String(application.id) === String(restoreApplicationId)
    );
    const restoredFromState =
      restoreApplication &&
      String(restoreApplication.id) === String(restoreApplicationId)
        ? restoreApplication
        : null;
    const restoredApplication = restoredFromPage || restoredFromState;

    if (!restoredApplication) return undefined;

    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;

      setSelectedApplication(restoredApplication);
      navigate(location.pathname, { replace: true, state: null });
    });

    return () => {
      isActive = false;
    };
  }, [
    applications,
    location.pathname,
    navigate,
    restoreApplication,
    restoreApplicationId,
    selectedApplication,
  ]);

  const counts = useMemo(
    () => ({
      all: 0,
      submitted: 0,
      reviewed: 0,
      qualified: 0,
      shortlisted: 0,
      selected: 0,
      disqualified: 0,
      rejected: 0,
      hired: 0,
      ...statusCounts,
    }),
    [statusCounts]
  );

  const filteredApplications = applications;

  const profileReady = Boolean(profile?.profileComplete || user?.profileComplete);
  const contentPadding = getSidebarContentPadding(collapsed);

  useEffect(() => {
    if (!selectedApplication) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedApplication(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedApplication]);

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab="applications"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role="applicant"
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <header className="mb-5">
            <h1 className="oas-page-title">My Applications</h1>
            <p className="oas-page-description">
              {user?.firstName
                ? `${user.firstName}, track every submitted application in one place.`
                : "Track every submitted application in one place."}
            </p>
          </header>

          {!isLoading && !profileReady && (
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-white px-4 py-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">
                    Complete your profile before submitting new applications.
                  </p>
                  <p className="mt-1 text-slate-600">
                    HR uses these details to validate your submission.
                  </p>
                </div>
              </div>

              <Link
                to="/profile"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Update profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <section className="oas-panel">
            <div className="border-b border-slate-200 bg-white">
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-950">
                      Application Tracker
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                      Follow each vacancy from submission to final decision.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[440px]">
                    <TrackerStat
                      label="Active"
                      value={
                        (counts.submitted || 0) +
                        (counts.reviewed || 0) +
                        (counts.qualified || 0) +
                        (counts.shortlisted || 0)
                      }
                    />
                    <TrackerStat
                      label="Selected"
                      value={(counts.selected || 0) + (counts.hired || 0)}
                    />
                    <TrackerStat
                      label="Completed"
                      value={
                        (counts.rejected || 0) +
                        (counts.disqualified || 0)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto border-t border-slate-200 px-5 py-3">
                {filterOptions.map((option) => {
                  const isActive = statusFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.value);
                        setPage(1);
                      }}
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                        isActive
                          ? "border-[#0056b3] bg-[#0056b3] text-white shadow-sm"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span
                        className={`grid min-w-6 place-items-center rounded-md px-1.5 py-0.5 text-[11px] ${
                          isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {counts[option.value] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading applications...
              </div>
            ) : counts.all === 0 ? (
              <EmptyState
                title="No applications yet"
                message="Browse open vacancies and submit an application when you are ready."
              />
            ) : filteredApplications.length === 0 ? (
              <EmptyState
                title="No applications match this status"
                message="Choose another status filter to view the rest of your submissions."
              />
            ) : (
              <div className="divide-y divide-slate-200 bg-white">
                {filteredApplications.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    onSelect={() => setSelectedApplication(application)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredApplications.length > 0 && (
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalItems={pagination.total || filteredApplications.length}
                currentCount={filteredApplications.length}
                onPageChange={setPage}
                onPageSizeChange={(nextSize) => {
                  setPageSize(nextSize);
                  setPage(1);
                }}
                pageSizeOptions={applicationPageSizeOptions}
                itemLabel="applications"
              />
            )}
          </section>
        </div>
      </section>

      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
        />
      )}
    </main>
  );
}

function TrackerStat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold leading-none text-slate-950">
        {value}
      </p>
    </div>
  );
}

function ApplicationRow({ application, onSelect }) {
  const status = application.status || "submitted";
  const statusTone = statusStyles[status] || statusStyles.submitted;
  const position = getApplicationPosition(application);
  const uan = application.uan || "Not assigned";
  const location = getApplicationLocation(application);

  return (
    <article
      className={`border-l-4 ${statusTone.accent} px-5 py-5 transition hover:bg-slate-50`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.65fr)_auto] xl:items-center">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
            <BriefcaseBusiness className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-950">
              {position}
            </h3>
            <p className="mt-1 line-clamp-2 break-words text-sm text-slate-600 [overflow-wrap:anywhere]">
              {location}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              <span>Applied {formatDate(application.createdAt)}</span>
              <span className="text-slate-300">|</span>
              <span>UAN {uan}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusTone.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-sm ${statusTone.dot}`} />
              {getStatusLabel(status)}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Updated {formatDate(application.updatedAt)}
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Deadline:{" "}
            <span className="text-slate-700">
              {getDeadlineText(application)}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white transition hover:bg-[#003a78]"
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
}

function ApplicationDetailsModal({ application, onClose }) {
  const [previewFile, setPreviewFile] = useState(null);
  const status = application.status || "submitted";
  const statusTone = statusStyles[status] || statusStyles.submitted;
  const position = getApplicationPosition(application);
  const uan = application.uan || "Not assigned";
  const location = getApplicationLocation(application);
  const remarks = String(application.reviewNotes || "").trim();
  const jobUrl = application.jobOpeningId ? `/jobs/${application.jobOpeningId}` : "";
  const submissionRule = getApplicationSubmissionRule(position);
  const requiresPersonalSubmission = Boolean(
    application.personalSubmissionRequired ||
      application.requirementSubmissionMode === "personal" ||
      submissionRule.requiresPersonalSubmission
  );
  const submittedRequirements = Array.isArray(application.requirements)
    ? application.requirements
    : [];
  const vacancyRequirements = Array.isArray(application.jobRequirements)
    ? application.jobRequirements
    : [];
  const submittedRequirementRows = buildSubmittedRequirementRows(
    submittedRequirements,
    vacancyRequirements
  );
  const vacancyItems = Array.isArray(application.jobItems)
    ? application.jobItems
    : [];
  const vacancyCount =
    application.jobVacancy ||
    vacancyItems.reduce(
      (sum, item) => sum + Math.max(0, Number(item.vacancyCount) || 0),
      0
    ) ||
    "N/A";
  const vacancy = {
    id: application.jobOpeningId,
    title: position,
    location,
    vacancy: vacancyCount,
    vacancyItems,
    salaryGrade: application.jobSalaryGrade || "",
    salaryAmount: application.jobSalaryAmount || "",
    deadline: application.jobDeadline || null,
    deadlineTime: application.jobDeadlineTime || "",
    education: application.jobEducation || "",
    training: application.jobTraining || "",
    experience: application.jobExperience || "",
    eligibility: application.jobEligibility || "",
    requirements: vacancyRequirements,
    description: application.jobDescription || "",
    positionCategory: application.jobPositionCategory || "",
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex min-h-0 flex-1 flex-col border-l-4 ${statusTone.accent}`}>
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Application Details
              </p>
              <h2 className="mt-2 break-words text-xl font-semibold text-slate-950 [overflow-wrap:anywhere]">
                {position}
              </h2>
              <p className="mt-1 text-sm text-slate-500">UAN {uan}</p>
            </div>

            <button
              type="button"
              aria-label="Close application details"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-bold text-slate-950">
                  Vacancy Posting Details
                </h3>
                <span
                  className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusTone.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-sm ${statusTone.dot}`} />
                  {getStatusLabel(status)}
                </span>
              </div>

              <VacancySummaryTable job={vacancy} showHeading={false} />

              <VacancyBreakdown job={vacancy} showHeading={false} />
              <VacancyDescription job={vacancy} />
              <QualificationStandards job={vacancy} />
              <RequirementSummary job={vacancy} />
            </div>

            {remarks && (
              <section className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:mt-5 sm:p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  HR remarks
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-blue-950 [overflow-wrap:anywhere]">
                  {remarks}
                </p>
              </section>
            )}

            {!requiresPersonalSubmission && (
              <SubmittedRequirementsSection
                requirements={submittedRequirementRows}
                onPreviewFile={setPreviewFile}
                onDownloadFile={downloadRequirementFile}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
            {jobUrl && (
              <Link
                to={jobUrl}
                className="oas-action-button"
                state={{
                  returnTo: "/applications",
                  fromLabel: "My Applications",
                  restoreApplicationId: application.id,
                  restoreApplication: application,
                  returnState: {
                    restoreApplicationId: application.id,
                    restoreApplication: application,
                  },
                }}
              >
                View vacancy post
              </Link>
            )}
          </div>
        </div>
      </section>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          backLabel="Back to application details"
        />
      )}
    </div>
  );
}

function SubmittedRequirementsSection({
  requirements = [],
  onPreviewFile,
  onDownloadFile,
}) {
  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
      <div>
        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <FileText className="h-4 w-4 text-slate-500" />
          Submitted Requirements
        </h4>
        <p className="mt-1 text-sm text-slate-600">
          Uploaded files attached to this application.
        </p>
      </div>

      {requirements.length > 0 ? (
        <div className="mt-4 space-y-3">
          {requirements.map((requirement, index) => {
            const requirementFile = requirement.file;
            const hasFile = Boolean(requirementFile);
            const requirementStatus = hasFile
              ? requirement.status || "pending"
              : "incomplete";
            const statusLabel = hasFile
              ? getRequirementStatusLabel(requirementStatus)
              : "Missing / Not submitted";
            const canPreview = Boolean(
              requirementFile?.previewUrl || requirementFile?.dataUrl
            );
            const canDownload = Boolean(
              requirementFile?.downloadUrl ||
                requirementFile?.previewUrl ||
                requirementFile?.dataUrl
            );

            return (
              <div
                key={requirement.id || requirement.field || `${requirement.label}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                        {requirement.label || requirement.field || "Requirement"}
                        {requirement.required ? (
                          <span className="ml-1 text-red-600">*</span>
                        ) : null}
                      </h3>
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getRequirementStatusClass(
                          requirementStatus
                        )}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {requirement.description && (
                      <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                        {requirement.description}
                      </p>
                    )}

                    <p
                      className={`mt-2 break-words text-sm [overflow-wrap:anywhere] ${
                        hasFile
                          ? "font-semibold text-slate-700"
                          : "font-medium text-orange-800"
                      }`}
                    >
                      {hasFile
                        ? getRequirementFileName(requirementFile)
                        : "No file uploaded for this requirement."}
                    </p>

                    {requirement.remarks && (
                      <p className="mt-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm leading-6 text-orange-900">
                        {requirement.remarks}
                      </p>
                    )}
                  </div>

                  {hasFile && (
                    <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                      {canPreview && (
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewFile?.({
                              ...requirementFile,
                              name: getRequirementFileName(requirementFile),
                            })
                          }
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          View
                        </button>
                      )}
                      {canDownload && (
                        <button
                          type="button"
                          onClick={() => {
                            Promise.resolve(onDownloadFile?.(requirementFile)).catch(
                              () => {
                                window.alert("Could not download this file.");
                              }
                            );
                          }}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0056b3] px-3 text-xs font-semibold text-white transition hover:bg-[#003a78]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No submitted requirement records were found for this application.
        </p>
      )}
    </section>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <Link
        to="/"
        className={`${compactButtonClass} mt-5 gap-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
      >
        Browse Vacancies
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
