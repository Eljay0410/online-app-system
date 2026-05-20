import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  for_interview: "For Interview",
  qualified: "Qualified",
  rejected: "Rejected",
};

const statusStyles = {
  submitted: "border-slate-200 bg-slate-50 text-slate-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-800",
  for_interview: "border-blue-200 bg-blue-50 text-blue-800",
  qualified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-700",
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
  const [message, setMessage] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

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
          setMessage(error.message || "Failed to load applications.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

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
      { label: "Total", value: counts.all || 0 },
      {
        label: "In review",
        value: (counts.submitted || 0) + (counts.under_review || 0),
      },
      { label: "Interview", value: counts.for_interview || 0 },
      { label: "Final", value: (counts.qualified || 0) + (counts.rejected || 0) },
    ],
    [counts]
  );

  const profileReady = Boolean(profile?.profileComplete);
  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";

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
          <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="oas-page-kicker">Applicant Workspace</p>
              <h1 className="oas-page-title mt-2">
                My Applications
              </h1>
              <p className="oas-page-description">
                {user?.firstName
                  ? `${user.firstName}, track every submitted application in one place.`
                  : "Track every submitted application in one place."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/"
                className={`${compactButtonClass} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
              >
                Browse Jobs
              </Link>
              <Link
                to="/profile"
                className={`${compactButtonClass} bg-[#0056b3] text-white hover:bg-[#003a78]`}
              >
                Profile
              </Link>
            </div>
          </header>

          {message && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          )}

          {!isLoading && !profileReady && (
            <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Complete your profile before submitting new applications.
              </span>
              <Link
                to="/profile"
                className="font-semibold text-amber-950 underline underline-offset-4"
              >
                Update profile
              </Link>
            </div>
          )}

          <section className="oas-panel">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="oas-panel-title">
                    Application Register
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Status, dates, and HR notes for your submissions.
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:items-center">
                  {summary.map((item) => (
                    <div key={item.label}>
                      <dt className="text-[11px] font-semibold uppercase text-slate-500">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold text-slate-950">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                  const isActive = statusFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusFilter(option.value)}
                      className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {option.label} ({counts[option.value] || 0})
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Update</TableHead>
                      <TableHead>Remarks</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredApplications.map((application) => (
                      <ApplicationRow
                        key={application.id}
                        application={application}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function ApplicationRow({ application }) {
  const status = application.status || "submitted";
  const statusClass =
    statusStyles[status] || "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <tr className="hover:bg-slate-50">
      <td className="min-w-[240px] px-5 py-4 align-top">
        <p className="font-semibold text-slate-950">
          {application.jobTitle || application.position || "Not specified"}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          UAN: {application.uan || "Not assigned"}
        </p>
      </td>

      <td className="px-5 py-4 align-top">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}
        >
          {getStatusLabel(status)}
        </span>
      </td>

      <TableCell>{formatDate(application.createdAt)}</TableCell>
      <TableCell>{application.jobLocation || "N/A"}</TableCell>
      <TableCell>{formatDate(application.updatedAt)}</TableCell>
      <TableCell>
        <span className="line-clamp-2 text-slate-600">
          {application.reviewNotes || "No notes yet"}
        </span>
      </TableCell>
    </tr>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase text-slate-500">
      {children}
    </th>
  );
}

function TableCell({ children }) {
  return (
    <td className="min-w-[140px] px-5 py-4 align-top text-slate-700">
      {children}
    </td>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="px-5 py-12 text-center">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{message}</p>
      <Link
        to="/"
        className={`${compactButtonClass} mt-5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
      >
        Browse Jobs
      </Link>
    </div>
  );
}
