import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  MessageSquareText,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";

const statusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  pending_review: "Pending Review",
  for_compliance: "For Compliance",
  under_review: "Under Review",
  qualified: "Qualified",
  rejected: "Rejected",
  hired: "Hired",
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

const statusGuidance = {
  submitted: {
    title: "Application received",
    next: "HR has your submission. No action is needed unless your profile or requirements change.",
    action: "Keep your contact details active and wait for the first review update.",
  },
  pending_review: {
    title: "Pending HR review",
    next: "Your application is queued for HR requirement checking.",
    action: "Wait for HR remarks or compliance instructions.",
  },
  for_compliance: {
    title: "Compliance needed",
    next: "One or more submitted requirements need replacement or clarification.",
    action: "Open the details and replace only the documents marked for compliance.",
  },
  under_review: {
    title: "Screening in progress",
    next: "HR is checking your profile, eligibility, and uploaded requirements.",
    action: "Watch this page and your email for interview or document instructions.",
  },
  qualified: {
    title: "Qualified",
    next: "You passed the current evaluation stage. HR will provide the next instruction.",
    action: "Keep copies of your documents ready for verification.",
  },
  rejected: {
    title: "Not selected",
    next: "This application is closed, but you can still apply to other open vacancies.",
    action: "Review new postings and keep your profile updated.",
  },
  hired: {
    title: "Hired",
    next: "Your application has been marked as hired.",
    action: "Watch for final onboarding instructions from HR.",
  },
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "for_compliance", label: "Compliance" },
  { value: "under_review", label: "Under Review" },
  { value: "qualified", label: "Qualified" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

const compactButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";
const applicationPageSizeOptions = [5, 10, 20];
const complianceRequirementStatuses = new Set([
  "missing",
  "needs_resubmission",
  "rejected",
]);
const uploadMaxFileSize = 15 * 1024 * 1024;
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const acceptedRequirementFileTypesText = acceptedRequirementFileTypes.join(",");

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

const getStatusLabel = (status) => statusLabels[status] || status || "Submitted";

const getStatusGuidance = (status) =>
  statusGuidance[status] || statusGuidance.submitted;

const getApplicationPosition = (application) =>
  application.jobTitle || application.position || "Not specified";

const getApplicationLocation = (application) =>
  application.jobLocation || "Location not set";

const getDeadlineText = (application) => {
  const date = formatDate(application.jobDeadline);
  if (date === "N/A") return "No deadline listed";
  return `${date} ${application.jobDeadlineTime || ""}`.trim();
};

const getRequirementCount = (application) => {
  if (Array.isArray(application.requirements)) {
    return application.requirements.length;
  }

  if (Array.isArray(application.jobRequirements)) {
    return application.jobRequirements.length;
  }

  return 0;
};

const requirementStatusLabels = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  needs_resubmission: "Needs Resubmission",
  missing: "Missing",
};

const requirementStatusClasses = {
  pending: "border-blue-200 bg-blue-50 text-blue-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  needs_resubmission: "border-orange-200 bg-orange-50 text-orange-700",
  missing: "border-slate-300 bg-slate-100 text-slate-700",
};

const getRequirementStatusLabel = (status) =>
  requirementStatusLabels[status] || status || "Pending";

const getRequirementStatusClass = (status) =>
  requirementStatusClasses[status] ||
  "border-slate-200 bg-slate-50 text-slate-700";

const getRequirementFileName = (file) =>
  file?.name || file?.fileName || file?.filename || "No file attached";

