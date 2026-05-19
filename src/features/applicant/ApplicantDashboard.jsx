import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  Loader2,
  User,
} from "lucide-react";
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
  submitted: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-100 text-amber-800",
  for_interview: "bg-blue-100 text-blue-800",
  qualified: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "N/A";

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [collapsed, setCollapsed] = useState(false);

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
          setMessage(error.message || "Failed to load dashboard.");
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

  const stats = useMemo(
    () => ({
      total: applications.length,
      review: applications.filter((item) =>
        ["submitted", "under_review"].includes(item.status)
      ).length,
      interview: applications.filter((item) => item.status === "for_interview")
        .length,
    }),
    [applications]
  );

  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";

  return (
    <main className={`min-h-screen bg-slate-50 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab="applications"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role="applicant"
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="oas-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="oas-page-kicker">
                Applicant Dashboard
              </p>
              <h1 className="oas-page-title mt-2">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="oas-page-description mt-2">
                Track your applications and finish your profile before applying.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                to="/profile"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Briefcase className="h-4 w-4" />
                Jobs
              </Link>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Applications"
            value={stats.total}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            label="For Review"
            value={stats.review}
            icon={<Clock3 className="h-5 w-5" />}
          />
          <StatCard
            label="For Interview"
            value={stats.interview}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <section className="oas-panel">
          <div className="oas-panel-header flex items-center justify-between">
            <h2 className="oas-panel-title">
              Application status
            </h2>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0056b3]"
            >
              Complete profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No applications yet. Finish your profile and start applying.
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:p-5">
              {applications.map((application) => (
                <article
                  key={application.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">
                        {application.jobTitle || application.position}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {application.jobLocation || "No location"} -{" "}
                        {formatDate(application.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        statusStyles[application.status] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusLabels[application.status] || application.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="oas-panel p-5">
          <h2 className="oas-panel-title">
            Applicant profile
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {profile?.profileComplete
              ? "Your profile is ready for applications."
              : "Your profile still needs application details and uploads."}
          </p>
        </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="oas-panel p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-[#0056b3]">{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="oas-stat-value">{value}</p>
        </div>
      </div>
    </div>
  );
}
