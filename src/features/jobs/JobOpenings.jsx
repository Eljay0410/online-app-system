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
import FilterIcon from "../../components/ui/FilterIcon";
import PaginationControls from "../../components/ui/PaginationControls";
import { findSjdmSchool, sjdmDistricts } from "../../lib/sjdmLocations";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import { useToast } from "../../components/ui/toastContext";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

const formatDeadline = (job) =>
  `${formatDate(job.deadline)} ${job.deadlineTime || ""}`.trim();

const jobPageSizeOptions = [6, 9, 12];

export default function JobOpenings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    district: "",
    barangay: "",
    school: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [isLoading, setIsLoading] = useState(true);
  const [promptJob, setPromptJob] = useState(null);
  const [promptAction, setPromptAction] = useState("apply");
  const [viewJob, setViewJob] = useState(null);
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
  const selectedDistrict = sjdmDistricts.find(
    (district) => district.name === filters.district
  );
  const barangayOptions = selectedDistrict?.barangays || [];
  const schoolOptions = selectedDistrict?.schools || [];
  const hasLocationFilter = Boolean(
    filters.district || filters.barangay || filters.school
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedFilters({
        search: filters.search.trim(),
        district: filters.district,
        barangay: filters.barangay,
        school: filters.school.trim(),
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
            message: "Type at least 2 characters to search job openings.",
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
        if (debouncedFilters.school) {
          params.set("location", debouncedFilters.school);
        } else if (debouncedFilters.barangay) {
          params.set("barangay", debouncedFilters.barangay);
        } else if (debouncedFilters.district) {
          params.set("location", debouncedFilters.district);
        }

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
            message: error.message || "Unable to load available job openings.",
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

    setViewJob(job);
  };

  const handleSchoolFilterChange = (value) => {
    const school = findSjdmSchool(filters.district, value);

    setFilters((current) => ({
      ...current,
      school: value,
      barangay: value ? school?.barangay || current.barangay : "",
    }));
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
            <h1 className="oas-page-title">Available vacancies</h1>
            <p className="oas-page-description mt-2 max-w-2xl">
              Search by title or school/location, then open a posting or start
              your application flow.
            </p>
          </header>

          <div className="flex items-start gap-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    search: e.target.value,
                  }))
                }
                placeholder="Search by title or keyword"
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

            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Filter jobs"
                aria-expanded={isFilterOpen}
                title="Filter"
                onClick={() => setIsFilterOpen((open) => !open)}
                className={`grid h-11 w-11 place-items-center rounded-xl border bg-white transition ${
                  hasLocationFilter
                    ? "border-blue-500 text-blue-700 shadow-sm"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <FilterIcon className="h-4 w-4" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    School / location
                  </p>

                  <div className="mt-3 space-y-3">
                    <label
                      htmlFor="job-district-filter"
                      className="block text-xs font-medium text-slate-600"
                    >
                      District
                    </label>

                    <select
                      id="job-district-filter"
                      value={filters.district}
                      onChange={(e) =>
                        setFilters((current) => ({
                          ...current,
                          district: e.target.value,
                          barangay: "",
                          school: "",
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All districts</option>
                      {sjdmDistricts.map((district) => (
                        <option key={district.name} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </select>

                    <label
                      htmlFor="job-school-filter"
                      className="block text-xs font-medium text-slate-600"
                    >
                      School / Office
                    </label>

                    <select
                      id="job-school-filter"
                      value={filters.school}
                      disabled={!filters.district}
                      onChange={(e) => handleSchoolFilterChange(e.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">All schools / offices</option>
                      {schoolOptions.map((school) => (
                        <option key={school.name} value={school.name}>
                          {school.name}
                        </option>
                      ))}
                    </select>

                    <label
                      htmlFor="job-barangay-filter"
                      className="block text-xs font-medium text-slate-600"
                    >
                      Barangay
                    </label>

                    <select
                      id="job-barangay-filter"
                      value={filters.barangay}
                      disabled={!filters.district}
                      onChange={(e) =>
                        setFilters((current) => ({
                          ...current,
                          barangay: e.target.value,
                          school: "",
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">All barangays</option>
                      {barangayOptions.map((barangay) => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>

                  </div>
                </div>
              )}
            </div>
          </div>

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
                      {job.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{job.vacancy} vacancy(ies)</span>
                  </div>

                  <div className="flex min-w-0 items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span className="line-clamp-2 break-words [overflow-wrap:anywhere]">
                      Deadline {formatDeadline(job)}
                    </span>
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
            itemLabel="job openings"
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
              {promptAction === "view"
                ? "Login to view the description"
                : "Continue your application"}
            </h3>

            <p className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
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
              {job.location || "Location not set"}
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

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <JobModalInfo label="Vacancies" value={job.vacancy} />
            <JobModalInfo label="Deadline" value={formatDeadline(job)} />
            <JobModalInfo
              label="Status"
              value={job.applied ? "Applied" : "Open"}
            />
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:mt-5 sm:rounded-xl sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">Description</h4>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere] sm:mt-3 sm:text-sm sm:leading-6">
              {job.description || "No description provided yet."}
            </p>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:mt-5 sm:rounded-xl sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Upload Requirements
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
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] uppercase ${
                          requirement.required === false
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {requirement.required === false ? "Optional" : "Required"}
                      </span>
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
                No upload requirements configured.
              </p>
            )}
          </section>
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

function JobModalInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}
