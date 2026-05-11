import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, CalendarDays, Loader2, MapPin } from "lucide-react";
import { apiRequest } from "../../lib/api";

const formatDate = (value) => {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const JobOpenings = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const result = await apiRequest("/api/job-openings");
        if (isMounted) setJobs(result.jobs || []);
      } catch (err) {
        console.error("Unable to load job openings:", err);
        if (isMounted) {
          setJobs([]);
          setIsUnavailable(true);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-28 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">Job Openings</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Available positions are posted by the admin office. Select a job and
            continue to the application form.
          </p>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] border-b border-slate-200 px-6 py-3 text-sm font-semibold text-slate-500 md:grid">
            <span>Job Title</span>
            <span>Location</span>
            <span>Vacancy</span>
            <span>Deadline</span>
            <span>Action</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading job openings...
            </div>
          )}

          {!isLoading && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  No job postings available right now.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {isUnavailable
                    ? "Please check back later while the postings are being updated."
                    : "Please check back soon for new openings."}
                </p>
              </div>
            </div>
          )}

          {!isLoading && jobs.length > 0 && (
            <div className="divide-y divide-slate-100">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-1 gap-3 px-6 py-5 transition hover:bg-slate-50 md:grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] md:items-center md:gap-0"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    {job.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {job.description}
                      </p>
                    )}
                  </div>

                  <p className="flex items-center gap-2 text-slate-700">
                    <MapPin size={16} className="text-slate-400" />
                    {job.location}
                  </p>

                  <p className="text-slate-700">{job.vacancy}</p>

                  <p className="flex items-center gap-2 text-slate-700">
                    <CalendarDays size={16} className="text-slate-400" />
                    {formatDate(job.deadline)}
                  </p>

                  <Link
                    to="/apply"
                    state={{ job }}
                    className="w-fit rounded-lg bg-[#0056b3] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#003a78]"
                  >
                    Apply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default JobOpenings;
