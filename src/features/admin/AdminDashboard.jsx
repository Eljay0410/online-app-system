import { useEffect, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { apiRequest } from "../../lib/api";

const emptyJob = {
  title: "",
  location: "",
  vacancy: 1,
  deadline: "",
  status: "open",
  description: "",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  for_interview: "For Interview",
  qualified: "Qualified",
  rejected: "Rejected",
};

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [jobToDelete, setJobToDelete] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/admin/job-openings"),
      apiRequest("/api/admin/applications"),
    ])
      .then(([jobResult, applicationResult]) => {
        if (!isMounted) return;

        setJobs(jobResult.jobs || []);
        setApplications(applicationResult.applications || []);
        setReviewNotes(
          Object.fromEntries(
            (applicationResult.applications || []).map((application) => [
              application.id,
              application.reviewNotes || "",
            ])
          )
        );
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

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const createJob = async (event) => {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");

    try {
      const result = await apiRequest("/api/admin/job-openings", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          vacancy: Number(form.vacancy),
        }),
      });

      setJobs((prev) => [result.job, ...prev]);

      setForm(emptyJob);
      setMessage("Job opening posted.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateJob = async (job, updates) => {
    const result = await apiRequest(`/api/admin/job-openings/${job.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    setJobs((prev) =>
      prev.map((item) => (item.id === job.id ? result.job : item))
    );
  };

  const decreaseVacancy = async (job) => {
    if (Number(job.vacancy) <= 0) return;

    try {
      await updateJob(job, {
        vacancy: Number(job.vacancy) - 1,
      });

      setMessage("Vacancy updated.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const deleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await apiRequest(`/api/admin/job-openings/${jobToDelete.id}`, {
        method: "DELETE",
      });

      setJobs((prev) =>
        prev.filter((item) => item.id !== jobToDelete.id)
      );

      setMessage("Job posting deleted.");
      setJobToDelete(null);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateApplicationStatus = async (application, status) => {
    const result = await apiRequest(
      `/api/admin/applications/${application.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNotes:
            reviewNotes[application.id] ?? application.reviewNotes ?? "",
        }),
      }
    );

    setApplications((prev) =>
      prev.map((item) =>
        item.id === application.id ? result.application : item
      )
    );
  };

  const openJobs = jobs.filter((job) => job.status === "open").length;

  const pendingApplications = applications.filter((application) =>
    ["submitted", "under_review"].includes(application.status)
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-12 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-blue-950">
            Admin Dashboard
          </h1>

          <p className="text-sm text-slate-600">
            Post job openings, set expiration dates, and manage applicant status.
          </p>
        </div>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
            {message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Briefcase className="h-6 w-6 text-blue-700" />

            <p className="mt-3 text-sm text-slate-500">
              Open Jobs
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {openJobs}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <ClipboardList className="h-6 w-6 text-blue-700" />

            <p className="mt-3 text-sm text-slate-500">
              Applications
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {applications.length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-green-700" />

            <p className="mt-3 text-sm text-slate-500">
              Needs Review
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {pendingApplications}
            </p>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={createJob}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-700" />

              <h2 className="text-lg font-bold text-slate-900">
                Post Job Opening
              </h2>
            </div>

            <div className="grid gap-4">
              <input
                value={form.title}
                onChange={(event) =>
                  handleFormChange("title", event.target.value)
                }
                placeholder="Job title"
                className="h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                value={form.location}
                onChange={(event) =>
                  handleFormChange("location", event.target.value)
                }
                placeholder="School / location"
                className="h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="number"
                  min="1"
                  value={form.vacancy}
                  onChange={(event) =>
                    handleFormChange("vacancy", event.target.value)
                  }
                  className="h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    handleFormChange("deadline", event.target.value)
                  }
                  className="h-11 rounded-lg border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <textarea
                value={form.description}
                onChange={(event) =>
                  handleFormChange("description", event.target.value)
                }
                placeholder="Job details and requirements"
                className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Post Job
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">
                Job Postings
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {job.title}
                      </p>

                      <p className="text-sm text-slate-500">
                        {job.location} - {job.vacancy} vacancy
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {job.status === "open" &&
                        job.deadline &&
                        new Date(job.deadline) < new Date()
                          ? "Expired"
                          : job.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseVacancy(job)}
                        disabled={Number(job.vacancy) <= 0}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Minus className="h-4 w-4" />
                        Reduce Vacancy
                      </button>

                      <select
                        value={job.status}
                        onChange={(event) =>
                          updateJob(job, {
                            status: event.target.value,
                          }).catch((err) =>
                            setMessage(err.message)
                          )
                        }
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setJobToDelete(job)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {!isLoading && jobs.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    No job postings yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">
              Application Status
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-3">UAN</th>
                  <th className="px-5 py-3">Applicant</th>
                  <th className="px-5 py-3">Position</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {application.uan}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {application.applicantName}
                      </p>

                      <p className="text-xs text-slate-500">
                        {application.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      {application.position}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={application.status}
                        onChange={(event) =>
                          updateApplicationStatus(
                            application,
                            event.target.value
                          ).catch((err) =>
                            setMessage(err.message)
                          )
                        }
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      >
                        {Object.entries(statusLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                      <textarea
                        value={
                          reviewNotes[application.id] ??
                          application.reviewNotes ??
                          ""
                        }
                        onChange={(event) =>
                          setReviewNotes((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder="Review notes"
                        className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isLoading && applications.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No applications yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Delete Job Posting
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                "{jobToDelete.title}"
              </span>
              ?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deleteJob}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
