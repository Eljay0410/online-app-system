import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Eye,
  Filter,
  LayoutList,
  Loader2,
  Minus,
  Plus,
  Save,
  Search,
  Trash2,
  UserRoundSearch,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

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
  denied: "Denied",
};

const sidebarItems = [
  {
    id: "post-job",
    label: "Post Job Opening",
    icon: Plus,
  },
  {
    id: "job-posting",
    label: "Job Posting",
    icon: Briefcase,
  },
  {
    id: "applicant-list",
    label: "Applicant List",
    icon: UserRoundSearch,
  },
  {
    id: "job-listing",
    label: "Job Listing",
    icon: LayoutList,
  },
];

function getStatusBadgeClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "submitted") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "under_review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "for_interview") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (normalizedStatus === "qualified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "denied") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusOptionClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "submitted") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "under_review") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "for_interview") {
    return "bg-violet-50 text-violet-700";
  }

  if (normalizedStatus === "qualified") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "denied") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-50 text-slate-700";
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("post-job");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [jobToDelete, setJobToDelete] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});

  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewApplication, setViewApplication] = useState(null);

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
      setActiveSection("job-posting");
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

      setJobs((prev) => prev.filter((item) => item.id !== jobToDelete.id));

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

  const formatDate = (dateValue) => {
    if (!dateValue) return "No date";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const getApplicationDate = (application) => {
    return (
      application.dateApplied ||
      application.appliedAt ||
      application.createdAt ||
      application.submittedAt ||
      application.applicationDate ||
      ""
    );
  };

  const getApplicationPosition = (application) => {
    return (
      application.position ||
      application.jobTitle ||
      application.job?.title ||
      application.jobOpening?.title ||
      application.jobPosition?.positionType ||
      "No position"
    );
  };

  const getApplicationLocation = (application) => {
    return (
      application.location ||
      application.jobLocation ||
      application.job?.location ||
      application.jobOpening?.location ||
      "No location"
    );
  };

  const getApplicantName = (application) => {
    const personalInfo =
      application.personalInfo ||
      application.profile?.personalInfo ||
      application.applicationData?.personalInfo ||
      {};

    return (
      application.applicantName ||
      application.name ||
      application.user?.name ||
      [personalInfo.firstName, personalInfo.middleName, personalInfo.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Unnamed Applicant"
    );
  };

  const getApplicantEmail = (application) => {
    const personalInfo =
      application.personalInfo ||
      application.profile?.personalInfo ||
      application.applicationData?.personalInfo ||
      {};

    return (
      application.email ||
      application.user?.email ||
      personalInfo.emailAddress ||
      personalInfo.email ||
      "No email"
    );
  };

  const positions = useMemo(() => {
    const uniquePositions = new Set(
      applications.map((application) => getApplicationPosition(application))
    );

    return Array.from(uniquePositions).filter(Boolean).sort();
  }, [applications]);

  const locations = useMemo(() => {
    const uniqueLocations = new Set(
      applications.map((application) => getApplicationLocation(application))
    );

    return Array.from(uniqueLocations).filter(Boolean).sort();
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const position = getApplicationPosition(application);
      const location = getApplicationLocation(application);
      const applicantName = getApplicantName(application);
      const email = getApplicantEmail(application);
      const uan = application.uan || "";

      const matchesPosition =
        selectedPosition === "all" || position === selectedPosition;

      const matchesLocation =
        selectedLocation === "all" || location === selectedLocation;

      const matchesSearch =
        !normalizedSearch ||
        applicantName.toLowerCase().includes(normalizedSearch) ||
        email.toLowerCase().includes(normalizedSearch) ||
        uan.toLowerCase().includes(normalizedSearch) ||
        position.toLowerCase().includes(normalizedSearch);

      return matchesPosition && matchesLocation && matchesSearch;
    });
  }, [applications, selectedPosition, selectedLocation, searchTerm]);

  const openJobs = jobs.filter((job) => job.status === "open").length;

  const pendingApplications = applications.filter((application) =>
    ["submitted", "under_review"].includes(application.status)
  ).length;

  const activeSidebarLabel =
    sidebarItems.find((item) => item.id === activeSection)?.label ||
    "Admin Dashboard";

  const contentPadding = isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72";

  return (
    <main className={`min-h-screen bg-slate-50 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab={activeSection}
        setActiveTab={setActiveSection}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        role="admin"
      />

      <section className="w-full px-4 pb-12 pt-8 transition-all duration-300 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-2">
              <p className="oas-page-kicker">
                {activeSidebarLabel}
              </p>

              <h1 className="oas-page-title">
                Admin Dashboard
              </h1>

              <p className="oas-page-description">
                Post job openings, manage job postings, review applicants, and
                view published job listings.
              </p>
            </div>

            {message && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800">
                {message}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <DashboardCard
                icon={Briefcase}
                label="Open Jobs"
                value={openJobs}
              />

              <DashboardCard
                icon={ClipboardList}
                label="Applications"
                value={applications.length}
              />

              <DashboardCard
                icon={CheckCircle2}
                label="Needs Review"
                value={pendingApplications}
                iconClassName="text-green-700"
              />
            </div>

            {activeSection === "post-job" && (
              <PostJobSection
                form={form}
                handleFormChange={handleFormChange}
                createJob={createJob}
                isSaving={isSaving}
              />
            )}

            {activeSection === "job-posting" && (
              <JobPostingSection
                jobs={jobs}
                isLoading={isLoading}
                updateJob={updateJob}
                decreaseVacancy={decreaseVacancy}
                setJobToDelete={setJobToDelete}
                setMessage={setMessage}
                formatDate={formatDate}
              />
            )}

            {activeSection === "applicant-list" && (
              <ApplicantListSection
                isLoading={isLoading}
                filteredApplications={filteredApplications}
                positions={positions}
                locations={locations}
                selectedPosition={selectedPosition}
                selectedLocation={selectedLocation}
                searchTerm={searchTerm}
                setSelectedPosition={setSelectedPosition}
                setSelectedLocation={setSelectedLocation}
                setSearchTerm={setSearchTerm}
                setViewApplication={setViewApplication}
                updateApplicationStatus={updateApplicationStatus}
                reviewNotes={reviewNotes}
                setReviewNotes={setReviewNotes}
                setMessage={setMessage}
                statusLabels={statusLabels}
                formatDate={formatDate}
                getApplicationDate={getApplicationDate}
                getApplicationPosition={getApplicationPosition}
                getApplicationLocation={getApplicationLocation}
                getApplicantName={getApplicantName}
                getApplicantEmail={getApplicantEmail}
              />
            )}

            {activeSection === "job-listing" && (
              <JobListingSection
                jobs={jobs}
                isLoading={isLoading}
                formatDate={formatDate}
              />
            )}
          </div>
        </section>
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Delete Job Posting
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                &quot;{jobToDelete.title}&quot;
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

      {viewApplication && (
        <ApplicationFormModal
          application={viewApplication}
          onClose={() => setViewApplication(null)}
          formatDate={formatDate}
          getApplicantName={getApplicantName}
          getApplicantEmail={getApplicantEmail}
          getApplicationPosition={getApplicationPosition}
          getApplicationLocation={getApplicationLocation}
          getApplicationDate={getApplicationDate}
        />
      )}
    </main>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  iconClassName = "text-blue-700",
}) {
  const Icon = icon;

  return (
    <div className="oas-panel p-5">
      <Icon className={`h-6 w-6 ${iconClassName}`} />

      <p className="mt-3 text-sm text-slate-500">{label}</p>

      <p className="oas-stat-value">{value}</p>
    </div>
  );
}

function PostJobSection({ form, handleFormChange, createJob, isSaving }) {
  return (
    <section className="oas-panel p-6">
      <div className="mb-5 flex items-center gap-2">
        <Plus className="h-5 w-5 text-blue-700" />

        <h2 className="oas-panel-title">Post Job Opening</h2>
      </div>

      <form onSubmit={createJob} className="grid gap-4">
        <input
          value={form.title}
          onChange={(event) => handleFormChange("title", event.target.value)}
          placeholder="Job title"
          className="h-11 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          value={form.location}
          onChange={(event) => handleFormChange("location", event.target.value)}
          placeholder="School / location"
          className="h-11 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="h-11 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="date"
            value={form.deadline}
            onChange={(event) =>
              handleFormChange("deadline", event.target.value)
            }
            className="h-11 rounded-xl border border-slate-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <textarea
          value={form.description}
          onChange={(event) =>
            handleFormChange("description", event.target.value)
          }
          placeholder="Job details and requirements"
          className="min-h-32 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-5 font-bold text-white hover:bg-[#003a78] disabled:opacity-60 sm:w-fit"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Post Job
        </button>
      </form>
    </section>
  );
}

function JobPostingSection({
  jobs,
  isLoading,
  updateJob,
  decreaseVacancy,
  setJobToDelete,
  setMessage,
  formatDate,
}) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Job Posting</h2>
      </div>

      {isLoading ? (
        <LoadingState label="Loading job postings..." />
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{job.title}</p>

                <p className="text-sm text-slate-500">
                  {job.location} • {job.vacancy} vacancy • Deadline{" "}
                  {formatDate(job.deadline)}
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
                    }).catch((err) => setMessage(err.message))
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
            <EmptyState label="No job postings yet." />
          )}
        </div>
      )}
    </section>
  );
}

function ApplicantListSection({
  isLoading,
  filteredApplications,
  positions,
  locations,
  selectedPosition,
  selectedLocation,
  searchTerm,
  setSelectedPosition,
  setSelectedLocation,
  setSearchTerm,
  setViewApplication,
  updateApplicationStatus,
  reviewNotes,
  setReviewNotes,
  setMessage,
  statusLabels,
  formatDate,
  getApplicationDate,
  getApplicationPosition,
  getApplicationLocation,
  getApplicantName,
  getApplicantEmail,
}) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Applicant List</h2>

        <p className="mt-1 text-sm text-slate-500">
          View all applicants, filter by position or location, and open each
          applicant&apos;s application form.
        </p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search applicant, UAN, email, or position"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedPosition}
            onChange={(event) => setSelectedPosition(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          <select
            value={selectedLocation}
            onChange={(event) => setSelectedLocation(event.target.value)}
            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedPosition("all");
              setSelectedLocation("all");
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Filter className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-5 py-3">UAN</th>
              <th className="px-5 py-3">Applicant</th>
              <th className="px-5 py-3">Position</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Date Applied</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredApplications.map((application) => (
              <tr
                key={application.id}
                className="border-t border-slate-100 align-top"
              >
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {application.uan || "No UAN"}
                </td>

                <td className="px-5 py-4">
                  <p className="font-medium text-slate-800">
                    {getApplicantName(application)}
                  </p>

                  <p className="text-xs text-slate-500">
                    {getApplicantEmail(application)}
                  </p>
                </td>

                <td className="px-5 py-4 text-slate-700">
                  {getApplicationPosition(application)}
                </td>

                <td className="px-5 py-4 text-slate-700">
                  {getApplicationLocation(application)}
                </td>

                <td className="px-5 py-4 text-slate-700">
                  {formatDate(getApplicationDate(application))}
                </td>

                <td className="px-5 py-4">
                  <select
                    value={application.status}
                    onChange={(event) =>
                      updateApplicationStatus(
                        application,
                        event.target.value
                      ).catch((err) => setMessage(err.message))
                    }
                    className={`h-10 min-w-[155px] cursor-pointer rounded-full border px-3 text-sm font-semibold outline-none transition ${getStatusBadgeClass(
                      application.status
                    )}`}
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                        className={`font-semibold ${getStatusOptionClass(
                          value
                        )}`}
                      >
                        {label}
                      </option>
                    ))}
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

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => setViewApplication(application)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#003a78]"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && filteredApplications.length === 0 && (
          <EmptyState label="No applicants found." />
        )}

        {isLoading && <LoadingState label="Loading applicants..." />}
      </div>
    </section>
  );
}

function JobListingSection({ jobs, isLoading, formatDate }) {
  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Job Listing</h2>

        <p className="mt-1 text-sm text-slate-500">
          Preview all job listings that applicants can see.
        </p>
      </div>

      {isLoading ? (
        <LoadingState label="Loading job listings..." />
      ) : jobs.length === 0 ? (
        <EmptyState label="No job listings available." />
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <article
              key={job.id}
              className="oas-panel p-5 transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="oas-panel-title">
                    {job.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {job.location}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    job.status === "open"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Vacancy:</span> {job.vacancy}
                </p>

                <p>
                  <span className="font-semibold">Deadline:</span>{" "}
                  {formatDate(job.deadline)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ApplicationFormModal({
  application,
  onClose,
  formatDate,
  getApplicantName,
  getApplicantEmail,
  getApplicationPosition,
  getApplicationLocation,
  getApplicationDate,
}) {
  const applicationData =
    application.applicationData ||
    application.formData ||
    application.profile ||
    application;

  const personalInfo =
    applicationData.personalInfo ||
    application.personalInfo ||
    application.applicant?.personalInfo ||
    {};

  const educationalBackground =
    applicationData.educationalBackground ||
    application.educationalBackground ||
    {};

  const eligibility =
    applicationData.eligibility || application.eligibility || {};

  const learningDevelopment =
    applicationData.learningDevelopment || application.learningDevelopment || {};

  const jobPosition =
    applicationData.jobPosition ||
    application.jobPosition ||
    application.job ||
    application.jobOpening ||
    {};

  const files =
    jobPosition.files || application.files || application.attachments || {};

  const fullName =
    getApplicantName(application) ||
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
      personalInfo.suffix,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed Applicant";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Application Form
            </p>

            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              {fullName}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {application.uan || "No UAN"} •{" "}
              {getApplicationPosition(application)} •{" "}
              {formatDate(getApplicationDate(application))}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Email" value={getApplicantEmail(application)} />

            <SummaryItem
              label="Position"
              value={getApplicationPosition(application)}
            />

            <SummaryItem
              label="Location"
              value={getApplicationLocation(application)}
            />

            <SummaryItem
              label="Date Applied"
              value={formatDate(getApplicationDate(application))}
            />
          </div>

          <div className="mt-6 space-y-6">
            <ApplicationSection title="Personal Information">
              <InfoGrid
                items={[
                  ["Name", fullName],
                  ["Email", getApplicantEmail(application)],
                  [
                    "Contact Number",
                    personalInfo.contactNumber ||
                      personalInfo.phone ||
                      application.contactNumber ||
                      "N/A",
                  ],
                  [
                    "Date of Birth",
                    personalInfo.dob || personalInfo.birthDate || "N/A",
                  ],
                  ["Age", personalInfo.age || "N/A"],
                  ["Sex", personalInfo.sex || "N/A"],
                  ["Civil Status", personalInfo.civilStatus || "N/A"],
                  [
                    "Nationality",
                    personalInfo.nationalityInput ||
                      personalInfo.nationality ||
                      "N/A",
                  ],
                  [
                    "Religion",
                    personalInfo.religionInput ||
                      personalInfo.religion ||
                      "N/A",
                  ],
                  ["Address", personalInfo.address || "N/A"],
                  ["Ethnic Group", personalInfo.ethnicGroup || "N/A"],
                  ["Disability", personalInfo.disability || "N/A"],
                  ["Solo Parent", personalInfo.isSoloParent ? "Yes" : "No"],
                  [
                    "Solo Parent ID Number",
                    personalInfo.soloParentIdNumber || "N/A",
                  ],
                  ["PWD", personalInfo.isPwd ? "Yes" : "No"],
                  ["PWD ID Number", personalInfo.pwdIdNumber || "N/A"],
                ]}
              />
            </ApplicationSection>

            <ApplicationSection title="Educational Background">
              <RecordList
                title="Bachelor's Degree"
                records={educationalBackground.bachelors || []}
                fields={[
                  ["School", "school"],
                  ["Course", "course"],
                  ["Year", "year"],
                  ["Award", "award"],
                ]}
              />

              <RecordList
                title="Post Graduate Degree"
                records={educationalBackground.postGraduate || []}
                fields={[
                  ["School", "school"],
                  ["Course", "course"],
                  ["Year", "year"],
                  ["Award", "award"],
                ]}
              />
            </ApplicationSection>

            <ApplicationSection title="Eligibility">
              <RecordList
                title="Eligibility Records"
                records={eligibility.eligibilities || []}
                fields={[
                  ["Type", "type"],
                  ["Rating", "rating"],
                  ["Exam Date", "examDate"],
                  ["License Number", "licenseNumber"],
                  ["Valid Until", "validUntil"],
                ]}
              />

              <RecordList
                title="Work Experience"
                records={eligibility.workExperiences || []}
                fields={[
                  ["Position", "position"],
                  ["Agency", "agency"],
                  ["Status", "status"],
                  ["From", "from"],
                  ["To", "toYear"],
                ]}
              />
            </ApplicationSection>

            <ApplicationSection title="Learning and Development">
              <RecordList
                title="Trainings"
                records={learningDevelopment.trainings || []}
                fields={[
                  ["Title", "title"],
                  ["From Date", "fromDate"],
                  ["To Date", "toDate"],
                  ["Hours", "hours"],
                  ["Conducted By", "conductedBy"],
                ]}
              />
            </ApplicationSection>

            <ApplicationSection title="Job Position and Attachments">
              <InfoGrid
                items={[
                  [
                    "Position Category",
                    jobPosition.positionCategory ||
                      application.positionCategory ||
                      "N/A",
                  ],
                  [
                    "Position Type",
                    jobPosition.positionType ||
                      getApplicationPosition(application) ||
                      "N/A",
                  ],
                  ["Location", getApplicationLocation(application)],
                ]}
              />

              <div className="mt-4">
                <h5 className="text-sm font-bold text-slate-800">
                  Attached Files
                </h5>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(files || {}).length > 0 ? (
                    Object.entries(files || {}).map(([key, file]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <p className="font-semibold text-slate-700">{key}</p>

                        <p className="mt-1 break-all text-slate-500">
                          {file?.name ||
                            file?.fileName ||
                            file?.filename ||
                            "Not uploaded"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No attachments found.
                    </p>
                  )}
                </div>
              </div>
            </ApplicationSection>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#0056b3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#003a78]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-900">
        {value || "N/A"}
      </p>
    </div>
  );
}

function ApplicationSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h4 className="text-lg font-bold text-blue-950">{title}</h4>

      <div className="mt-3 border-b border-slate-200" />

      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <p className="font-semibold text-slate-700">{label}</p>

          <p className="mt-1 break-words text-slate-600">{value || "N/A"}</p>
        </div>
      ))}
    </div>
  );
}

function RecordList({ title, records, fields }) {
  return (
    <div className="mt-4 first:mt-0">
      <h5 className="text-sm font-bold text-slate-800">{title}</h5>

      <div className="mt-3 space-y-3">
        {records.length > 0 ? (
          records.map((record, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Entry {index + 1}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map(([label, key]) => (
                  <div key={key} className="text-sm">
                    <span className="font-semibold text-slate-700">
                      {label}:{" "}
                    </span>

                    <span className="text-slate-600">
                      {record?.[key] || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No records found.</p>
        )}
      </div>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="p-8 text-center text-slate-500">{label}</div>;
}
