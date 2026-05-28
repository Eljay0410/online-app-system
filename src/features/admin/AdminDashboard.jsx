import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import ActivityLogSection from "./ActivityLogSection";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import FilterIcon from "../../components/ui/FilterIcon";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
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
  draft: "Draft",
  submitted: "Submitted",
  pending_review: "Pending Review",
  for_compliance: "For Compliance",
  under_review: "Under Review",
  qualified: "Qualified",
  rejected: "Rejected",
  hired: "Hired",
};

const applicationStatusTransitions = {
  draft: ["submitted", "rejected"],
  submitted: ["pending_review", "under_review", "for_compliance", "rejected"],
  pending_review: ["under_review", "for_compliance", "rejected"],
  for_compliance: ["pending_review", "under_review", "rejected"],
  under_review: ["qualified", "rejected"],
  qualified: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

function getApplicationStatusOptions(status) {
  const currentStatus = statusLabels[status] ? status : "submitted";
  const nextStatuses = applicationStatusTransitions[currentStatus] || [];

  return [currentStatus, ...nextStatuses].filter(
    (value, index, items) => statusLabels[value] && items.indexOf(value) === index
  );
}

function isApplicationStatusFinal(status) {
  return (applicationStatusTransitions[status] || []).length === 0;
}

const adminSections = new Set([
  "job-posting",
  "positions",
  "applicant-list",
  "job-listing",
  "activity-logs",
]);
const defaultApplicationPageSize = 10;
const applicantPageSizeOptions = [10, 25, 50];
const cardPageSizeOptions = [6, 9, 12];
const tablePageSizeOptions = [10, 25, 50];
const defaultPositionPageSize = 10;
const positionPageSizeOptions = [10, 25, 50];
const requirementReviewStatuses = [
  "pending",
  "approved",
  "rejected",
  "needs_resubmission",
  "missing",
];
const requirementReviewStatusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_resubmission: "Needs Resubmission",
  missing: "Missing",
};

const adminPageMeta = {
  "job-posting": {
    title: "Manage Job Openings",
    description: "Create, update, and monitor job postings in one place.",
  },
  positions: {
    title: "Positions",
    description: "Manage position categories and document requirements.",
  },
  "applicant-list": {
    title: "Applicant List",
    description: "Review applicants, update statuses, and record HR remarks.",
  },
  "job-listing": {
    title: "Job Listing",
    description: "View all posted job openings and their published details.",
  },
  "activity-logs": {
    title: "Activity Logs",
    description: "Backtrack admin changes to postings, positions, and applicant statuses.",
  },
};

function normalizeAdminSection(section) {
  const normalizedSection = section === "post-job" ? "job-posting" : section;

  return adminSections.has(normalizedSection)
    ? normalizedSection
    : "job-posting";
}

function getStatusBadgeClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "draft") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (normalizedStatus === "submitted") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "pending_review") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalizedStatus === "for_compliance") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "under_review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "qualified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "hired") {
    return "border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "denied") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusOptionClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "draft") {
    return "bg-slate-50 text-slate-700";
  }

  if (normalizedStatus === "submitted") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalizedStatus === "pending_review") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (normalizedStatus === "for_compliance") {
    return "bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "under_review") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "qualified") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "hired") {
    return "bg-emerald-50 text-emerald-800";
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "denied") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-50 text-slate-700";
}

function getRequirementReviewStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "needs_resubmission") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "missing") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }

  if (normalizedStatus === "rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getRequirementFileName(file) {
  return file?.name || file?.fileName || file?.filename || "No file attached";
}

