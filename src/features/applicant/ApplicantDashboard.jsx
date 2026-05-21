import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  MessageSquareText,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import { useToast } from "../../components/ui/toastContext";

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  for_interview: "For Interview",
  qualified: "Qualified",
  rejected: "Rejected",
};

const statusStyles = {
  submitted: {
    badge: "border-slate-300 bg-white text-slate-700",
    accent: "border-l-slate-400",
    dot: "bg-slate-500",
  },
  under_review: {
    badge: "border-amber-300 bg-amber-50 text-amber-800",
    accent: "border-l-amber-400",
    dot: "bg-amber-500",
  },
  for_interview: {
    badge: "border-blue-300 bg-blue-50 text-blue-800",
    accent: "border-l-blue-500",
    dot: "bg-blue-600",
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
};

const filterOptions = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "for_interview", label: "Interview" },
  { value: "qualified", label: "Qualified" },
  { value: "rejected", label: "Rejected" },
];

const compactButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold transition";

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

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [profileResult, applicationsResult] = await Promise.all([
          apiRequest("/api/applicant/profile").catch(() => null),
          apiRequest("/api/applicant/applications").catch(() => null),
        ]);

        if (!isMounted) return;

        setProfile(profileResult?.profile || null);
        setApplications(applicationsResult?.applications || []);
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
  }, [showToast]);

  const counts = useMemo(() => {
    return applications.reduce(
      (total, application) => {
        const status = application.status || "submitted";
        total.all += 1;
        total[status] = (total[status] || 0) + 1;
        return total;
      },
      { all: 0 }
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") return applications;

    return applications.filter(
      (application) => application.status === statusFilter
    );
  }, [applications, statusFilter]);

  const summary = useMemo(
    () => [
      { label: "Total", value: counts.all || 0, icon: FileText },
      {
        label: "In review",
        value: (counts.submitted || 0) + (counts.under_review || 0),
        icon: Clock3,
      },
      { label: "Interview", value: counts.for_interview || 0, icon: CalendarDays },
      {
        label: "Final",
        value: (counts.qualified || 0) + (counts.rejected || 0),
        icon: BriefcaseBusiness,
      },
    ],
    [counts]
  );

  const profileReady = Boolean(profile?.profileComplete || user?.profileComplete);
  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";

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
              <div className="grid gap-5 px-5 py-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)] xl:items-start">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Application Register
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Status history, dates, and HR notes for every submission.
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {summary.map((item) => (
                    <SummaryItem key={item.label} item={item} />
                  ))}
                </dl>
              </div>

              <div className="flex gap-1 overflow-x-auto border-t border-slate-200 px-5 py-3">
                {filterOptions.map((option) => {
                  const isActive = statusFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
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
            ) : applications.length === 0 ? (
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

function SummaryItem({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase text-slate-500">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        {item.label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold leading-none text-slate-950">
        {item.value}
      </dd>
    </div>
  );
}

function ApplicationRow({ application, onSelect }) {
  const status = application.status || "submitted";
  const statusTone = statusStyles[status] || statusStyles.submitted;
  const position = application.jobTitle || application.position || "Not specified";
  const uan = application.uan || "Not assigned";
  const location = application.jobLocation || "N/A";
  const notes = application.reviewNotes || "No notes yet";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`cursor-pointer border-l-4 ${statusTone.accent} px-5 py-5 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_160px_minmax(0,1fr)] xl:items-start">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
            <BriefcaseBusiness className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-950">
              {position}
            </h3>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              UAN {uan}
            </p>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusTone.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-sm ${statusTone.dot}`} />
            {getStatusLabel(status)}
          </span>
          <p className="mt-2 text-xs font-bold text-blue-700">
            View
          </p>
        </div>

        <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3 xl:grid-cols-2">
          <MetaItem
            icon={CalendarDays}
            label="Applied"
            value={formatDate(application.createdAt)}
          />
          <MetaItem
            icon={Clock3}
            label="Last update"
            value={formatDate(application.updatedAt)}
          />
          <MetaItem icon={MapPin} label="Location" value={location} />
          <MetaItem
            icon={MessageSquareText}
            label="Remarks"
            value={notes}
            className="sm:col-span-3 xl:col-span-2"
          />
        </div>
      </div>
    </article>
  );
}

function ApplicationDetailsModal({ application, onClose }) {
  const status = application.status || "submitted";
  const statusTone = statusStyles[status] || statusStyles.submitted;
  const position = application.jobTitle || application.position || "Not specified";
  const uan = application.uan || "Not assigned";
  const location = application.jobLocation || "N/A";
  const deadline = `${formatDate(application.jobDeadline)} ${
    application.jobDeadlineTime || ""
  }`.trim();
  const remarks = application.reviewNotes || "No notes yet";
  const jobUrl = application.jobOpeningId ? `/jobs/${application.jobOpeningId}` : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      onClick={onClose}
    >
      <section
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-l-4 ${statusTone.accent}`}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Application Details
              </p>
              <h2 className="mt-2 truncate text-xl font-semibold text-slate-950">
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

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <DetailBlock
              icon={BriefcaseBusiness}
              label="Status"
              value={getStatusLabel(status)}
              valueClassName={statusTone.badge}
              dotClassName={statusTone.dot}
            />
            <DetailBlock
              icon={CalendarDays}
              label="Date applied"
              value={formatDate(application.createdAt)}
            />
            <DetailBlock
              icon={Clock3}
              label="Last update"
              value={formatDate(application.updatedAt)}
            />
            <DetailBlock icon={CalendarDays} label="Deadline" value={deadline} />
            <DetailBlock icon={MapPin} label="School / location" value={location} />
            <DetailBlock
              icon={MessageSquareText}
              label="HR remarks"
              value={remarks}
              className="sm:col-span-2"
            />
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
                View
              </Link>
            )}
          </div>
        </div>
      </section>
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
  const iconElement = icon
    ? icon({ className: "h-3.5 w-3.5 text-slate-400" })
    : null;

  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 ${className}`}>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {iconElement}
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

function MetaItem({ icon, label, value, className = "" }) {
  const iconElement = icon
    ? icon({ className: "h-3.5 w-3.5 text-slate-400" })
    : null;

  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
        {iconElement}
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-800">{value}</p>
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