export default function ApplicantDashboard() {
  const { user } = useAuth();
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

  const counts = useMemo(
    () => ({
      all: 0,
      submitted: 0,
      pending_review: 0,
      for_compliance: 0,
      under_review: 0,
      qualified: 0,
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

  const replaceRequirementFile = async (application, requirement, file) => {
    if (!file) return;

    if (file.size > uploadMaxFileSize) {
      showToast({
        type: "warning",
        message: "Please upload a file smaller than 15 MB.",
      });
      return;
    }

    if (!acceptedRequirementFileTypes.includes(file.type)) {
      showToast({
        type: "warning",
        message: "Upload images, PDFs, or common Office documents only.",
      });
      return;
    }

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("requirementLabel", requirement.label || requirement.field);

      const uploadResult = await apiRequest(
        `/api/applicant/requirement-files/${encodeURIComponent(
          requirement.field
        )}`,
        { method: "POST", body: payload }
      );
      const updateResult = await apiRequest(
        `/api/applicant/applications/${application.id}/requirements/${requirement.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ fileId: uploadResult.file.id }),
        }
      );
      const updatedApplication = updateResult.application;

      setApplications((current) =>
        current.map((item) =>
          item.id === updatedApplication.id ? updatedApplication : item
        )
      );
      setSelectedApplication(updatedApplication);
      showToast({
        type: "success",
        message: "Requirement replacement submitted.",
      });
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to replace requirement.",
      });
    }
  };

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
                        (counts.pending_review || 0) +
                        (counts.under_review || 0)
                      }
                    />
                    <TrackerStat
                      label="Compliance"
                      value={counts.for_compliance || 0}
                    />
                    <TrackerStat
                      label="Completed"
                      value={
                        (counts.qualified || 0) +
                        (counts.rejected || 0) +
                        (counts.hired || 0)
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
          onReplaceRequirement={replaceRequirementFile}
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
  const jobUrl = application.jobOpeningId ? `/jobs/${application.jobOpeningId}` : "";

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
          {jobUrl && (
            <Link
              to={jobUrl}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Job post
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function ApplicationDetailsModal({ application, onClose, onReplaceRequirement }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [replacingRequirementId, setReplacingRequirementId] = useState(null);
  const status = application.status || "submitted";
  const statusTone = statusStyles[status] || statusStyles.submitted;
  const guidance = getStatusGuidance(status);
  const position = getApplicationPosition(application);
  const uan = application.uan || "Not assigned";
  const location = getApplicationLocation(application);
  const deadline = getDeadlineText(application);
  const remarks = String(application.reviewNotes || "").trim();
  const jobUrl = application.jobOpeningId ? `/jobs/${application.jobOpeningId}` : "";
  const requirementCount = getRequirementCount(application);
  const requirements = Array.isArray(application.requirements)
    ? application.requirements
    : [];

  const handleReplaceRequirement = async (requirement, file) => {
    if (!file || !onReplaceRequirement) return;

    setReplacingRequirementId(requirement.id);

    try {
      await onReplaceRequirement(application, requirement, file);
    } finally {
      setReplacingRequirementId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-l-4 ${statusTone.accent}`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
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

          <div className="min-h-0 overflow-y-auto px-5 py-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
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
              <p className="mt-3 text-sm font-bold text-slate-950">
                {guidance.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {guidance.next}
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {guidance.action}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailBlock
                icon={CalendarDays}
                label="Date applied"
                value={formatDate(application.createdAt)}
              />
              <DetailBlock
                icon={CalendarDays}
                label="Deadline"
                value={deadline}
              />
              <DetailBlock
                icon={MapPin}
                label="School / location"
                value={location}
              />
              <DetailBlock
                icon={FileText}
                label="Upload requirements"
                value={
                  requirementCount > 0
                    ? `${requirementCount} requirement(s) for this posting`
                    : "No upload requirements configured"
                }
              />
            </div>

            {remarks && (
              <section className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  HR remarks
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-blue-950 [overflow-wrap:anywhere]">
                  {remarks}
                </p>
              </section>
            )}

            {requirements.length > 0 && (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                      <FileText className="h-3.5 w-3.5" />
                      Requirement Documents
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      These are the document copies submitted for this specific application.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {requirements.map((requirement) => {
                    const requirementStatus = requirement.status || "pending";
                    const requirementFile = requirement.file;
                    const canReplace =
                      status === "for_compliance" &&
                      complianceRequirementStatuses.has(requirementStatus);
                    const isReplacing =
                      String(replacingRequirementId) === String(requirement.id);

                    return (
                      <div
                        key={requirement.id || requirement.field}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                                {requirement.label || requirement.field}
                                {requirement.required ? (
                                  <span className="ml-1 text-red-600">*</span>
                                ) : null}
                              </h3>
                              <span
                                className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getRequirementStatusClass(
                                  requirementStatus
                                )}`}
                              >
                                {getRequirementStatusLabel(requirementStatus)}
                              </span>
                            </div>

                            <p className="mt-1 break-words text-sm text-slate-600 [overflow-wrap:anywhere]">
                              {getRequirementFileName(requirementFile)}
                            </p>

                            {requirement.remarks && (
                              <p className="mt-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm leading-6 text-orange-900">
                                {requirement.remarks}
                              </p>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                            {requirementFile?.previewUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewFile({
                                    ...requirementFile,
                                    name: getRequirementFileName(requirementFile),
                                  })
                                }
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                View
                              </button>
                            )}

                            {canReplace && (
                              <label
                                className={`inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-3 text-xs font-semibold text-white transition hover:bg-[#003a78] ${
                                  isReplacing ? "cursor-wait opacity-80" : ""
                                }`}
                              >
                                {isReplacing && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                )}
                                {isReplacing ? "Uploading" : "Replace"}
                                <input
                                  type="file"
                                  accept={acceptedRequirementFileTypesText}
                                  disabled={isReplacing}
                                  className="sr-only"
                                  onClick={(event) => {
                                    event.currentTarget.value = "";
                                  }}
                                  onChange={(event) => {
                                    const nextFile = event.target.files?.[0];
                                    handleReplaceRequirement(
                                      requirement,
                                      nextFile
                                    );
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
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
                onClick={onClose}
              >
                View job post
              </Link>
            )}
          </div>
        </div>
      </section>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

function DetailBlock({
  icon,
  label,
  value,
  className = "",
  valueClassName = "",
  dotClassName = "",
}) {
  const Icon = icon;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label}
      </p>
      {valueClassName ? (
        <span
          className={`mt-3 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${valueClassName}`}
        >
          {dotClassName && <span className={`h-1.5 w-1.5 rounded-sm ${dotClassName}`} />}
          {value}
        </span>
      ) : (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{value}</p>
      )}
    </div>
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
        Browse Jobs
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