function buildRequirementDrafts(requirements = []) {
  return Object.fromEntries(
    requirements.map((requirement) => [
      String(requirement.id || requirement.field),
      {
        status: requirement.status || "pending",
        remarks: requirement.remarks || "",
      },
    ])
  );
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
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeSection = normalizeAdminSection(sectionParam);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialSidebarCollapsed
  );

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
  const [applicationPagination, setApplicationPagination] = useState({
    limit: defaultApplicationPageSize,
    offset: 0,
    total: 0,
  });
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationPageSize, setApplicationPageSize] =
    useState(defaultApplicationPageSize);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [applicationFilterOptions, setApplicationFilterOptions] = useState({
    positions: [],
    locations: [],
    schools: [],
  });
  const { showToast } = useToast();

  const [selectedPosition, setSelectedPosition] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewApplication, setViewApplication] = useState(null);
  const hasFilters =
    Boolean(searchTerm.trim()) ||
    selectedPosition !== "all" ||
    selectedLocation !== "all";

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/admin/job-openings?limit=100"),
      apiRequest("/api/admin/job-positions"),
    ])
      .then(([jobResult, positionResult]) => {
        if (!isMounted) return;

        setJobs(jobResult.jobs || []);
        setPositions(positionResult.positions || []);
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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setApplicationPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      limit: String(applicationPageSize),
      offset: String((applicationPage - 1) * applicationPageSize),
    });

    if (debouncedSearchTerm) params.set("q", debouncedSearchTerm);
    if (selectedPosition !== "all") params.set("position", selectedPosition);
    if (selectedLocation !== "all") params.set("school", selectedLocation);

    apiRequest(`/api/admin/applications?${params.toString()}`, {
      dedupe: false,
    })
      .then((result) => {
        if (!isMounted) return;

        const nextApplications = result.applications || [];
        setApplications(nextApplications);
        setApplicationPagination(
          result.pagination || {
            limit: applicationPageSize,
            offset: (applicationPage - 1) * applicationPageSize,
            total: nextApplications.length,
          }
        );
        setApplicationFilterOptions(
          result.filters || { positions: [], locations: [], schools: [] }
        );
        setReviewNotes(
          Object.fromEntries(
            nextApplications.map((application) => [
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
            message: err.message || "Failed to load applicants.",
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingApplications(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    applicationPage,
    applicationPageSize,
    debouncedSearchTerm,
    selectedLocation,
    selectedPosition,
    showToast,
  ]);

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
    const nextSection = normalizeAdminSection(section);

    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set("section", nextSection);
      return nextParams;
    });
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
      changeActiveSection("job-posting");
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
    setReviewNotes((current) => ({
      ...current,
      [result.application.id]: result.application.reviewNotes || "",
    }));

    showToast({ type: "success", message: "Application status updated." });
    return { skipped: false, application: result.application };
  };

  const reviewApplicationRequirement = async (
    application,
    requirement,
    updates
  ) => {
    try {
      const result = await apiRequest(
        `/api/admin/applications/${application.id}/requirements/${requirement.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updates),
        }
      );

      setApplications((prev) =>
        prev.map((item) =>
          item.id === result.application.id ? result.application : item
        )
      );
      setViewApplication(result.application);
      setReviewNotes((current) => ({
        ...current,
        [result.application.id]: result.application.reviewNotes || "",
      }));
      showToast({ type: "success", message: "Requirement review saved." });

      return result.application;
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to save requirement review.",
      });
      throw err;
    }
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
    return Array.from(
      new Set((positions || []).map((position) => position.title).filter(Boolean))
    ).sort();
  }, [positions]);

  const schools = useMemo(() => {
    return (
      applicationFilterOptions.schools ||
      applicationFilterOptions.locations ||
      []
    )
      .filter(Boolean)
      .sort();
  }, [applicationFilterOptions.locations, applicationFilterOptions.schools]);

  const filteredApplications = applications;

  const contentPadding = getSidebarContentPadding(isSidebarCollapsed);
  const currentPage = adminPageMeta[activeSection] || adminPageMeta["job-posting"];

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
            <h1 className="oas-page-title">{currentPage.title}</h1>
            <p className="oas-page-description">{currentPage.description}</p>
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
              isLoading={isLoadingApplications}
              filteredApplications={filteredApplications}
              positions={applicationPositions}
              schools={schools}
              selectedPosition={selectedPosition}
              selectedLocation={selectedLocation}
              searchTerm={searchTerm}
              setSelectedPosition={(value) => {
                setSelectedPosition(value);
                setApplicationPage(1);
              }}
              setSelectedLocation={(value) => {
                setSelectedLocation(value);
                setApplicationPage(1);
              }}
              setSearchTerm={setSearchTerm}
              setViewApplication={setViewApplication}
              updateApplicationStatus={updateApplicationStatus}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              pagination={applicationPagination}
              page={applicationPage}
              pageSize={applicationPageSize}
              onPageChange={setApplicationPage}
              onPageSizeChange={(nextSize) => {
                setApplicationPageSize(nextSize);
                setApplicationPage(1);
              }}
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

          {activeSection === "activity-logs" && <ActivityLogSection />}
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
          key={`${viewApplication.id}-${viewApplication.updatedAt || ""}`}
          application={viewApplication}
          onClose={() => setViewApplication(null)}
          formatDate={formatDate}
          getApplicantName={getApplicantName}
          getApplicantEmail={getApplicantEmail}
          getApplicationPosition={getApplicationPosition}
          getApplicationLocation={getApplicationLocation}
          getApplicationDate={getApplicationDate}
          onReviewRequirement={reviewApplicationRequirement}
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
            <SchoolOfficePicker
              value={form.school}
              schools={schools}
              disabled={!form.district}
              placeholder={
                form.district ? "Type school / office name" : "Select district first"
              }
              selectPlaceholder={
                form.district ? "Choose from school list" : "Select district first"
              }
              onChange={handleSchoolChange}
              onDelete={() => {
                handleFormChange("school", "");
                handleFormChange("barangay", "");
              }}
              error={errors.school}
            />
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

function SchoolOfficePicker({
  value,
  schools = [],
  disabled = false,
  placeholder = "Type school / office name",
  selectPlaceholder = "Choose from school list",
  onChange,
  onDelete,
  error = "",
}) {
  const selectedSchool = schools.find((school) => school.name === value);
  const canDelete = Boolean(value) && !disabled;

  return (
    <div className="grid gap-2">
      <select
        value={selectedSchool ? selectedSchool.name : ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label="Change school / office from list"
        aria-invalid={Boolean(error)}
        className={getControlClass(error, disabledInputControlClass)}
      >
        <option value="">{selectPlaceholder}</option>
        {schools.map((school) => (
          <option key={school.name} value={school.name}>
            {school.name} - {school.barangay}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Pencil className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            aria-label="Edit school / office name"
            aria-invalid={Boolean(error)}
            className={`${getControlClass(
              error,
              disabledInputControlClass
            )} pl-9`}
          />
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title="Delete current school / office selection"
          aria-label="Delete current school / office selection"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
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
              <span
                className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] uppercase ${
                  requirement.required === false
                    ? "bg-slate-100 text-slate-600"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {requirement.required === false ? "Optional" : "Required"}
              </span>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleJobs = useMemo(
    () => jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, jobs, pageSize]
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

  const updateJobStatus = (job, status) =>
    updateJob(job, { status })
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
      );

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

      <div className="grid gap-2 p-2 sm:p-4 md:hidden">
        {visibleJobs.map((job) => (
          <article
            key={job.id}
            className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
          >
            <div className="min-w-0">
              <h3 className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                {job.title}
              </h3>
              <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                {job.location || "Location not set"}
              </p>
            </div>

            <dl className="mt-3 grid gap-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Vacancies</dt>
                <dd className="font-semibold text-slate-900">{job.vacancy}</dd>
              </div>

              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-slate-500">Deadline</dt>
                <dd className="text-right font-semibold text-slate-900">
                  {formatDate(job.deadline)} {job.deadlineTime || ""}
                </dd>
              </div>
            </dl>

            <select
              value={job.status}
              onChange={(event) => updateJobStatus(job, event.target.value)}
              className="mt-3 h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openEditJob(job)}
                className="oas-action-button oas-card-action-button"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => setJobToDelete(job)}
                className="oas-danger-button oas-card-action-button"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
            {visibleJobs.map((job) => (
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
                      updateJobStatus(job, event.target.value)
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

      <PaginationControls
        page={currentPage}
        pageSize={pageSize}
        totalItems={jobs.length}
        currentCount={visibleJobs.length}
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
        pageSizeOptions={tablePageSizeOptions}
        itemLabel="job openings"
      />

      {editingJob && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92dvh]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold text-slate-900 [overflow-wrap:anywhere]">
                  Edit Job Opening
                </h3>
                <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Update the posting details applicants will see.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditJob}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close edit job opening"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={saveEditedJob}
              className="grid min-h-0 gap-4 overflow-y-auto px-4 py-5 sm:px-6"
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
                  <SchoolOfficePicker
                    value={editForm.school}
                    schools={schools}
                    disabled={!editForm.district}
                    placeholder={
                      editForm.district
                        ? "Type school / office name"
                        : "Select district first"
                    }
                    selectPlaceholder={
                      editForm.district
                        ? "Choose from school list"
                        : "Select district first"
                    }
                    onChange={updateEditSchool}
                    onDelete={() => {
                      updateEditField("school", "");
                      updateEditField("barangay", "");
                    }}
                    error={editErrors.school}
                  />
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

              <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 pt-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
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
  const [isPositionFormOpen, setIsPositionFormOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPositionPageSize);
  const { showToast } = useToast();
  const totalPages = Math.max(1, Math.ceil(positions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePositions = useMemo(
    () => positions.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, positions]
  );

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    clearErrorField(setPositionErrors, field);
  };

  const resetDraft = () => {
    setDraft(emptyPosition);
    setEditingId(null);
    setIsPositionFormOpen(false);
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

  const openAddPosition = () => {
    setDraft(emptyPosition);
    setEditingId(null);
    setPositionErrors({});
    setIsPositionFormOpen(true);
  };

  const editPosition = (position) => {
    setEditingId(position.id);
    setDraft({
      category: position.category || "Teaching",
      title: position.title || "",
      requirements: position.requirements || [],
    });
    setPositionErrors({});
    setIsPositionFormOpen(true);
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

  const isEditingPosition = Boolean(editingId);
  const isPositionFormModalOpen = isPositionFormOpen || isEditingPosition;
  const positionModalTitle = isEditingPosition ? "Edit Position" : "Add Position";
  const positionModalDescription = isEditingPosition
    ? "Update the category, title, and upload requirements for this position."
    : "Create a position applicants can select when job openings are posted.";
  const positionFormFields = (
    <div className="grid gap-4">
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

      <JobFormField label="Position Title" error={positionErrors.title} required>
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
                  updateRequirement(index, "description", event.target.value)
                }
                placeholder="Short instruction or description"
                className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={requirement.required !== false}
                    onChange={(event) =>
                      updateRequirement(index, "required", event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  Required from applicant
                </label>

                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="oas-danger-button"
                >
                  Remove requirement
                </button>
              </div>
            </div>
          ))}

          {(draft.requirements || []).length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
              Add upload requirements applicants must submit for this position.
            </p>
          )}

          {(draft.requirements || []).length > 0 && (
            <button
              type="button"
              onClick={addRequirement}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add another requirement
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section className="oas-panel">
        <div className="oas-panel-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="oas-panel-title">Position Library</h2>
            <p className="mt-1 text-sm text-slate-500">
              These positions can be selected when creating job openings.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddPosition}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </button>
        </div>

        {positions.length === 0 ? (
          <EmptyState label="No positions added yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {visiblePositions.map((position) => (
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

        <PaginationControls
          page={currentPage}
          pageSize={pageSize}
          totalItems={positions.length}
          currentCount={visiblePositions.length}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
          pageSizeOptions={positionPageSizeOptions}
          itemLabel="positions"
        />
      </section>

      {isPositionFormModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/50 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="position-form-title"
        >
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h3
                  id="position-form-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {positionModalTitle}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {positionModalDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={resetDraft}
                disabled={isSaving}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-60"
                aria-label="Close position form modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={savePosition}
              className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6"
              noValidate
            >
              {positionFormFields}

              <div className="sticky bottom-0 -mx-4 mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={isSaving}
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel
                </button>

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
                  {isEditingPosition ? "Save Changes" : "Add Position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
  schools,
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
  pagination,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  statusLabels,
  formatDate,
  getApplicationDate,
  getApplicationPosition,
  getApplicationLocation,
  getApplicantName,
  getApplicantEmail,
}) {
  const { showToast } = useToast();
  const hasFilters =
    Boolean(searchTerm.trim()) ||
    selectedPosition !== "all" ||
    selectedLocation !== "all";

  return (
    <section className="oas-panel">
      <div className="oas-panel-header">
        <h2 className="oas-panel-title">Applicant List</h2>

        <p className="mt-1 text-sm text-slate-500">
          View all applicants, filter by position or school, and open each
          applicant&apos;s application form.
        </p>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search applicants"
              aria-label="Search applicants by name, UAN, email, or position"
              className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:rounded-xl sm:text-sm"
            />
          </div>

          <select
            value={selectedPosition}
            onChange={(event) => setSelectedPosition(event.target.value)}
            aria-label="Filter by position"
            className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:rounded-xl sm:px-3 sm:text-sm"
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
            aria-label="Filter by school"
            className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:rounded-xl sm:px-3 sm:text-sm"
          >
            <option value="all">All Schools</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedPosition("all");
                setSelectedLocation("all");
              }}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 sm:col-span-1 sm:justify-self-end sm:px-4 sm:text-sm lg:h-11"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {!isLoading && filteredApplications.length > 0 && (
        <div className="grid gap-2 p-2 sm:p-4 md:hidden">
          {filteredApplications.map((application) => {
            const isReviewNoteLocked = isApplicationStatusFinal(
              application.status
            );

            return (
              <article
                key={application.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  {application.uan || "No UAN"}
                </p>
                <h3 className="mt-1 break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                  {getApplicantName(application)}
                </h3>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {getApplicantEmail(application)}
                </p>
              </div>

              <dl className="mt-3 grid gap-2 text-xs">
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                  <dt className="font-semibold text-slate-500">Position</dt>
                  <dd className="break-words text-right font-semibold text-slate-900 [overflow-wrap:anywhere]">
                    {getApplicationPosition(application)}
                  </dd>
                </div>

                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                  <dt className="font-semibold text-slate-500">Location</dt>
                  <dd className="break-words text-right font-semibold text-slate-900 [overflow-wrap:anywhere]">
                    {getApplicationLocation(application)}
                  </dd>
                </div>

                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
                  <dt className="font-semibold text-slate-500">Date Applied</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {formatDate(getApplicationDate(application))}
                  </dd>
                </div>
              </dl>

              <select
                value={application.status}
                disabled={isApplicationStatusFinal(application.status)}
                onChange={(event) =>
                  updateApplicationStatus(application, event.target.value).catch(
                    (err) =>
                      showToast({
                        type: "error",
                        message: err.message || "Failed to update application.",
                      })
                  )
                }
                className={`mt-3 h-9 w-full cursor-pointer rounded-lg border px-3 text-xs font-semibold outline-none transition ${getStatusBadgeClass(
                  application.status
                )} disabled:cursor-not-allowed disabled:opacity-80`}
              >
                {getApplicationStatusOptions(application.status).map((value) => (
                  <option
                    key={value}
                    value={value}
                    className={`font-semibold ${getStatusOptionClass(value)}`}
                  >
                    {statusLabels[value]}
                  </option>
                ))}
              </select>

                <textarea
                  value={
                    reviewNotes[application.id] ?? application.reviewNotes ?? ""
                  }
                  disabled={isReviewNoteLocked}
                  onChange={(event) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [application.id]: event.target.value,
                    }))
                  }
                  placeholder="Notes from HR"
                  className="mt-2 min-h-14 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />

                <button
                  type="button"
                  onClick={() => setViewApplication(application)}
                  className="oas-action-button oas-card-action-button mt-2"
                >
                  View
                </button>
              </article>
            );
          })}
        </div>
      )}

      <div className="hidden overflow-x-auto md:block">
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
            {filteredApplications.map((application) => {
              const isReviewNoteLocked = isApplicationStatusFinal(
                application.status
              );

              return (
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
                    disabled={isApplicationStatusFinal(application.status)}
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
                    )} disabled:cursor-not-allowed disabled:opacity-80`}
                  >
                    {getApplicationStatusOptions(application.status).map((value) => (
                      <option
                        key={value}
                        value={value}
                        className={`font-semibold ${getStatusOptionClass(
                          value
                        )}`}
                      >
                        {statusLabels[value]}
                      </option>
                    ))}
                  </select>

                    <textarea
                      value={
                        reviewNotes[application.id] ??
                        application.reviewNotes ??
                        ""
                      }
                      disabled={isReviewNoteLocked}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [application.id]: event.target.value,
                        }))
                      }
                      placeholder="Notes from HR"
                      className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
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
              );
            })}
          </tbody>
        </table>

      </div>

      {!isLoading && filteredApplications.length === 0 && (
        <EmptyState label="No applicants found." />
      )}

      {isLoading && <LoadingState label="Loading applicants..." />}

      {!isLoading && filteredApplications.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={pagination?.total || filteredApplications.length}
          currentCount={filteredApplications.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={applicantPageSizeOptions}
          itemLabel="applicants"
        />
      )}
    </section>
  );
}

