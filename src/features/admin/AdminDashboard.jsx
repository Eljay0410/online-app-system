import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import FilterIcon from "../../components/ui/FilterIcon";
import { useToast } from "../../components/ui/toastContext";
import {
  buildSjdmLocationLabel,
  findSjdmSchool,
  sjdmDistricts,
} from "../../lib/sjdmLocations";

const emptyJob = {
  title: "",
  location: "",
  school: "",
  positionId: "",
  positionCategory: "",
  requirements: [],
  district: "",
  barangay: "",
  vacancy: 1,
  deadline: "",
  deadlineTime: "23:59",
  status: "open",
  description: "",
};

const emptyPosition = {
  category: "Teaching",
  title: "",
  requirements: [],
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  for_interview: "For Interview",
  qualified: "Qualified",
  rejected: "Rejected",
  denied: "Denied",
};

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

function getControlClass(error, baseClass) {
  return `${baseClass} ${
    error
      ? "border-red-500 ring-1 ring-red-100 focus:border-red-500 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
  }`;
}

const inputControlClass =
  "h-11 w-full rounded-lg border px-3 text-sm text-slate-800 outline-none transition focus:ring-2";
const disabledInputControlClass = `${inputControlClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;
const textareaControlClass =
  "min-h-36 w-full rounded-lg border px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2";

function validateJobOpeningForm(form, { requireLocation = true } = {}) {
  const errors = {};
  const vacancy = Number(form.vacancy);

  if (!String(form.positionCategory || "").trim()) {
    errors.positionCategory = "Position category is required.";
  }

  if (!String(form.positionId || "").trim()) {
    errors.positionId = "Position is required.";
  }

  if (!String(form.title || "").trim()) {
    errors.title = "Job title is required.";
  }

  if (requireLocation && !String(form.district || "").trim()) {
    errors.district = "District is required.";
  }

  if (form.district && !String(form.barangay || "").trim()) {
    errors.barangay = "Barangay is required.";
  }

  if (requireLocation && !String(form.school || "").trim()) {
    errors.school = "School / office is required.";
  }

  if (!Number.isFinite(vacancy) || vacancy < 1) {
    errors.vacancy = "Vacancies must be at least 1.";
  }

  if (!String(form.deadline || "").trim()) {
    errors.deadline = "Application deadline is required.";
  }

  if (!String(form.deadlineTime || "").trim()) {
    errors.deadlineTime = "Deadline time is required.";
  }

  if (!String(form.status || "open").trim()) {
    errors.status = "Status is required.";
  }

  return errors;
}

function validatePositionForm(form) {
  const errors = {};
  const requirementErrors = [];

  if (!String(form.category || "").trim()) {
    errors.category = "Category is required.";
  }

  if (!String(form.title || "").trim()) {
    errors.title = "Position title is required.";
  }

  (form.requirements || []).forEach((requirement, index) => {
    if (!String(requirement.label || "").trim()) {
      requirementErrors[index] = {
        label: "Requirement label is required.",
      };
    }
  });

  if (requirementErrors.length > 0) {
    errors.requirements = requirementErrors;
  }

  return errors;
}

function clearErrorField(setErrors, field) {
  setErrors((current) => {
    if (!current[field] && !current.form) return current;

    const nextErrors = { ...current };
    delete nextErrors[field];
    delete nextErrors.form;
    return nextErrors;
  });
}

function normalizeComparableValue(field, value) {
  if (field === "vacancy") return Number(value || 0);
  if (field === "positionId") return value ? Number(value) : "";
  if (field === "deadline") return String(value || "").slice(0, 10);
  if (field === "requirements") {
    return JSON.stringify(value || []);
  }

  if (typeof value === "boolean") return value;
  return String(value ?? "").trim();
}

function hasPatchChanges(source = {}, updates = {}) {
  return Object.entries(updates).some(
    ([field, value]) =>
      normalizeComparableValue(field, source[field]) !==
      normalizeComparableValue(field, value)
  );
}

function hasPositionChanges(source = {}, next = {}) {
  return ["category", "title", "requirements"].some(
    (field) =>
      normalizeComparableValue(field, source[field]) !==
      normalizeComparableValue(field, next[field])
  );
}

function getJobLocation(form) {
  return buildSjdmLocationLabel({
    school: form.school,
    barangay: form.barangay,
    district: form.district,
  });
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("job-posting");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [positions, setPositions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [formErrors, setFormErrors] = useState({});
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [reviewNotes, setReviewNotes] = useState({});
  const { showToast } = useToast();

  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewApplication, setViewApplication] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/admin/job-openings"),
      apiRequest("/api/admin/job-positions"),
      apiRequest("/api/admin/applications"),
    ])
      .then(([jobResult, positionResult, applicationResult]) => {
        if (!isMounted) return;

        setJobs(jobResult.jobs || []);
        setPositions(positionResult.positions || []);
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
        if (isMounted) {
          showToast({
            type: "error",
            message: err.message || "Failed to load admin dashboard.",
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearErrorField(setFormErrors, field);
  };

  const resetCreateJobForm = () => {
    setForm(emptyJob);
    setFormErrors({});
  };

  const openCreateJob = () => {
    resetCreateJobForm();
    setIsCreateJobOpen(true);
  };

  const closeCreateJob = () => {
    if (isSaving) return;

    setIsCreateJobOpen(false);
    resetCreateJobForm();
  };

  const changeActiveSection = (section) => {
    setActiveSection(section === "post-job" ? "job-posting" : section);
    setIsCreateJobOpen(false);
    resetCreateJobForm();
  };

  const createJob = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = validateJobOpeningForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted job opening fields.",
      });
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      const result = await apiRequest("/api/admin/job-openings", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          location: getJobLocation(form),
          vacancy: Number(form.vacancy),
          positionId: form.positionId ? Number(form.positionId) : null,
        }),
      });

      setJobs((prev) => [result.job, ...prev]);
      setForm(emptyJob);
      setFormErrors({});
      setIsCreateJobOpen(false);
      showToast({ type: "success", message: "Job opening posted." });
      setActiveSection("job-posting");
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to post job opening.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateJob = async (job, updates) => {
    if (!hasPatchChanges(job, updates)) {
      showToast({ type: "info", message: "No changes were made." });
      return { skipped: true, job };
    }

    const result = await apiRequest(`/api/admin/job-openings/${job.id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });

    setJobs((prev) =>
      prev.map((item) => (item.id === job.id ? result.job : item))
    );

    return { skipped: false, job: result.job };
  };

  const deleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await apiRequest(`/api/admin/job-openings/${jobToDelete.id}`, {
        method: "DELETE",
      });

      setJobs((prev) => prev.filter((item) => item.id !== jobToDelete.id));

      showToast({ type: "success", message: "Job posting deleted." });
      setJobToDelete(null);
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to delete job posting.",
      });
    }
  };

  const updateApplicationStatus = async (application, status) => {
    const reviewNote =
      reviewNotes[application.id] ?? application.reviewNotes ?? "";

    if (
      normalizeComparableValue("status", application.status) ===
        normalizeComparableValue("status", status) &&
      normalizeComparableValue("reviewNotes", application.reviewNotes) ===
        normalizeComparableValue("reviewNotes", reviewNote)
    ) {
      showToast({ type: "info", message: "No changes were made." });
      return { skipped: true, application };
    }

    const result = await apiRequest(
      `/api/admin/applications/${application.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNotes: reviewNote,
        }),
      }
    );

    setApplications((prev) =>
      prev.map((item) =>
        item.id === application.id ? result.application : item
      )
    );

    showToast({ type: "success", message: "Application status updated." });
    return { skipped: false, application: result.application };
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

  const applicationPositions = useMemo(() => {
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

  const contentPadding = isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72";

  return (
    <main className={`min-h-screen bg-slate-50 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab={activeSection}
        setActiveTab={changeActiveSection}
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
        role="admin"
      />

      <section className="w-full px-4 pb-12 pt-8 transition-all duration-300 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="oas-page-title">Admin Dashboard</h1>
            <p className="oas-page-description">
              Post job openings, manage job postings, review applicants, and
              view published job listings.
            </p>
          </div>

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

          {activeSection === "job-posting" && (
            <JobPostingSection
              jobs={jobs}
              positions={positions}
              isLoading={isLoading}
              updateJob={updateJob}
              setJobToDelete={setJobToDelete}
              formatDate={formatDate}
              onCreateJob={openCreateJob}
            />
          )}

          {activeSection === "positions" && (
            <PositionManagerSection
              positions={positions}
              setPositions={setPositions}
            />
          )}

          {activeSection === "applicant-list" && (
            <ApplicantListSection
              isLoading={isLoading}
              filteredApplications={filteredApplications}
              positions={applicationPositions}
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
                className="oas-danger-button"
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

      {isCreateJobOpen && (
        <CreateJobOpeningModal
          form={form}
          errors={formErrors}
          positions={positions}
          handleFormChange={handleFormChange}
          createJob={createJob}
          onClose={closeCreateJob}
          isSaving={isSaving}
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

function CreateJobOpeningModal({
  form,
  errors = {},
  positions,
  handleFormChange,
  createJob,
  onClose,
  isSaving,
}) {
  const selectedDistrict = sjdmDistricts.find(
    (district) => district.name === form.district
  );
  const barangays = selectedDistrict?.barangays || [];
  const schools = selectedDistrict?.schools || [];
  const filteredPositions = positions.filter(
    (position) => position.category === form.positionCategory
  );
  const selectedPosition = positions.find(
    (position) => String(position.id) === String(form.positionId)
  );

  const handlePositionCategoryChange = (value) => {
    handleFormChange("positionCategory", value);
    handleFormChange("positionId", "");
    handleFormChange("requirements", []);
  };

  const handlePositionChange = (value) => {
    const position = positions.find(
      (item) => String(item.id) === String(value)
    );

    handleFormChange("positionId", value);
    handleFormChange("title", position?.title || "");
    handleFormChange("positionCategory", position?.category || form.positionCategory);
    handleFormChange("requirements", position?.requirements || []);
  };

  const handleSchoolChange = (value) => {
    const school = findSjdmSchool(form.district, value);

    handleFormChange("school", value);
    if (school?.barangay) {
      handleFormChange("barangay", school.barangay);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
              Create Job Opening
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill out the posting details and deadline.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create job opening"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={createJob} className="flex min-h-0 flex-col" noValidate>
          <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <JobFormField
            label="Position Category"
            error={errors.positionCategory}
            required
          >
            <select
              value={form.positionCategory}
              onChange={(event) =>
                handlePositionCategoryChange(event.target.value)
              }
              aria-invalid={Boolean(errors.positionCategory)}
              className={getControlClass(errors.positionCategory, inputControlClass)}
            >
              <option value="">Select category</option>
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
          </JobFormField>

          <JobFormField label="Position" error={errors.positionId} required>
            <select
              value={form.positionId}
              onChange={(event) => handlePositionChange(event.target.value)}
              disabled={!form.positionCategory}
              aria-invalid={Boolean(errors.positionId)}
              className={getControlClass(
                errors.positionId,
                disabledInputControlClass
              )}
            >
              <option value="">
                {form.positionCategory
                  ? "Select position"
                  : "Select category first"}
              </option>
              {filteredPositions.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
          </JobFormField>
        </div>

        <JobFormField label="Job Title" error={errors.title} required>
          <input
            value={form.title}
            onChange={(event) => handleFormChange("title", event.target.value)}
            placeholder="Enter job title"
            aria-invalid={Boolean(errors.title)}
            className={getControlClass(errors.title, inputControlClass)}
          />
        </JobFormField>

        <div className="grid gap-4 lg:grid-cols-3">
          <JobFormField label="District" error={errors.district} required>
            <select
              value={form.district}
              onChange={(event) => {
                handleFormChange("district", event.target.value);
                handleFormChange("barangay", "");
                handleFormChange("school", "");
              }}
              aria-invalid={Boolean(errors.district)}
              className={getControlClass(errors.district, inputControlClass)}
            >
              <option value="">Select district</option>
              {sjdmDistricts.map((district) => (
                <option key={district.name} value={district.name}>
                  {district.name}
                </option>
              ))}
            </select>
          </JobFormField>

          <JobFormField label="School / Office" error={errors.school} required>
            <input
              value={form.school}
              list="create-job-school-options"
              onChange={(event) => handleSchoolChange(event.target.value)}
              disabled={!form.district}
              placeholder={
                form.district ? "Select or type school / office" : "Select district first"
              }
              aria-invalid={Boolean(errors.school)}
              className={getControlClass(errors.school, disabledInputControlClass)}
            />
            <datalist id="create-job-school-options">
              {schools.map((school) => (
                <option key={school.name} value={school.name}>
                  {school.barangay}
                </option>
              ))}
            </datalist>
          </JobFormField>

          <JobFormField label="Barangay" error={errors.barangay} required>
            <select
              value={form.barangay}
              onChange={(event) =>
                handleFormChange("barangay", event.target.value)
              }
              disabled={!form.district}
              aria-invalid={Boolean(errors.barangay)}
              className={getControlClass(errors.barangay, disabledInputControlClass)}
            >
              <option value="">Select barangay</option>
              {barangays.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          </JobFormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <JobFormField label="Vacancies" error={errors.vacancy} required>
            <input
              type="number"
              min="1"
              value={form.vacancy}
              onChange={(event) =>
                handleFormChange("vacancy", event.target.value)
              }
              aria-invalid={Boolean(errors.vacancy)}
              className={getControlClass(errors.vacancy, inputControlClass)}
            />
          </JobFormField>

          <JobFormField
            label="Application Deadline"
            error={errors.deadline}
            required
          >
            <input
              type="date"
              value={form.deadline}
              onChange={(event) =>
                handleFormChange("deadline", event.target.value)
              }
              aria-invalid={Boolean(errors.deadline)}
              className={getControlClass(errors.deadline, inputControlClass)}
            />
          </JobFormField>

          <JobFormField
            label="Deadline Time"
            error={errors.deadlineTime}
            required
          >
            <input
              type="time"
              value={form.deadlineTime}
              onChange={(event) =>
                handleFormChange("deadlineTime", event.target.value)
              }
              aria-invalid={Boolean(errors.deadlineTime)}
              className={getControlClass(errors.deadlineTime, inputControlClass)}
            />
          </JobFormField>
        </div>

        <JobFormField label="Description">
          <textarea
            value={form.description}
            onChange={(event) =>
              handleFormChange("description", event.target.value)
            }
            placeholder="Enter job details, qualifications, and requirements"
            className={getControlClass("", textareaControlClass)}
          />
        </JobFormField>

        <RequirementPreview requirements={selectedPosition?.requirements || []} />

          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
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
      </div>
    </div>
  );
}

function JobFormField({ label, required = false, error = "", children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <span className="mt-2 block">{children}</span>
      {error && (
        <span className="mt-1.5 block text-[12px] font-semibold text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function RequirementPreview({ requirements = [] }) {
  if (!requirements.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        No upload requirements configured for this position.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Upload Requirements
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <div
            key={requirement.field}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <p className="font-semibold text-slate-800">
              {requirement.label}
            </p>
            {requirement.description && (
              <p className="mt-1 text-xs text-slate-500">
                {requirement.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getDateInputValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function createEditJobForm(job) {
  const district =
    job.district ||
    sjdmDistricts.find((item) => job.location?.includes(item.name))?.name ||
    "";
  const barangays =
    sjdmDistricts.find((item) => item.name === district)?.barangays || [];
  const schools =
    sjdmDistricts.find((item) => item.name === district)?.schools || [];
  const school =
    job.school ||
    schools.find((item) => job.location?.includes(item.name))?.name ||
    "";
  const barangay =
    job.barangay ||
    findSjdmSchool(district, school)?.barangay ||
    barangays.find((item) => job.location?.includes(item)) ||
    "";

  return {
    title: job.title || "",
    location: job.location || "",
    school,
    district,
    barangay,
    vacancy: job.vacancy || 1,
    deadline: getDateInputValue(job.deadline),
    deadlineTime: job.deadlineTime || "23:59",
    positionId: job.positionId || "",
    positionCategory: job.positionCategory || "",
    status: job.status === "expired" ? "closed" : job.status || "open",
    description: job.description || "",
    requirements: job.requirements || [],
  };
}

function JobPostingSection(props) {
  const {
    jobs,
    positions,
    updateJob,
    setJobToDelete,
    formatDate,
    onCreateJob,
  } = props;
  const [editingJob, setEditingJob] = useState(null);
  const [editForm, setEditForm] = useState(emptyJob);
  const [editErrors, setEditErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();
  const selectedDistrict = sjdmDistricts.find(
    (district) => district.name === editForm.district
  );
  const barangays = selectedDistrict?.barangays || [];
  const schools = selectedDistrict?.schools || [];
  const filteredPositions = positions.filter(
    (position) => position.category === editForm.positionCategory
  );
  const selectedPosition = positions.find(
    (position) => String(position.id) === String(editForm.positionId)
  );

  if (props.isLoading || jobs.length === 0) {
    return <JobPostingSectionLegacy {...props} />;
  }

  const openEditJob = (job) => {
    setEditingJob(job);
    setEditForm(createEditJobForm(job));
    setEditErrors({});
  };

  const closeEditJob = () => {
    if (isUpdating) return;

    setEditingJob(null);
    setEditForm(emptyJob);
    setEditErrors({});
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
    clearErrorField(setEditErrors, field);
  };

  const updateEditSchool = (value) => {
    const school = findSjdmSchool(editForm.district, value);

    updateEditField("school", value);
    if (school?.barangay) {
      updateEditField("barangay", school.barangay);
    }
  };

  const saveEditedJob = async (event) => {
    event.preventDefault();

    if (isUpdating || !editingJob) return;

    const validationErrors = validateJobOpeningForm(editForm, {
      requireLocation: false,
    });

    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted job opening fields.",
      });
      return;
    }

    setIsUpdating(true);
    setEditErrors({});

    try {
      const location =
        getJobLocation(editForm) ||
        editingJob.location;

      const updateResult = await updateJob(editingJob, {
        title: editForm.title,
        location,
        district: editForm.district,
        barangay: editForm.barangay,
        vacancy: Number(editForm.vacancy),
        deadline: editForm.deadline,
        deadlineTime: editForm.deadlineTime,
        positionId: editForm.positionId ? Number(editForm.positionId) : null,
        positionCategory: editForm.positionCategory,
        status: editForm.status,
        description: editForm.description,
        requirements: editForm.requirements || [],
      });

      if (updateResult.skipped) return;

      showToast({ type: "success", message: "Job opening updated." });
      setEditingJob(null);
      setEditForm(emptyJob);
      setEditErrors({});
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to update job opening.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="oas-panel">
      <div className="oas-panel-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="oas-panel-title">Manage Job Openings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, update, and monitor job postings in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateJob}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
        >
          <Plus className="h-4 w-4" />
          Create Job Opening
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3 font-bold">Job Title</th>
              <th className="px-5 py-3 font-bold">Location</th>
              <th className="px-5 py-3 font-bold">Vacancies</th>
              <th className="px-5 py-3 font-bold">Deadline</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 text-right font-bold">Action</th>
            </tr>
          </thead>

          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-t border-slate-100">
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {job.title}
                </td>

                <td className="px-5 py-4 text-slate-600">{job.location}</td>

                <td className="px-5 py-4 text-slate-700">{job.vacancy}</td>

                <td className="px-5 py-4 text-slate-700">
                  {formatDate(job.deadline)} {job.deadlineTime || ""}
                </td>

                <td className="px-5 py-4">
                  <select
                    value={job.status}
                    onChange={(event) =>
                      updateJob(job, {
                        status: event.target.value,
                      })
                        .then((result) => {
                          if (!result?.skipped) {
                            showToast({
                              type: "success",
                              message: "Job status updated.",
                            });
                          }
                        })
                        .catch((err) =>
                          showToast({
                            type: "error",
                            message:
                              err.message || "Failed to update job status.",
                          })
                        )
                    }
                    className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {job.status === "expired" && (
                      <option value="expired" disabled>
                        Expired
                      </option>
                    )}
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditJob(job)}
                      className="oas-action-button"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setJobToDelete(job)}
                      className="oas-danger-button"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Job Opening
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update the posting details applicants will see.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditJob}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={saveEditedJob}
              className="grid gap-4 overflow-y-auto px-6 py-5"
              noValidate
            >
              <JobFormField label="Job Title" error={editErrors.title} required>
                <input
                  value={editForm.title}
                  onChange={(event) =>
                    updateEditField("title", event.target.value)
                  }
                  aria-invalid={Boolean(editErrors.title)}
                  className={getControlClass(editErrors.title, inputControlClass)}
                />
              </JobFormField>

              <div className="grid gap-4 lg:grid-cols-3">
                <JobFormField label="District" error={editErrors.district}>
                  <select
                    value={editForm.district}
                    onChange={(event) => {
                      updateEditField("district", event.target.value);
                      updateEditField("barangay", "");
                      updateEditField("school", "");
                    }}
                    aria-invalid={Boolean(editErrors.district)}
                    className={getControlClass(editErrors.district, inputControlClass)}
                  >
                    <option value="">Keep current location</option>
                    {sjdmDistricts.map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </JobFormField>

                <JobFormField label="School / Office" error={editErrors.school}>
                  <input
                    value={editForm.school}
                    list="edit-job-school-options"
                    onChange={(event) => updateEditSchool(event.target.value)}
                    disabled={!editForm.district}
                    placeholder={
                      editForm.district
                        ? "Select or type school / office"
                        : "Select district first"
                    }
                    aria-invalid={Boolean(editErrors.school)}
                    className={getControlClass(
                      editErrors.school,
                      disabledInputControlClass
                    )}
                  />
                  <datalist id="edit-job-school-options">
                    {schools.map((school) => (
                      <option key={school.name} value={school.name}>
                        {school.barangay}
                      </option>
                    ))}
                  </datalist>
                </JobFormField>

                <JobFormField label="Barangay" error={editErrors.barangay}>
                  <select
                    value={editForm.barangay}
                    onChange={(event) =>
                      updateEditField("barangay", event.target.value)
                    }
                    disabled={!editForm.district}
                    aria-invalid={Boolean(editErrors.barangay)}
                    className={getControlClass(
                      editErrors.barangay,
                      disabledInputControlClass
                    )}
                  >
                    <option value="">
                      {editForm.district
                        ? "Select barangay"
                        : "Select district first"}
                    </option>
                    {barangays.map((barangay) => (
                      <option key={barangay} value={barangay}>
                        {barangay}
                      </option>
                    ))}
                  </select>
                </JobFormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <JobFormField
                  label="Position Category"
                  error={editErrors.positionCategory}
                  required
                >
                  <select
                    value={editForm.positionCategory}
                    onChange={(event) => {
                      updateEditField("positionCategory", event.target.value);
                      updateEditField("positionId", "");
                      updateEditField("requirements", []);
                    }}
                    aria-invalid={Boolean(editErrors.positionCategory)}
                    className={getControlClass(
                      editErrors.positionCategory,
                      inputControlClass
                    )}
                  >
                    <option value="">Select category</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </JobFormField>

                <JobFormField
                  label="Position"
                  error={editErrors.positionId}
                  required
                >
                  <select
                    value={editForm.positionId}
                    onChange={(event) => {
                      const position = positions.find(
                        (item) => String(item.id) === event.target.value
                      );
                      updateEditField("positionId", event.target.value);
                      updateEditField("title", position?.title || editForm.title);
                      updateEditField("requirements", position?.requirements || []);
                    }}
                    disabled={!editForm.positionCategory}
                    aria-invalid={Boolean(editErrors.positionId)}
                    className={getControlClass(
                      editErrors.positionId,
                      disabledInputControlClass
                    )}
                  >
                    <option value="">
                      {editForm.positionCategory
                        ? "Select position"
                        : "Select category first"}
                    </option>
                    {filteredPositions.map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title}
                      </option>
                    ))}
                  </select>
                </JobFormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <JobFormField
                  label="Vacancies"
                  error={editErrors.vacancy}
                  required
                >
                  <input
                    type="number"
                    min="1"
                    value={editForm.vacancy}
                    onChange={(event) =>
                      updateEditField("vacancy", event.target.value)
                    }
                    aria-invalid={Boolean(editErrors.vacancy)}
                    className={getControlClass(editErrors.vacancy, inputControlClass)}
                  />
                </JobFormField>

                <JobFormField
                  label="Application Deadline"
                  error={editErrors.deadline}
                  required
                >
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={(event) =>
                      updateEditField("deadline", event.target.value)
                    }
                    aria-invalid={Boolean(editErrors.deadline)}
                    className={getControlClass(editErrors.deadline, inputControlClass)}
                  />
                </JobFormField>

                <JobFormField
                  label="Deadline Time"
                  error={editErrors.deadlineTime}
                  required
                >
                  <input
                    type="time"
                    value={editForm.deadlineTime}
                    onChange={(event) =>
                      updateEditField("deadlineTime", event.target.value)
                    }
                    aria-invalid={Boolean(editErrors.deadlineTime)}
                    className={getControlClass(
                      editErrors.deadlineTime,
                      inputControlClass
                    )}
                  />
                </JobFormField>

                <JobFormField label="Status" error={editErrors.status} required>
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      updateEditField("status", event.target.value)
                    }
                    aria-invalid={Boolean(editErrors.status)}
                    className={getControlClass(editErrors.status, inputControlClass)}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="draft">Draft</option>
                  </select>
                </JobFormField>
              </div>

              <JobFormField label="Description">
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    updateEditField("description", event.target.value)
                  }
                  className={getControlClass("", textareaControlClass)}
                />
              </JobFormField>

              <RequirementPreview
                requirements={selectedPosition?.requirements || editForm.requirements || []}
              />

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditJob}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:opacity-60"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function JobPostingSectionLegacy({
  jobs,
  isLoading,
  updateJob,
  setJobToDelete,
  formatDate,
  onCreateJob,
}) {
  const { showToast } = useToast();

  return (
    <section className="oas-panel">
      <div className="oas-panel-header flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="oas-panel-title">Manage Job Openings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, update, and monitor job postings in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateJob}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Plus className="h-4 w-4" />
          Create Job Opening
        </button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading job openings..." />
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
                  {formatDate(job.deadline)} {job.deadlineTime || ""}
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
                <select
                  value={job.status}
                  onChange={(event) =>
                    updateJob(job, {
                      status: event.target.value,
                    })
                      .then((result) => {
                        if (!result?.skipped) {
                          showToast({
                            type: "success",
                            message: "Job status updated.",
                          });
                        }
                      })
                      .catch((err) =>
                        showToast({
                          type: "error",
                          message: err.message || "Failed to update job status.",
                        })
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
                  className="oas-danger-button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!isLoading && jobs.length === 0 && (
            <EmptyState label="No job openings yet." />
          )}
        </div>
      )}
    </section>
  );
}

function PositionManagerSection({ positions, setPositions }) {
  const [draft, setDraft] = useState(emptyPosition);
  const [positionErrors, setPositionErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    clearErrorField(setPositionErrors, field);
  };

  const resetDraft = () => {
    setDraft(emptyPosition);
    setEditingId(null);
    setPositionErrors({});
  };

  const addRequirement = () => {
    setDraft((current) => ({
      ...current,
      requirements: [
        ...(current.requirements || []),
        { label: "", description: "", required: true },
      ],
    }));
  };

  const updateRequirement = (index, field, value) => {
    setDraft((current) => ({
      ...current,
      requirements: (current.requirements || []).map((requirement, itemIndex) =>
        itemIndex === index ? { ...requirement, [field]: value } : requirement
      ),
    }));

    if (field === "label") {
      setPositionErrors((current) => {
        if (!current.requirements?.[index]?.label) return current;

        const nextRequirementErrors = [...current.requirements];
        nextRequirementErrors[index] = {
          ...nextRequirementErrors[index],
          label: "",
        };

        return {
          ...current,
          requirements: nextRequirementErrors,
        };
      });
    }
  };

  const removeRequirement = (index) => {
    setDraft((current) => ({
      ...current,
      requirements: (current.requirements || []).filter(
        (_requirement, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const editPosition = (position) => {
    setEditingId(position.id);
    setDraft({
      category: position.category || "Teaching",
      title: position.title || "",
      requirements: position.requirements || [],
    });
    setPositionErrors({});
  };

  const savePosition = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const validationErrors = validatePositionForm(draft);

    if (Object.keys(validationErrors).length > 0) {
      setPositionErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted position fields.",
      });
      return;
    }

    if (editingId) {
      const originalPosition = positions.find(
        (position) => position.id === editingId
      );

      if (originalPosition && !hasPositionChanges(originalPosition, draft)) {
        showToast({ type: "info", message: "No changes were made." });
        return;
      }
    }

    setIsSaving(true);
    setPositionErrors({});

    try {
      const path = editingId
        ? `/api/admin/job-positions/${editingId}`
        : "/api/admin/job-positions";
      const result = await apiRequest(path, {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(draft),
      });

      setPositions((current) =>
        editingId
          ? current.map((position) =>
              position.id === editingId ? result.position : position
            )
          : [...current, result.position].sort((a, b) =>
              `${a.category}${a.title}`.localeCompare(`${b.category}${b.title}`)
            )
      );
      showToast({
        type: "success",
        message: editingId ? "Position updated." : "Position added.",
      });
      resetDraft();
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to save position.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePosition = async () => {
    if (!positionToDelete) return;

    try {
      await apiRequest(`/api/admin/job-positions/${positionToDelete.id}`, {
        method: "DELETE",
      });
      setPositions((current) =>
        current.filter((item) => item.id !== positionToDelete.id)
      );
      showToast({ type: "success", message: "Position deleted." });
      if (editingId === positionToDelete.id) resetDraft();
      setPositionToDelete(null);
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to delete position.",
      });
    }
  };

  return (
    <>
    <section className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={savePosition} className="oas-panel p-6" noValidate>
        <h2 className="oas-panel-title">
          {editingId ? "Edit Position" : "Add Position"}
        </h2>

        <div className="mt-5 grid gap-4">
          <JobFormField label="Category" error={positionErrors.category} required>
            <select
              value={draft.category}
              onChange={(event) => updateDraft("category", event.target.value)}
              aria-invalid={Boolean(positionErrors.category)}
              className={getControlClass(positionErrors.category, inputControlClass)}
            >
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
          </JobFormField>

          <JobFormField
            label="Position Title"
            error={positionErrors.title}
            required
          >
            <input
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              placeholder="Example: Teacher I"
              aria-invalid={Boolean(positionErrors.title)}
              className={getControlClass(positionErrors.title, inputControlClass)}
            />
          </JobFormField>

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Upload Requirements
              </p>

              <button
                type="button"
                onClick={addRequirement}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(draft.requirements || []).map((requirement, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <input
                    value={requirement.label}
                    onChange={(event) =>
                      updateRequirement(index, "label", event.target.value)
                    }
                    placeholder="Requirement label"
                    aria-invalid={Boolean(
                      positionErrors.requirements?.[index]?.label
                    )}
                    className={getControlClass(
                      positionErrors.requirements?.[index]?.label,
                      "h-10 w-full rounded-lg border px-3 text-sm outline-none transition focus:ring-2"
                    )}
                  />
                  {positionErrors.requirements?.[index]?.label && (
                    <p className="mt-1.5 text-[12px] font-semibold text-red-600">
                      {positionErrors.requirements[index].label}
                    </p>
                  )}

                  <textarea
                    value={requirement.description || ""}
                    onChange={(event) =>
                      updateRequirement(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Short instruction or description"
                    className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="oas-danger-button mt-2"
                  >
                    Remove requirement
                  </button>
                </div>
              ))}

              {draft.requirements.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
                  Add upload requirements applicants must submit for this
                  position.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {editingId && (
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "Save Changes" : "Add Position"}
            </button>
          </div>
        </div>
      </form>

      <section className="oas-panel">
        <div className="oas-panel-header">
          <h2 className="oas-panel-title">Position Library</h2>
          <p className="mt-1 text-sm text-slate-500">
            These positions can be selected when creating job openings.
          </p>
        </div>

        {positions.length === 0 ? (
          <EmptyState label="No positions added yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {positions.map((position) => (
              <div
                key={position.id}
                className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {position.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {position.category} -{" "}
                    {position.requirements?.length || 0} requirement(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => editPosition(position)}
                    className="oas-action-button"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setPositionToDelete(position)}
                    className="oas-danger-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </section>
      {positionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">
              Delete Position
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                &quot;{positionToDelete.title}&quot;
              </span>
              ? Existing job openings will keep their saved details.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPositionToDelete(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={deletePosition}
                className="oas-danger-button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
  statusLabels,
  formatDate,
  getApplicationDate,
  getApplicationPosition,
  getApplicationLocation,
  getApplicantName,
  getApplicantEmail,
}) {
  const { showToast } = useToast();

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
            <FilterIcon className="h-4 w-4" />
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
                      ).catch((err) =>
                        showToast({
                          type: "error",
                          message:
                            err.message || "Failed to update application.",
                        })
                      )
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
                    className="oas-action-button"
                  >
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
  const [viewJob, setViewJob] = useState(null);

  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Job Listing</h2>

        <p className="mt-1 text-sm text-slate-500">
          View all posted job openings and open their full details.
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
              <div>
                <h3 className="oas-panel-title">
                  {job.title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {job.location}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Vacancy:</span> {job.vacancy}
                </p>

                <p>
                  <span className="font-semibold">Deadline:</span>{" "}
                  {formatDate(job.deadline)} {job.deadlineTime || ""}
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewJob(job)}
                  className="oas-action-button"
                >
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewJob && (
        <JobListingDetailsModal
          job={viewJob}
          onClose={() => setViewJob(null)}
          formatDate={formatDate}
        />
      )}
    </section>
  );
}

function JobListingDetailsModal({ job, onClose, formatDate }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92vh]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <h3 className="break-words text-xl font-bold text-slate-900 [overflow-wrap:anywhere]">
              {job.title}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {job.location}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryItem label="Vacancies" value={job.vacancy} />
            <SummaryItem
              label="Application Deadline"
              value={`${formatDate(job.deadline)} ${job.deadlineTime || ""}`}
            />
            <SummaryItem label="Status" value={job.status} />
          </div>

          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">Description</h4>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              {job.description || "No description provided yet."}
            </p>
          </section>

          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Upload Requirements
            </h4>

            {job.requirements?.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {job.requirements.map((requirement) => (
                  <div
                    key={requirement.field}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <p className="break-words font-semibold text-slate-800 [overflow-wrap:anywhere]">
                      {requirement.label}
                    </p>
                    {requirement.description && (
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                        {requirement.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No upload requirements configured.
              </p>
            )}
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92vh]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Application Form
            </p>

            <h3 className="mt-1 break-words text-2xl font-bold text-slate-900 [overflow-wrap:anywhere]">
              {fullName}
            </h3>

            <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {application.uan || "No UAN"} •{" "}
              {getApplicationPosition(application)} •{" "}
              {formatDate(getApplicationDate(application))}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6">
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
                        className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                      >
                        <p className="break-words font-semibold text-slate-700 [overflow-wrap:anywhere]">
                          {key}
                        </p>

                        <p className="mt-1 break-words text-slate-500 [overflow-wrap:anywhere]">
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

        <div className="flex shrink-0 justify-end border-t border-slate-200 px-4 py-4 sm:px-6">
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
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {value || "N/A"}
      </p>
    </div>
  );
}

function ApplicationSection({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h4 className="break-words text-lg font-bold text-blue-950 [overflow-wrap:anywhere]">
        {title}
      </h4>

      <div className="mt-3 border-b border-slate-200" />

      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-lg bg-slate-50 px-3 py-2 text-sm"
        >
          <p className="break-words font-semibold text-slate-700 [overflow-wrap:anywhere]">
            {label}
          </p>

          <p className="mt-1 break-words text-slate-600 [overflow-wrap:anywhere]">
            {value || "N/A"}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecordList({ title, records, fields }) {
  return (
    <div className="mt-4 first:mt-0">
      <h5 className="break-words text-sm font-bold text-slate-800 [overflow-wrap:anywhere]">
        {title}
      </h5>

      <div className="mt-3 space-y-3">
        {records.length > 0 ? (
          records.map((record, index) => (
            <div
              key={index}
              className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                Entry {index + 1}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {fields.map(([label, key]) => (
                  <div key={key} className="min-w-0 text-sm">
                    <span className="break-words font-semibold text-slate-700 [overflow-wrap:anywhere]">
                      {label}:{" "}
                    </span>

                    <span className="break-words text-slate-600 [overflow-wrap:anywhere]">
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
