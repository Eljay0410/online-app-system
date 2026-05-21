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
import { findSjdmSchool, sjdmDistricts } from "../../lib/sjdmLocations";
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
  const [collapsed, setCollapsed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { showToast } = useToast();
  const shortSearchNoticeRef = useRef(false);

  const isApplicant = user && normalizeRole(user.role) === "applicant";
  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";
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
  }, [debouncedFilters, showToast]);

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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="oas-panel p-5 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="min-w-0">
                  <h2 className="oas-panel-title">
                    {job.title}
                  </h2>
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
                    <span>Deadline {formatDeadline(job)}</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(job)}
                    className="oas-action-button flex-1"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(job)}
                    className="oas-action-button flex-1"
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