function JobListingSection({ jobs, isLoading, formatDate }) {
  const [viewJob, setViewJob] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleJobs = useMemo(
    () => jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, jobs, pageSize]
  );

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
        <div className="grid gap-3 p-4 sm:gap-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleJobs.map((job) => (
            <article
              key={job.id}
              className="oas-panel flex h-full min-w-0 flex-col p-4 transition hover:border-blue-200 hover:shadow-md sm:p-5"
            >
              <div className="min-w-0">
                <h3 className="line-clamp-2 min-h-0 break-words text-sm font-bold leading-5 text-slate-900 [overflow-wrap:anywhere] sm:min-h-[2.5rem] sm:text-base">
                  {job.title}
                </h3>

                <p className="mt-1 line-clamp-2 min-h-0 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] sm:min-h-[2.5rem] sm:text-sm">
                  {job.location}
                </p>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:mt-4 sm:text-sm">
                <p className="truncate">
                  <span className="font-semibold">Vacancy:</span>{" "}
                  <span>{job.vacancy}</span>
                </p>

                <p className="truncate">
                  <span className="font-semibold">Deadline:</span>{" "}
                  {formatDate(job.deadline)} {job.deadlineTime || ""}
                </p>
              </div>

              <div className="mt-auto flex justify-end pt-4 sm:pt-5">
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

      {!isLoading && jobs.length > 0 && (
        <PaginationControls
          page={currentPage}
          pageSize={pageSize}
          totalItems={jobs.length}
          currentCount={visibleJobs.length}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
          pageSizeOptions={cardPageSizeOptions}
          itemLabel="job openings"
        />
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
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92vh]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold leading-6 text-slate-900 [overflow-wrap:anywhere] sm:text-xl">
              {job.title}
            </h3>
            <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere] sm:text-sm">
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

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryItem label="Vacancies" value={job.vacancy} />
            <SummaryItem
              label="Application Deadline"
              value={`${formatDate(job.deadline)} ${job.deadlineTime || ""}`}
            />
            <SummaryItem label="Status" value={job.status} />
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:mt-5 sm:rounded-xl sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">Description</h4>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere] sm:mt-3 sm:text-sm sm:leading-6">
              {job.description || "No description provided yet."}
            </p>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:mt-5 sm:rounded-xl sm:p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Upload Requirements
            </h4>

            {job.requirements?.length > 0 ? (
              <ul className="mt-3 space-y-2.5">
                {job.requirements.map((requirement) => (
                  <li
                    key={requirement.field}
                    className="border-b border-slate-200 pb-2.5 text-xs last:border-b-0 last:pb-0 sm:text-sm"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <p className="min-w-0 break-words font-semibold text-slate-800 [overflow-wrap:anywhere]">
                        {requirement.label}
                      </p>
                      {requirement.required === false && (
                        <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">
                          Optional
                        </span>
                      )}
                    </div>
                    {requirement.description && (
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                        {requirement.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
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
  onReviewRequirement,
}) {
  const [previewFile, setPreviewFile] = useState(null);
  const requirements = Array.isArray(application.requirements)
    ? application.requirements
    : [];
  const [requirementDrafts, setRequirementDrafts] = useState(() =>
    buildRequirementDrafts(requirements)
  );
  const [savingRequirementId, setSavingRequirementId] = useState(null);
  const applicationData =
    application.raw ||
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

  const updateRequirementDraft = (requirement, field, value) => {
    const draftKey = String(requirement.id || requirement.field);

    setRequirementDrafts((current) => ({
      ...current,
      [draftKey]: {
        ...(current[draftKey] || {
          status: requirement.status || "pending",
          remarks: requirement.remarks || "",
        }),
        [field]: value,
      },
    }));
  };

  const saveRequirementReview = async (requirement) => {
    if (!onReviewRequirement) return;

    const draftKey = String(requirement.id || requirement.field);
    const draft = requirementDrafts[draftKey] || {
      status: requirement.status || "pending",
      remarks: requirement.remarks || "",
    };

    setSavingRequirementId(draftKey);

    try {
      await onReviewRequirement(application, requirement, {
        status: draft.status,
        remarks: draft.remarks,
      });
    } catch {
      // Toast is handled by the parent updater.
    } finally {
      setSavingRequirementId(null);
    }
  };

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
              {application.uan || "No UAN"} /{" "}
              {getApplicationPosition(application)} /{" "}
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

              {requirements.length > 0 ? (
                <div className="mt-4">
                  <h5 className="text-sm font-bold text-slate-800">
                    Submitted Requirements
                  </h5>

                  <div className="mt-3 space-y-3">
                    {requirements.map((requirement) => {
                      const draftKey = String(
                        requirement.id || requirement.field
                      );
                      const draft = requirementDrafts[draftKey] || {
                        status: requirement.status || "pending",
                        remarks: requirement.remarks || "",
                      };
                      const requirementFile = requirement.file;
                      const isSaving = savingRequirementId === draftKey;
                      const hasChanges =
                        draft.status !== (requirement.status || "pending") ||
                        draft.remarks !== (requirement.remarks || "");

                      return (
                        <div
                          key={draftKey}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">
                                  {requirement.label || requirement.field}
                                  {requirement.required ? (
                                    <span className="ml-1 text-red-600">*</span>
                                  ) : null}
                                </p>
                                <span
                                  className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getRequirementReviewStatusClass(
                                    requirement.status
                                  )}`}
                                >
                                  {requirementReviewStatusLabels[
                                    requirement.status
                                  ] ||
                                    requirement.status ||
                                    "Pending"}
                                </span>
                              </div>

                              <p className="mt-1 break-words text-sm text-slate-600 [overflow-wrap:anywhere]">
                                {getRequirementFileName(requirementFile)}
                              </p>

                              {requirementFile?.previewUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewFile({
                                      ...requirementFile,
                                      name: getRequirementFileName(
                                        requirementFile
                                      ),
                                    })
                                  }
                                  className="mt-2 text-sm font-semibold text-blue-700 hover:underline"
                                >
                                  View document
                                </button>
                              )}
                            </div>

                            <div className="grid min-w-0 gap-2 sm:grid-cols-[190px_minmax(0,1fr)_auto] lg:w-[560px]">
                              <select
                                value={draft.status}
                                onChange={(event) =>
                                  updateRequirementDraft(
                                    requirement,
                                    "status",
                                    event.target.value
                                  )
                                }
                                className={`h-10 rounded-lg border px-3 text-sm font-semibold outline-none ${getRequirementReviewStatusClass(
                                  draft.status
                                )}`}
                              >
                                {requirementReviewStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {requirementReviewStatusLabels[status]}
                                  </option>
                                ))}
                              </select>

                              <textarea
                                value={draft.remarks}
                                onChange={(event) =>
                                  updateRequirementDraft(
                                    requirement,
                                    "remarks",
                                    event.target.value
                                  )
                                }
                                placeholder="Remarks for this requirement"
                                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              <button
                                type="button"
                                onClick={() => saveRequirementReview(requirement)}
                                disabled={
                                  isSaving || !hasChanges || !onReviewRequirement
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-3 text-sm font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:bg-slate-300"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
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
                            {getRequirementFileName(file)}
                          </p>

                          {(file?.previewUrl || file?.dataUrl) && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewFile({
                                  ...file,
                                  name: getRequirementFileName(file),
                                })
                              }
                              className="mt-2 text-sm font-semibold text-blue-700 hover:underline"
                            >
                              View document
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No attachments found.
                      </p>
                    )}
                  </div>
                </div>
              )}
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

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
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
