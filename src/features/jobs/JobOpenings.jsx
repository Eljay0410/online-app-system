import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  Filter,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

export default function JobOpenings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [promptJob, setPromptJob] = useState(null);
  const [promptAction, setPromptAction] = useState("apply");
  const [collapsed, setCollapsed] = useState(false);

  const isApplicant = user && normalizeRole(user.role) === "applicant";
  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      setIsLoading(true);
      setMessage("");

      try {
        const params = new URLSearchParams();
        if (debouncedFilters.search) params.set("q", debouncedFilters.search);
        if (debouncedFilters.location) {
          params.set("location", debouncedFilters.location);
        }

        const result = await apiRequest(`/api/job-openings?${params.toString()}`);

        if (isMounted) {
          setJobs(result.jobs || []);
        }
      } catch (error) {
        if (isMounted) {
          setJobs([]);
          setMessage(error.message || "Unable to load available job openings.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [debouncedFilters]);

  const locationHints = useMemo(() => {
    const unique = new Set();

    for (const job of jobs) {
      if (job.location) unique.add(job.location);
    }

    return Array.from(unique).slice(0, 6);
  }, [jobs]);

  const handleApply = (job) => {
    if (!user) {
      setPromptAction("apply");
      setPromptJob(job);
      return;
    }

    if (normalizeRole(user.role) !== "applicant") {
      navigate(getAuthenticatedHomePath(user));
      return;
    }

    navigate(`/jobs/${job.id}`);
  };

  const handleViewDetails = (job) => {
    if (!user) {
      setPromptAction("view");
      setPromptJob(job);
      return;
    }

    if (normalizeRole(user.role) !== "applicant") {
      navigate(getAuthenticatedHomePath(user));
      return;
    }

    navigate(`/jobs/${job.id}`);
  };

  return (
    <main
      className={`min-h-screen bg-slate-50 ${
        isApplicant
          ? `pt-24 ${contentPadding}`
          : "px-4 pb-10 pt-40 sm:px-6 lg:px-8"
      }`}
    >
      {isApplicant && (
        <SuperAdminSidebar
          activeTab="jobs"
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role="applicant"
        />
      )}

      <section
        className={
          isApplicant ? "px-4 pb-10 pt-6 sm:px-6 lg:px-8" : undefined
        }
      >
        <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="oas-panel p-5 sm:p-6">
          <p className="oas-page-kicker">
            Job Listings
          </p>

          <h1 className="oas-page-title mt-2">
            Available vacancies
          </h1>

          <p className="oas-page-description mt-2 max-w-2xl">
            Search by title or school/location, then open a posting or start
            your application flow.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />

              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    search: e.target.value,
                  }))
                }
                placeholder="Search by title or keyword"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3">
              <MapPin className="h-4 w-4 text-slate-400" />

              <input
                value={filters.location}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    location: e.target.value,
                  }))
                }
                placeholder="Filter by school / location"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setFilters({ search: "", location: "" })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Clear
            </button>
          </div>

          {locationHints.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {locationHints.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      location: hint,
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {hint}
                </button>
              ))}
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="oas-panel flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading job openings...
          </div>
        ) : jobs.length === 0 ? (
          <div className="oas-panel p-10 text-center text-slate-500">
            No job openings match your filters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="oas-panel p-5 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="oas-panel-title">
                      {job.title}
                    </h2>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Open
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                    <span>{job.vacancy} vacancy(ies)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />
                    <span>Deadline {formatDate(job.deadline)}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(job)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(job)}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                  >
                    Apply
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        </div>
      </section>

      {promptJob && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {promptAction === "view"
                ? "Login to view the description"
                : "Continue your application"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Login or sign up first to {promptAction === "view" ? "view" : "apply to"}{" "}
              {promptJob.title}.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                onClick={() => setPromptJob(null)}
              >
                Sign Up
              </Link>

              <Link
                to={`/login?next=${encodeURIComponent(
                  `/jobs/${promptJob.id}`
                )}`}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setPromptJob(null)}
              >
                Login
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setPromptJob(null)}
              className="mt-3 h-10 w-full rounded-xl text-sm font-medium text-slate-500"
            >
              Not now
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
