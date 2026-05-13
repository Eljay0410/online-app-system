import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import {
  getStoredUser,
  storeUser,
} from "../auth/auth";

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
  const storedUser = getStoredUser();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState("");

  const isLoggedInApplicant = storedUser?.role === "applicant";

  useEffect(() => {
    let isMounted = true;

    async function loadJob() {
      try {
        const result = await apiRequest(`/api/job-openings/${jobId}`);
        if (!isMounted) return;

        setJob(result.job || null);

        if (storedUser?.email) {
          const [profileResult, applicationsResult] = await Promise.all([
            apiRequest(
              `/api/applicant/profile?email=${encodeURIComponent(
                storedUser.email
              )}`
            ).catch(() => null),
            apiRequest(
              `/api/applicant/applications?email=${encodeURIComponent(
                storedUser.email
              )}`
            ).catch(() => null),
          ]);

          if (!isMounted) return;

          setProfile(profileResult?.profile || null);
          setApplications(applicationsResult?.applications || []);

          if (profileResult?.user && profileResult.profileComplete) {
            storeUser({
              ...storedUser,
              ...profileResult.user,
              profileComplete: true,
            });
          }
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

  const hasApplied = useMemo(() => {
    return applications.some(
      (application) => String(application.jobOpeningId) === String(jobId)
    );
  }, [applications, jobId]);

  const handleApply = async () => {
    setMessage("");

    if (!storedUser) {
      navigate(`/login?next=/jobs/${jobId}`);
      return;
    }

    if (!storedUser.profileComplete || !profile?.profileComplete) {
      navigate(`/apply`, {
        state: { job },
      });
      return;
    }

    if (hasApplied) {
      setMessage("You already applied to this job.");
      return;
    }

    setIsApplying(true);

    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          email: storedUser.email,
          jobOpeningId: job.id,
        }),
      });

      setMessage("Application submitted successfully.");
      setApplications((current) => [
        {
          id: Date.now(),
          jobOpeningId: job.id,
        },
        ...current,
      ]);
    } catch (error) {
      setMessage(error.message || "Failed to submit application.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0056b3] hover:text-[#003a78]"
        >
          <ArrowLeft size={18} />
          Back to job listings
        </Link>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        {isLoading || !job ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading job details...
          </div>
        ) : (
          <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0056b3]">
                  <ShieldCheck size={14} />
                  Open Position
                </span>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {job.title}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {job.description || "No description provided yet."}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isApplying || hasApplied}
                  className="inline-flex items-center justify-center rounded-lg bg-[#0056b3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {hasApplied
                    ? "Already applied"
                    : isApplying
                    ? "Submitting..."
                    : isLoggedInApplicant && profile?.profileComplete
                    ? "Apply now"
                    : "Start application"}
                </button>

                {storedUser ? (
                  <p className="text-xs text-slate-500">
                    {storedUser.profileComplete
                      ? "Your saved profile will be used automatically."
                      : "Complete your profile once before applying."}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Log in to apply with a saved profile, or start the first-time
                    application form.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Location
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <MapPin size={16} className="text-slate-400" />
                  {job.location}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Vacancies
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {job.vacancy}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  Deadline
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                  <CalendarDays size={16} className="text-slate-400" />
                  {formatDate(job.deadline)}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
