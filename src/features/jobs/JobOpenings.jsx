import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Loader2,
  MapPin,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const formatDate = (value) => {
  if (!value) return "No deadline";

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export default function JobOpenings() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const result = await apiRequest("/api/job-openings");
        if (isMounted) setJobs(result.jobs || []);
      } catch (error) {
        if (isMounted) {
          setJobs([]);
          setMessage(
            error.message || "Unable to load available job openings."
          );
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
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            Public Job Portal
          </p>
          <h1 className="text-3xl font-bold text-slate-900">
            Job Openings
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Browse available positions, read the details, and start an
            application when you are ready.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading job openings...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No job openings are posted right now.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 transition group-hover:text-[#0056b3]">
                      {job.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      View details and application requirements.
                    </p>
                  </div>

                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0056b3]">
                    Open
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness size={16} className="text-slate-400" />
                    <span>{job.vacancy} vacancy(ies)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-slate-400" />
                    <span>Deadline {formatDate(job.deadline)}</span>
                  </div>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0056b3] transition group-hover:translate-x-0.5">
                  View details
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
