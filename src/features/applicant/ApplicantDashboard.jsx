import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, Eye, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  for_interview: "For Interview",
  qualified: "Qualified",
  rejected: "Denied",
};

const statusStyles = {
  submitted: "bg-slate-100 text-slate-700 border-slate-200",
  under_review: "bg-amber-100 text-amber-800 border-amber-200",
  for_interview: "bg-blue-100 text-blue-700 border-blue-200",
  qualified: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const getApplicantEmail = () => {
  try {
    const savedProfile = JSON.parse(localStorage.getItem("applicantProfile"));
    return savedProfile?.email || savedProfile?.emailAddress || "";
  } catch {
    return "";
  }
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "N/A";

export default function ApplicantDash() {
  const [email, setEmail] = useState(getApplicantEmail);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(getApplicantEmail()));
  const [message, setMessage] = useState(() =>
    getApplicantEmail() ? "" : "Enter your applicant email to view your submissions."
  );

  const loadApplications = async (targetEmail = email) => {
    if (!targetEmail) {
      setApplications([]);
      setMessage("Enter your applicant email to view your submissions.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/applicant/applications?email=${encodeURIComponent(targetEmail)}`
      );
      setApplications(result.applications || []);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const savedEmail = getApplicantEmail();

    if (!savedEmail) {
      return () => {
        isMounted = false;
      };
    }

    apiRequest(
      `/api/applicant/applications?email=${encodeURIComponent(savedEmail)}`
    )
      .then((result) => {
        if (isMounted) setApplications(result.applications || []);
      })
      .catch((err) => {
        if (isMounted) setMessage(err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const forInterview = applications.filter(
    (application) => application.status === "for_interview"
  ).length;
  const denied = applications.filter(
    (application) => application.status === "rejected"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 sm:text-3xl">
              Applicant Dashboard
            </h1>
            <p className="mt-1 text-slate-600">
              View your application status and previous submissions.
            </p>
          </div>

          <Link
            to="/apply"
            className="rounded-lg bg-[#0056b3] px-5 py-2.5 text-center text-sm font-bold text-white transition hover:bg-[#003a78]"
          >
            Apply New
          </Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Applicant email"
              className="h-11 flex-1 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => loadApplications()}
              className="rounded-lg border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-blue-800 hover:bg-blue-100"
            >
              Refresh Status
            </button>
          </div>
          {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Applications</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {applications.length}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
                <Briefcase size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">For Interview</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {forInterview}
                </h2>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-3 text-red-700">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Denied</p>
                <h2 className="text-2xl font-bold text-slate-800">{denied}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-blue-900">
              My Applications
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No applications found for this email.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-3">UAN</th>
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3">Date Applied</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {application.uan}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {application.position}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(application.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyles[application.status] ||
                            statusStyles.submitted
                          }`}
                        >
                          {statusLabels[application.status] ||
                            application.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#0056b3] px-3 py-2 text-white transition hover:bg-[#003a78]"
                        >
                          <Eye size={16} />
                          View
                        </button>
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
