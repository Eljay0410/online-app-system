import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Loader2, MapPin } from "lucide-react";
import { apiRequest } from "../../lib/api";

const getApplicantEmail = () => {
  try {
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      const rawValue = localStorage.getItem(key);
      if (!rawValue) continue;

      const data = JSON.parse(rawValue);

      const email =
        data?.email ||
        data?.emailAddress ||
        data?.user?.email ||
        data?.user?.emailAddress;

      if (email) return email;
    }
  } catch {
    return "";
  }

  return "";
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "N/A";

export default function ApplyJobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = getApplicantEmail();

    const loadData = async () => {
      try {
        const jobsResult = await apiRequest("/api/job-openings");
        setJobs(jobsResult.jobs || []);

        if (!email) {
          setApplications([]);
          setMessage("No logged-in applicant email found. Please login again.");
          return;
        }

        const applicationsResult = await apiRequest(
          `/api/applicant/applications?email=${encodeURIComponent(email)}`
        );

        setApplications(applicationsResult.applications || []);
      } catch (err) {
        setMessage(err.message || "Failed to load job openings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const availableJobs = jobs.filter((job) => {
    const jobTitle = normalize(job.title);

    return !applications.some((application) => {
      const appliedPosition =
        application.position ||
        application.raw?.jobPosition?.positionType ||
        application.raw?.position ||
        application.raw?.positionType;

      return normalize(appliedPosition) === jobTitle;
    });
  });

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-900 sm:text-3xl">
            Apply New
          </h1>

          <p className="mt-1 text-slate-600">
            Choose an available job opening to apply for.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading job openings...
            </div>
          ) : availableJobs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No available job openings to apply for.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-sm font-bold text-slate-500">
                    <th className="px-8 py-4">Job Title</th>
                    <th className="px-8 py-4">Location</th>
                    <th className="px-8 py-4">Vacancy</th>
                    <th className="px-8 py-4">Deadline</th>
                    <th className="px-8 py-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {availableJobs.map((job, index) => (
                    <tr
                      key={job.id}
                      className={`border-b border-slate-100 ${
                        index % 2 === 1 ? "bg-slate-50" : "bg-white"
                      }`}
                    >
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-950">{job.title}</p>
                        {job.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {job.description}
                          </p>
                        )}
                      </td>

                      <td className="px-8 py-6 text-slate-700">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-slate-400" />
                          <span>{job.location || "N/A"}</span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-slate-700">
                        {job.vacancy}
                      </td>

                      <td className="px-8 py-6 text-slate-700">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-slate-400" />
                          <span>{formatDate(job.deadline)}</span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-center">
                        <Link
                          to={`/apply?jobId=${job.id}&position=${encodeURIComponent(
                            job.title
                          )}`}
                          className="inline-flex rounded-lg bg-[#0056b3] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#003a78]"
                        >
                          Apply
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}