import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Loader2,
  MapPin,
  UserRoundPlus,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import BackButton from "../../components/ui/BackButton";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "../auth/auth";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      try {
        const result = await apiRequest(`/api/job-openings/${jobId}`);
        if (isMounted) {
          setJob(result.job || null);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error.message || "Unable to load this job opening.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleApply = () => {
    if (!user) {
      setShowPrompt(true);
      return;
    }

    if (normalizeRole(user.role) !== "applicant") {
      navigate(getAuthenticatedHomePath(user));
      return;
    }

    navigate(`/profile?jobId=${jobId}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-10 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <BackButton to="/" label="Back to job listings" />

        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        {isLoading || !job ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading job details...
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0056b3]">
                  Vacancy Details
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                  {job.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {job.description || "No description provided yet."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleApply}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
              >
                <UserRoundPlus className="h-4 w-4" />
                Apply
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoCard label="School / Location" value={job.location} icon={<MapPin className="h-4 w-4" />} />
              <InfoCard label="Vacancies" value={job.vacancy} icon={<UserRoundPlus className="h-4 w-4" />} />
              <InfoCard label="Expiration" value={formatDate(job.deadline)} icon={<CalendarDays className="h-4 w-4" />} />
            </div>
          </section>
        )}
      </div>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Login or register first
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create an account or log in before applying to this vacancy.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                onClick={() => setShowPrompt(false)}
              >
                Register
              </Link>
              <Link
                to={`/login?next=${encodeURIComponent(`/profile?jobId=${jobId}`)}`}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setShowPrompt(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
        <span className="text-slate-400">{icon}</span>
        {value}
      </p>
    </div>
  );
}
