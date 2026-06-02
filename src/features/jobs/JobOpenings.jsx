import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import PaginationControls from "../../components/ui/PaginationControls";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import { useToast } from "../../components/ui/toastContext";
import {
  DeadlineDetails,
  QualificationStandards,
  RequirementSummary,
  summarizeVacancyItems,
  VacancyBreakdown,
  VacancySummaryTable,
} from "./jobPostingUi";

const jobPageSizeOptions = [6, 9, 12];

export default function JobOpenings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isLoading, setIsLoading] = useState(true);
  const [promptJob, setPromptJob] = useState(null);
  const [viewJob, setViewJob] = useState(null);
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [pagination, setPagination] = useState({
    limit: 9,
    offset: 0,
    total: 0,
  });
  const { showToast } = useToast();
  const shortSearchNoticeRef = useRef(false);

  const isApplicant = user && normalizeRole(user.role) === "applicant";
  const contentPadding = getSidebarContentPadding(collapsed);

  const getApplyPath = (job) => {
    const params = new URLSearchParams();

    if (job?.id) params.set("jobId", String(job.id));
    if (job?.title) params.set("position", job.title);
    if (job?.positionCategory) params.set("category", job.positionCategory);

    const query = params.toString();
    return `/applicant-information${query ? `?${query}` : ""}`;
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilters({
        search: filters.search.trim(),
      });
      setPage(1);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadJobs() {
      const searchTerm = debouncedFilters.search.trim();

      if (searchTerm && searchTerm.length < 2) {
        setIsLoading(false);
        setJobs([]);
        setPagination({ limit: pageSize, offset: 0, total: 0 });
        if (!shortSearchNoticeRef.current) {
          showToast({
            type: "info",
            message: "Type at least 2 characters to search vacancies.",
          });
          shortSearchNoticeRef.current = true;
        }
        return;
      }

      shortSearchNoticeRef.current = false;
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("q", searchTerm);
        params.set("limit", String(pageSize));
        params.set("offset", String((page - 1) * pageSize));

        const queryString = params.toString();
        const result = await apiRequest(
          `/api/job-openings${queryString ? `?${queryString}` : ""}`,
          { signal: controller.signal }
        );

        if (isMounted) {
          setJobs(result.jobs || []);
          setPagination(
            result.pagination || {
              limit: pageSize,
              offset: (page - 1) * pageSize,
              total: result.jobs?.length || 0,
            }
          );
        }
      } catch (error) {
        if (error?.name === "AbortError") return;

        if (isMounted) {
          setJobs([]);
          showToast({
            type: "error",
            message: error.message || "Unable to load available vacancies.",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedFilters, page, pageSize, showToast]);

  const handleApply = (job) => {
    if (job.applied) return;

    if (!user) {
      setPromptJob(job);
      return;
    }

    if (normalizeRole(user.role) !== "applicant") {
      navigate(getAuthenticatedHomePath(user));
      return;
    }

    navigate(getApplyPath(job), { state: { job } });
  };

  const handleViewDetails = (job) => {
    setViewJob(job);
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
          <header>
            <h1 className="oas-page-title">Vacancies</h1>
            <p className="oas-page-description mt-2 max-w-2xl">
              Search by title or school/location, then open a posting or start
              your application flow.
            </p>
          </header>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  search: e.target.value,
                }))
              }
              placeholder="Search by position, school/station, or subject"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
            />

            {filters.search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    search: "",
                  }))
                }
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

        {isLoading ? (
          <div className="oas-panel flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vacancies...
          </div>
        ) : jobs.length === 0 ? (
          <div className="oas-panel p-10 text-center text-slate-500">
            No vacancies match your filters.
          </div>
        ) : (
          <>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="oas-panel flex h-full min-w-0 flex-col p-4 transition hover:border-blue-200 hover:shadow-md sm:p-5"
              >
                <div className="min-w-0">
                  <h2 className="line-clamp-2 min-h-0 break-words text-sm font-bold leading-5 text-slate-950 [overflow-wrap:anywhere] sm:min-h-[2.5rem]">
                    {job.title}
                  </h2>
                </div>

                <div className="mt-3 space-y-2.5 text-xs text-slate-700 sm:mt-4 sm:space-y-3 sm:text-sm">
                  <div className="flex min-w-0 items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="line-clamp-2 min-h-0 break-words leading-5 [overflow-wrap:anywhere] sm:min-h-10">
                      {summarizeVacancyItems(job.vacancyItems || [])}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{job.vacancy} vacancy(ies)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>Salary Grade {job.salaryGrade || "N/A"}</span>
                  </div>

                  <div className="flex min-w-0 items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <DeadlineDetails job={job} compact />
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 sm:pt-5">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(job)}
                    className="oas-action-button oas-card-action-button border border-[#0056b3] bg-white text-[#0056b3] transition hover:bg-blue-50"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(job)}
                    disabled={job.applied}
                    className={`oas-action-button oas-card-action-button ${
                      job.applied
                        ? "cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200"
                        : ""
                    }`}
                  >
                    {job.applied ? "Applied" : "Apply"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={pagination.total || jobs.length}
            currentCount={jobs.length}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
            pageSizeOptions={jobPageSizeOptions}
            itemLabel="vacancies"
            className="rounded-xl border border-slate-200 shadow-sm"
          />
          </>
        )}
        </div>
      </section>

      {viewJob && (
        <JobDetailsModal
          job={viewJob}
          onClose={() => setViewJob(null)}
          onApply={() => handleApply(viewJob)}
        />
      )}

      {promptJob && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
              Continue your application
            </h3>

            <p className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              Log in or sign up before applying to {promptJob.title}.
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to={`/login?next=${encodeURIComponent(
                  getApplyPath(promptJob)
                )}`}
                className="oas-mobile-full inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                onClick={() => setPromptJob(null)}
              >
                Log In
              </Link>

              <Link
                to="/register"
                state={{ next: getApplyPath(promptJob) }}
                className="oas-mobile-full inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setPromptJob(null)}
              >
                Sign Up
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

function JobDetailsModal({ job, onClose, onApply }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-3 sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold leading-6 text-slate-950 [overflow-wrap:anywhere] sm:text-lg">
              {job.title}
            </h3>
            <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] sm:text-sm">
              {job.salaryGrade ? `Salary Grade ${job.salaryGrade}` : "Salary grade not set"}
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

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
          <VacancySummaryTable job={job} />

          <VacancyBreakdown job={job} />
          <QualificationStandards job={job} />
          <RequirementSummary job={job} />
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={job.applied}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            {job.applied ? "Applied" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
