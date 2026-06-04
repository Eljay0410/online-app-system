import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import ActivityLogSection from "./ActivityLogSection";
import ApplicantManagement from "./ApplicantManagement";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import DateFilterControl from "../../components/ui/DateFilterControl";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirements,
} from "../../lib/applicationRequirements";
import {
  formatTime,
  VacancyDetailsContent,
} from "../jobs/jobPostingUi";

const emptyJob = {
  title: "",
  location: "",
  positionId: "",
  positionCategory: "",
  salaryGrade: "",
  salaryAmount: "",
  education: "",
  training: "",
  experience: "",
  eligibility: "",
  vacancyItems: [{ schoolStation: "", subjectArea: "", vacancyCount: 1 }],
  vacancy: 1,
  deadline: "",
  deadlineTime: "23:59",
  status: "open",
  description: "",
};

const emptyPosition = {
  category: "Teaching",
  title: "",
};

const statusLabels = {
  draft: "Draft",
  submitted: "Pending Review",
  reviewed: "Reviewed",
  qualified: "Qualified (Screened)",
  disqualified: "Disqualified",
  shortlisted: "Shortlisted",
  selected: "Selected",
  rejected: "Rejected",
  hired: "Hired (Final)",
  pending_review: "Pending Review",
  for_compliance: "Pending Review",
  under_review: "Under Review",
};

const statusFilterOptions = [
  "submitted",
  "reviewed",
  "qualified",
  "disqualified",
  "shortlisted",
  "selected",
  "rejected",
  "hired",
].map((status) => [status, statusLabels[status]]);

const applicationStatusTransitions = {
  draft: ["submitted", "rejected"],
  submitted: ["reviewed", "qualified", "disqualified", "rejected"],
  reviewed: ["qualified", "shortlisted", "disqualified", "rejected"],
  pending_review: ["reviewed", "qualified", "disqualified", "rejected"],
  for_compliance: ["reviewed", "qualified", "disqualified", "rejected"],
  under_review: ["reviewed", "qualified", "disqualified", "rejected"],
  qualified: ["shortlisted", "selected", "hired", "disqualified", "rejected"],
  shortlisted: ["selected", "hired", "disqualified", "rejected"],
  selected: ["hired", "disqualified", "rejected"],
  rejected: [],
  hired: [],
  disqualified: [],
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
  "applicant-management",
  "job-listing",
  "activity-logs",
]);
const defaultApplicationPageSize = 10;
const applicantPageSizeOptions = [10, 25, 50];
const cardPageSizeOptions = [6, 9, 12];
const tablePageSizeOptions = [10, 25, 50];
const defaultPositionPageSize = 10;
const positionPageSizeOptions = [10, 25, 50];

const adminPageMeta = {
  "job-posting": {
    title: "Manage Vacancies",
    description: "Create, update, and monitor vacancy postings in one place.",
  },
  positions: {
    title: "Positions",
    description: "Manage reusable position titles for vacancy postings.",
  },
  "applicant-list": {
    title: "Applicant List",
    description: "Review applicants, update statuses, and record HR remarks.",
  },
  "applicant-management": {
    title: "Applicant Management",
    description: "View applicant accounts and edit safe basic profile information.",
  },
  "job-listing": {
    title: "Vacancies",
    description: "View all posted vacancies and their published details.",
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

  if (normalizedStatus === "pending_review" || normalizedStatus === "reviewed") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (normalizedStatus === "for_compliance") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "under_review" || normalizedStatus === "shortlisted") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "qualified") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  if (normalizedStatus === "selected") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "hired") {
    return "border-teal-300 bg-teal-50 text-teal-800";
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "denied" ||
    normalizedStatus === "disqualified"
  ) {
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

  if (normalizedStatus === "pending_review" || normalizedStatus === "reviewed") {
    return "bg-indigo-50 text-indigo-700";
  }

  if (normalizedStatus === "for_compliance") {
    return "bg-orange-50 text-orange-700";
  }

  if (normalizedStatus === "under_review" || normalizedStatus === "shortlisted") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalizedStatus === "qualified") {
    return "bg-sky-50 text-sky-700";
  }

  if (normalizedStatus === "selected") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalizedStatus === "hired") {
    return "bg-teal-50 text-teal-800";
  }

  if (
    normalizedStatus === "rejected" ||
    normalizedStatus === "denied" ||
    normalizedStatus === "disqualified"
  ) {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-slate-50 text-slate-700";
}

function getRequirementFileName(file) {
  return file?.name || file?.fileName || file?.filename || "No file attached";
}

function formatUanDisplay(value) {
  const rawValue = String(value || "").trim();
  if (!rawValue) return "No UAN";

  return rawValue.replace(/^UAN[-:\s]*/i, "") || rawValue;
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

function validateJobOpeningForm(form) {
  const errors = {};
  const vacancyItems = Array.isArray(form.vacancyItems)
    ? form.vacancyItems
    : [];

  if (!form.positionId) {
    errors.positionId = "Select a position from the Position Library.";
  }

  if (!String(form.salaryGrade || "").trim()) {
    errors.salaryGrade = "Salary grade is required.";
  }

  if (!String(form.salaryAmount || "").trim()) {
    errors.salaryAmount = "Salary amount is required.";
  }

  if (!String(form.education || "").trim()) {
    errors.education = "Education standard is required.";
  }

  if (!String(form.training || "").trim()) {
    errors.training = "Training standard is required.";
  }

  if (!String(form.experience || "").trim()) {
    errors.experience = "Experience standard is required.";
  }

  if (!String(form.eligibility || "").trim()) {
    errors.eligibility = "Eligibility standard is required.";
  }

  if (vacancyItems.length === 0) {
    errors.vacancyItems = "At least one school/station vacancy item is required.";
  } else {
    const itemErrors = vacancyItems.map((item) => {
      const itemError = {};
      const count = Number(item.vacancyCount);

      if (!String(item.schoolStation || "").trim()) {
        itemError.schoolStation = "School/station is required.";
      }

      if (!Number.isFinite(count) || count < 1) {
        itemError.vacancyCount = "Vacancy count must be at least 1.";
      }

      return itemError;
    });

    if (itemErrors.some((item) => Object.keys(item).length > 0)) {
      errors.vacancyItems = itemErrors;
    }
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

  if (!String(form.category || "").trim()) {
    errors.category = "Category is required.";
  }

  if (!String(form.title || "").trim()) {
    errors.title = "Position title is required.";
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
  if (field === "deadline") return getDateInputValue(value);
  if (field === "deadlineTime") return String(value || "").slice(0, 5);
  if (field === "requirements" || field === "vacancyItems") {
    return JSON.stringify(value || []);
  }

  if (typeof value === "boolean") return value;
  return String(value ?? "").trim();
}

function normalizeAdminApplication(application = {}, fallback = {}) {
  return {
    ...fallback,
    ...application,
    status: application.status || fallback.status || "submitted",
    reviewNotes: application.reviewNotes ?? fallback.reviewNotes ?? "",
    requirements: Array.isArray(application.requirements)
      ? application.requirements
      : Array.isArray(fallback.requirements)
        ? fallback.requirements
        : [],
    jobRequirements: Array.isArray(application.jobRequirements)
      ? application.jobRequirements
      : Array.isArray(fallback.jobRequirements)
        ? fallback.jobRequirements
        : [],
    jobItems: Array.isArray(application.jobItems)
      ? application.jobItems
      : Array.isArray(fallback.jobItems)
        ? fallback.jobItems
        : [],
  };
}

function hasPatchChanges(source = {}, updates = {}) {
  return Object.entries(updates).some(
    ([field, value]) =>
      normalizeComparableValue(field, source[field]) !==
      normalizeComparableValue(field, value)
  );
}

function hasPositionChanges(source = {}, next = {}) {
  return ["category", "title"].some(
    (field) =>
      normalizeComparableValue(field, source[field]) !==
      normalizeComparableValue(field, next[field])
  );
}

function getVacancyTotal(items = []) {
  return (items || []).reduce(
    (sum, item) => sum + Math.max(0, Number(item.vacancyCount) || 0),
    0
  );
}

function summarizeVacancyLocation(items = []) {
  const stations = Array.from(
    new Set(
      (items || [])
        .map((item) => String(item.schoolStation || "").trim())
        .filter(Boolean)
    )
  );

  if (stations.length <= 3) return stations.join(", ");
  return `${stations.slice(0, 3).join(", ")} +${stations.length - 3} more`;
}

function getPositionRequirements(position, category = "", title = "") {
  if (Array.isArray(position?.requirements) && position.requirements.length > 0) {
    return position.requirements;
  }

  return getFixedApplicationRequirements(
    position?.category || category,
    position?.title || title
  );
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");
  const activeSection = normalizeAdminSection(sectionParam);
  const applicationListRequestIdRef = useRef(0);
  const applicationDetailRequestIdRef = useRef(0);
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
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
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
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [viewApplication, setViewApplication] = useState(null);
  const [isLoadingApplicationDetail, setIsLoadingApplicationDetail] =
    useState(false);

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
    const controller = new AbortController();
    const requestId = applicationListRequestIdRef.current + 1;
    applicationListRequestIdRef.current = requestId;
    const params = new URLSearchParams({
      limit: String(applicationPageSize),
      page: String(applicationPage),
    });

    if (debouncedSearchTerm) params.set("q", debouncedSearchTerm);
    if (selectedPosition !== "all") {
      if (/^\d+$/.test(String(selectedPosition))) {
        params.set("positionId", selectedPosition);
      } else {
        params.set("position", selectedPosition);
      }
    }
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedDate) {
      params.set("date", selectedDate);
    } else {
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
    }

    queueMicrotask(() => {
      if (isMounted && requestId === applicationListRequestIdRef.current) {
        setIsLoadingApplications(true);
      }
    });
    apiRequest(`/api/admin/applications?${params.toString()}`, {
      dedupe: false,
      signal: controller.signal,
    })
      .then((result) => {
        if (!isMounted || requestId !== applicationListRequestIdRef.current) {
          return;
        }

        const nextApplications = result.applications || result.data || [];
        setApplications(nextApplications);
        setApplicationPagination(
          result.pagination || {
            limit: applicationPageSize,
            offset: (applicationPage - 1) * applicationPageSize,
            total: nextApplications.length,
            totalRecords: nextApplications.length,
            totalPages: 1,
          }
        );
        if (
          result.pagination?.page &&
          result.pagination.page !== applicationPage
        ) {
          setApplicationPage(result.pagination.page);
        }
        setApplicationFilterOptions(
          result.filters || { positions: [], locations: [], schools: [] }
        );
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (isMounted && requestId === applicationListRequestIdRef.current) {
          showToast({
            type: "error",
            message: err.message || "Failed to load applicants.",
          });
        }
      })
      .finally(() => {
        if (isMounted && requestId === applicationListRequestIdRef.current) {
          setIsLoadingApplications(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    applicationPage,
    applicationPageSize,
    dateFrom,
    dateTo,
    debouncedSearchTerm,
    selectedDate,
    selectedPosition,
    selectedStatus,
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
        message: "Please complete the highlighted vacancy fields.",
      });
      return;
    }

    setIsSaving(true);
    setFormErrors({});

    try {
      const selectedPositionRecord = positions.find(
        (position) => String(position.id) === String(form.positionId)
      );
      const vacancyItems = Array.isArray(form.vacancyItems)
        ? form.vacancyItems
        : [];
      const vacancyTotal = getVacancyTotal(vacancyItems);
      const vacancyLocation = summarizeVacancyLocation(vacancyItems);

      const result = await apiRequest("/api/admin/job-openings", {
        method: "POST",
        body: JSON.stringify({
          positionId: form.positionId ? Number(form.positionId) : null,
          positionCategory:
            selectedPositionRecord?.category || form.positionCategory,
          title: selectedPositionRecord?.title || form.title,
          location: vacancyLocation,
          vacancy: vacancyTotal,
          vacancyItems,
          requirements: getPositionRequirements(
            selectedPositionRecord,
            form.positionCategory,
            form.title
          ),
          deadline: form.deadline,
          deadlineTime: form.deadlineTime,
          salaryGrade: form.salaryGrade,
          salaryAmount: form.salaryAmount,
          education: form.education,
          training: form.training,
          experience: form.experience,
          eligibility: form.eligibility,
          status: form.status,
          description: form.description,
        }),
      });

      setJobs((prev) => [result.job, ...prev]);
      setForm(emptyJob);
      setFormErrors({});
      setIsCreateJobOpen(false);
      showToast({ type: "success", message: "Vacancy posted." });
      changeActiveSection("job-posting");
    } catch (err) {
      const message = err.message || "Failed to post vacancy.";
      setFormErrors((current) => ({ ...current, form: message }));
      showToast({
        type: "error",
        message,
      });

      apiRequest("/api/admin/job-positions", { dedupe: false })
        .then((positionResult) => {
          setPositions(positionResult.positions || []);
        })
        .catch(() => {});
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

      showToast({ type: "success", message: "Vacancy deleted." });
      setJobToDelete(null);
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to delete vacancy.",
      });
    }
  };

  const updateApplicationStatus = async (application, status, reviewNote = "") => {
    const normalizedReviewNote = String(reviewNote || "").trim();
    const statusChanged =
      normalizeComparableValue("status", application.status) !==
      normalizeComparableValue("status", status);
    const reviewNoteChanged =
      normalizeComparableValue("reviewNotes", application.reviewNotes) !==
      normalizeComparableValue("reviewNotes", normalizedReviewNote);

    if (!statusChanged && !reviewNoteChanged) {
      showToast({ type: "info", message: "No changes were made." });
      return { skipped: true, application };
    }

    const result = await apiRequest(
      `/api/admin/applications/${application.id}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNotes: normalizedReviewNote,
        }),
      }
    );

    const updatedApplication = result.application;

    if (!updatedApplication?.id) {
      throw new Error("Status update did not return the updated application.");
    }

    const normalizedApplication = normalizeAdminApplication(
      updatedApplication,
      application
    );

    setApplications((prev) =>
      prev.map((item) =>
        item.id === application.id ? normalizedApplication : item
      )
    );
    setViewApplication((current) =>
      current?.id === application.id
        ? normalizeAdminApplication(updatedApplication, current)
        : current
    );
    showToast({
      type: "success",
      message: result.notification?.emailSent
        ? "Application updated and applicant notified."
        : "Application update saved.",
    });
    return { skipped: false, application: normalizedApplication };
  };

  const openApplicationDetails = async (application) => {
    const controller = new AbortController();
    const requestId = applicationDetailRequestIdRef.current + 1;
    applicationDetailRequestIdRef.current = requestId;

    setIsLoadingApplicationDetail(true);
    setViewApplication(null);

    try {
      const result = await apiRequest(`/api/admin/applications/${application.id}`, {
        dedupe: false,
        signal: controller.signal,
      });

      if (requestId !== applicationDetailRequestIdRef.current) return;

      setViewApplication(
        normalizeAdminApplication(result.application || application, application)
      );
    } catch (err) {
      if (err?.name !== "AbortError") {
        showToast({
          type: "error",
          message: err.message || "Failed to load application details.",
        });
      }
    } finally {
      if (requestId === applicationDetailRequestIdRef.current) {
        setIsLoadingApplicationDetail(false);
      }
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

  const applicationPositionOptions = useMemo(() => {
    const libraryOptions = (positions || [])
      .filter((position) => position?.id && position?.title)
      .map((position) => ({
        id: String(position.id),
        title: position.title,
      }));

    if (libraryOptions.length > 0) {
      return libraryOptions.sort((a, b) => a.title.localeCompare(b.title));
    }

    return (applicationFilterOptions.positions || [])
      .filter(Boolean)
      .map((position) =>
        typeof position === "object"
          ? {
              id: String(position.id || position.positionId || position.title || ""),
              title: position.title || position.value || "Position",
            }
          : {
              id: String(position),
              title: String(position),
            }
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [applicationFilterOptions.positions, positions]);

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
              positions={applicationPositionOptions}
              selectedPosition={selectedPosition}
              selectedStatus={selectedStatus}
              selectedDate={selectedDate}
              dateFrom={dateFrom}
              dateTo={dateTo}
              searchTerm={searchTerm}
              setSelectedPosition={(value) => {
                setSelectedPosition(value);
                setApplicationPage(1);
              }}
              setSelectedStatus={(value) => {
                setSelectedStatus(value);
                setApplicationPage(1);
              }}
              setSelectedDate={(value) => {
                setSelectedDate(value);
                setApplicationPage(1);
              }}
              setDateFrom={(value) => {
                setDateFrom(value);
                setApplicationPage(1);
              }}
              setDateTo={(value) => {
                setDateTo(value);
                setApplicationPage(1);
              }}
              setSearchTerm={setSearchTerm}
              onViewApplication={openApplicationDetails}
              openStatusUpdate={(application, status) =>
                setPendingStatusUpdate({ application, status })
              }
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

          {activeSection === "applicant-management" && (
            <ApplicantManagement />
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
              Delete Vacancy
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
        />
      )}

      {isLoadingApplicationDetail && (
        <LoadingOverlay label="Loading application details..." />
      )}

      {pendingStatusUpdate && (
        <ApplicationStatusUpdateModal
          update={pendingStatusUpdate}
          statusLabels={statusLabels}
          getApplicantName={getApplicantName}
          onClose={() => setPendingStatusUpdate(null)}
          onSave={updateApplicationStatus}
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
  const filteredPositions = positions.filter(
    (position) => position.category === form.positionCategory
  );
  const selectedPosition = positions.find(
    (item) => String(item.id) === String(form.positionId)
  );
  const selectedRequirements = getPositionRequirements(
    selectedPosition,
    form.positionCategory,
    form.title
  );
  const vacancyTotal = getVacancyTotal(form.vacancyItems);

  const handlePositionCategoryChange = (value) => {
    handleFormChange("positionCategory", value);
    handleFormChange("positionId", "");
    handleFormChange("title", "");
  };

  const handlePositionChange = (value) => {
    const position = positions.find(
      (item) => String(item.id) === String(value)
    );

    handleFormChange("positionId", value);
    handleFormChange("title", position?.title || "");
    handleFormChange("positionCategory", position?.category || form.positionCategory);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-4 sm:p-6">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
              Create Vacancy
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create one parent position posting with multiple school/station vacancy items.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close create vacancy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={createJob} className="flex min-h-0 flex-col" noValidate>
          <div className="grid min-h-0 gap-4 overflow-y-auto p-5">
            {errors.form && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                {errors.form}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <JobFormField label="Position Category" required>
                <select
                  value={form.positionCategory}
                  onChange={(event) =>
                    handlePositionCategoryChange(event.target.value)
                  }
                  className={getControlClass("", inputControlClass)}
                >
                  <option value="">Select category</option>
                  <option value="Teaching">Teaching</option>
                  <option value="Non-Teaching">Non-Teaching</option>
                </select>
              </JobFormField>

              <JobFormField label="Position Library" error={errors.positionId} required>
                <select
                  value={form.positionId}
                  onChange={(event) => handlePositionChange(event.target.value)}
                  disabled={!form.positionCategory}
                  className={disabledInputControlClass}
                >
                  <option value="">
                    {form.positionCategory
                      ? "Select saved position"
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

            <JobFormField label="Position Title">
              <input
                value={form.title}
                disabled
                placeholder="Select a Position Library item"
                className={disabledInputControlClass}
              />
            </JobFormField>

            <VacancyItemsEditor
              items={form.vacancyItems}
              errors={errors.vacancyItems}
              onChange={(items) => handleFormChange("vacancyItems", items)}
            />

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              No. of Vacant Items: {vacancyTotal}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <JobFormField label="Salary Grade" error={errors.salaryGrade} required>
                <input
                  value={form.salaryGrade}
                  onChange={(event) =>
                    handleFormChange("salaryGrade", event.target.value)
                  }
                  placeholder="Example: SG-18"
                  aria-invalid={Boolean(errors.salaryGrade)}
                  className={getControlClass(errors.salaryGrade, inputControlClass)}
                />
              </JobFormField>

              <JobFormField label="Salary Amount" error={errors.salaryAmount} required>
                <input
                  value={form.salaryAmount}
                  onChange={(event) =>
                    handleFormChange("salaryAmount", event.target.value)
                  }
                  placeholder="Example: PHP 49,015"
                  aria-invalid={Boolean(errors.salaryAmount)}
                  className={getControlClass(errors.salaryAmount, inputControlClass)}
                />
              </JobFormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <JobFormField label="Education" error={errors.education} required>
                <textarea
                  value={form.education}
                  onChange={(event) =>
                    handleFormChange("education", event.target.value)
                  }
                  aria-invalid={Boolean(errors.education)}
                  className={getControlClass(errors.education, textareaControlClass)}
                />
              </JobFormField>

              <JobFormField label="Training" error={errors.training} required>
                <textarea
                  value={form.training}
                  onChange={(event) =>
                    handleFormChange("training", event.target.value)
                  }
                  aria-invalid={Boolean(errors.training)}
                  className={getControlClass(errors.training, textareaControlClass)}
                />
              </JobFormField>

              <JobFormField label="Experience" error={errors.experience} required>
                <textarea
                  value={form.experience}
                  onChange={(event) =>
                    handleFormChange("experience", event.target.value)
                  }
                  aria-invalid={Boolean(errors.experience)}
                  className={getControlClass(errors.experience, textareaControlClass)}
                />
              </JobFormField>

              <JobFormField label="Eligibility" error={errors.eligibility} required>
                <textarea
                  value={form.eligibility}
                  onChange={(event) =>
                    handleFormChange("eligibility", event.target.value)
                  }
                  aria-invalid={Boolean(errors.eligibility)}
                  className={getControlClass(errors.eligibility, textareaControlClass)}
                />
              </JobFormField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
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

              <JobFormField label="Status" error={errors.status} required>
                <select
                  value={form.status}
                  onChange={(event) => handleFormChange("status", event.target.value)}
                  aria-invalid={Boolean(errors.status)}
                  className={getControlClass(errors.status, inputControlClass)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </JobFormField>
            </div>

            <JobFormField label="Description">
              <textarea
                value={form.description}
                onChange={(event) =>
                  handleFormChange("description", event.target.value)
                }
                placeholder="Optional posting notes"
                className={getControlClass("", textareaControlClass)}
              />
            </JobFormField>

            <RequirementPreview
              requirements={form.positionId ? selectedRequirements : []}
              emptyMessage="Select a Position Library item to show its List of Requirements."
            />

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
              Post Vacancy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobFormField({ label, required = false, error = "", children }) {
  const errorText = typeof error === "string" ? error : "";

  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </span>

      <span className="mt-2 block">{children}</span>
      {errorText && (
        <span className="mt-1.5 block text-[12px] font-semibold text-red-600">
          {errorText}
        </span>
      )}
    </label>
  );
}

function VacancyItemsEditor({ items = [], errors = [], onChange }) {
  const normalizedItems =
    items.length > 0
      ? items
      : [{ schoolStation: "", subjectArea: "", vacancyCount: 1 }];
  const itemErrors = Array.isArray(errors) ? errors : [];

  const updateItem = (index, field, value) => {
    onChange(
      normalizedItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => {
    onChange([
      ...normalizedItems,
      { schoolStation: "", subjectArea: "", vacancyCount: 1 },
    ]);
  };

  const removeItem = (index) => {
    if (normalizedItems.length === 1) return;
    onChange(normalizedItems.filter((_item, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          Add item
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {normalizedItems.map((item, index) => {
          const currentErrors = itemErrors[index] || {};

          return (
            <div
              key={item.id || index}
              className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_120px_auto]"
            >
              <JobFormField
                label="School / Station"
                error={currentErrors.schoolStation}
                required
              >
                <input
                  value={item.schoolStation || ""}
                  onChange={(event) =>
                    updateItem(index, "schoolStation", event.target.value)
                  }
                  placeholder="Example: SPNHS"
                  className={getControlClass(
                    currentErrors.schoolStation,
                    inputControlClass
                  )}
                />
              </JobFormField>

              <JobFormField label="Subject / Learning Area">
                <input
                  value={item.subjectArea || ""}
                  onChange={(event) =>
                    updateItem(index, "subjectArea", event.target.value)
                  }
                  placeholder="Example: MAPEH"
                  className={getControlClass("", inputControlClass)}
                />
              </JobFormField>

              <JobFormField
                label="Vacancy"
                error={currentErrors.vacancyCount}
                required
              >
                <input
                  type="number"
                  min="1"
                  value={item.vacancyCount}
                  onChange={(event) =>
                    updateItem(index, "vacancyCount", event.target.value)
                  }
                  className={getControlClass(
                    currentErrors.vacancyCount,
                    inputControlClass
                  )}
                />
              </JobFormField>

              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={normalizedItems.length === 1}
                className="self-end justify-self-start rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RequirementPreview({
  requirements = [],
  emptyMessage = "No requirements configured for this position.",
}) {
  if (!requirements.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        List of Requirements
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

  const rawValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const datePart = rawValue.match(/(\d{4}-\d{2}-\d{2})/);
  return datePart ? datePart[1] : rawValue.slice(0, 10);
}

function createEditJobForm(job) {
  return {
    title: job.title || "",
    location: job.location || "",
    vacancyItems:
      job.vacancyItems?.length > 0
        ? job.vacancyItems.map((item) => ({
            id: item.id,
            schoolStation: item.schoolStation || "",
            subjectArea: item.subjectArea || "",
            vacancyCount: item.vacancyCount || 1,
          }))
        : [{ schoolStation: job.location || "", subjectArea: "", vacancyCount: job.vacancy || 1 }],
    vacancy: job.vacancy || 1,
    deadline: getDateInputValue(job.deadline),
    deadlineTime: job.deadlineTime || "23:59",
    positionId: job.positionId || "",
    positionCategory: job.positionCategory || "",
    salaryGrade: job.salaryGrade || "",
    salaryAmount: job.salaryAmount || "",
    education: job.education || "",
    training: job.training || "",
    experience: job.experience || "",
    eligibility: job.eligibility || "",
    status: job.status === "expired" ? "closed" : job.status || "open",
    description: job.description || "",
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
  const filteredPositions = positions.filter(
    (position) => position.category === editForm.positionCategory
  );
  const selectedEditPosition = positions.find(
    (item) => String(item.id) === String(editForm.positionId)
  );
  const editRequirements = getPositionRequirements(
    selectedEditPosition || editingJob,
    editForm.positionCategory,
    editForm.title
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

  const saveEditedJob = async (event) => {
    event.preventDefault();

    if (isUpdating || !editingJob) return;

    const validationErrors = validateJobOpeningForm(editForm);

    if (Object.keys(validationErrors).length > 0) {
      setEditErrors(validationErrors);
      showToast({
        type: "warning",
        message: "Please complete the highlighted vacancy fields.",
      });
      return;
    }

    setIsUpdating(true);
    setEditErrors({});

    try {
      const updateResult = await updateJob(editingJob, {
        vacancyItems: editForm.vacancyItems,
        deadline: editForm.deadline,
        deadlineTime: editForm.deadlineTime,
        positionId: editForm.positionId ? Number(editForm.positionId) : null,
        salaryGrade: editForm.salaryGrade,
        salaryAmount: editForm.salaryAmount,
        education: editForm.education,
        training: editForm.training,
        experience: editForm.experience,
        eligibility: editForm.eligibility,
        status: editForm.status,
        description: editForm.description,
      });

      if (updateResult.skipped) return;

      showToast({ type: "success", message: "Vacancy updated." });
      setEditingJob(null);
      setEditForm(emptyJob);
      setEditErrors({});
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to update vacancy.",
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
            message: "Vacancy status updated.",
          });
        }
      })
      .catch((err) =>
        showToast({
          type: "error",
          message: err.message || "Failed to update vacancy status.",
        })
      );

  return (
    <section className="oas-panel">
      <div className="flex justify-end border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onCreateJob}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
        >
          <Plus className="h-4 w-4" />
          Create Vacancy
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
                  {formatDate(job.deadline)} {formatTime(job.deadlineTime)}
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
              <th className="px-5 py-3 font-bold">Vacancy Title</th>
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
                  {formatDate(job.deadline)} {formatTime(job.deadlineTime)}
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
        itemLabel="vacancies"
      />

      {editingJob && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-6">
          <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[92dvh]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h3 className="break-words text-lg font-bold text-slate-900 [overflow-wrap:anywhere]">
                  Edit Vacancy
                </h3>
                <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  Update the posting details applicants will see.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditJob}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close edit vacancy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={saveEditedJob}
              className="grid min-h-0 gap-4 overflow-y-auto px-4 py-5 sm:px-6"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <JobFormField label="Position Category" required>
                  <select
                    value={editForm.positionCategory}
                    onChange={(event) => {
                      updateEditField("positionCategory", event.target.value);
                      updateEditField("positionId", "");
                      updateEditField("title", "");
                    }}
                    className={getControlClass("", inputControlClass)}
                  >
                    <option value="">Select category</option>
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                  </select>
                </JobFormField>

                <JobFormField
                  label="Position Library"
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
                      updateEditField("title", position?.title || "");
                      updateEditField(
                        "positionCategory",
                        position?.category || editForm.positionCategory
                      );
                    }}
                    disabled={!editForm.positionCategory}
                    className={disabledInputControlClass}
                  >
                    <option value="">
                      {editForm.positionCategory
                        ? "Select saved position"
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

              <JobFormField label="Position Title">
                <input
                  value={editForm.title}
                  disabled
                  className={disabledInputControlClass}
                />
              </JobFormField>

              <VacancyItemsEditor
                items={editForm.vacancyItems}
                errors={editErrors.vacancyItems}
                onChange={(items) => updateEditField("vacancyItems", items)}
              />

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                No. of Vacant Items: {getVacancyTotal(editForm.vacancyItems)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <JobFormField label="Salary Grade" error={editErrors.salaryGrade} required>
                  <input
                    value={editForm.salaryGrade}
                    onChange={(event) =>
                      updateEditField("salaryGrade", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.salaryGrade,
                      inputControlClass
                    )}
                  />
                </JobFormField>

                <JobFormField label="Salary Amount" error={editErrors.salaryAmount} required>
                  <input
                    value={editForm.salaryAmount}
                    onChange={(event) =>
                      updateEditField("salaryAmount", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.salaryAmount,
                      inputControlClass
                    )}
                  />
                </JobFormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <JobFormField label="Education" error={editErrors.education} required>
                  <textarea
                    value={editForm.education}
                    onChange={(event) =>
                      updateEditField("education", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.education,
                      textareaControlClass
                    )}
                  />
                </JobFormField>

                <JobFormField label="Training" error={editErrors.training} required>
                  <textarea
                    value={editForm.training}
                    onChange={(event) =>
                      updateEditField("training", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.training,
                      textareaControlClass
                    )}
                  />
                </JobFormField>

                <JobFormField label="Experience" error={editErrors.experience} required>
                  <textarea
                    value={editForm.experience}
                    onChange={(event) =>
                      updateEditField("experience", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.experience,
                      textareaControlClass
                    )}
                  />
                </JobFormField>

                <JobFormField label="Eligibility" error={editErrors.eligibility} required>
                  <textarea
                    value={editForm.eligibility}
                    onChange={(event) =>
                      updateEditField("eligibility", event.target.value)
                    }
                    className={getControlClass(
                      editErrors.eligibility,
                      textareaControlClass
                    )}
                  />
                </JobFormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                requirements={editForm.positionId ? editRequirements : []}
                emptyMessage="Select a Position Library item to show its List of Requirements."
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
      <div className="flex justify-end border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onCreateJob}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Plus className="h-4 w-4" />
          Create Vacancy
        </button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading vacancies..." />
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
                  {formatDate(job.deadline)} {formatTime(job.deadlineTime)}
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
                            message: "Vacancy status updated.",
                          });
                        }
                      })
                      .catch((err) =>
                        showToast({
                          type: "error",
                          message: err.message || "Failed to update vacancy status.",
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
            <EmptyState label="No vacancies yet." />
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
    ? "Update the category and title for this saved position."
    : "Create a position title admins can reuse when posting vacancies.";
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

      <RequirementPreview
        requirements={getFixedApplicationRequirements(draft.category, draft.title)}
      />
    </div>
  );

  return (
    <>
      <section className="oas-panel">
        <div className="flex justify-end border-b border-slate-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
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
                    {position.category} / {position.requirements?.length || 0} requirements
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
              ? Existing vacancies will keep their saved details.
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

function ApplicationStatusUpdateModal({
  update,
  statusLabels,
  getApplicantName,
  onClose,
  onSave,
}) {
  const { showToast } = useToast();
  const [remarks, setRemarks] = useState(update.application.reviewNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const nextStatusLabel = statusLabels[update.status] || update.status;

  const saveStatusUpdate = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave(update.application, update.status, remarks);
      onClose();
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Failed to send application update.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-6">
      <div className="w-full min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg bg-white shadow-2xl sm:max-w-lg sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Status Update
            </p>
            <h3 className="mt-1 break-words text-lg font-bold text-slate-900 [overflow-wrap:anywhere]">
              {getApplicantName(update.application)}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close status update"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              New Status
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {nextStatusLabel}
            </p>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-700">
              Remarks
            </span>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Optional remarks for the applicant"
              className="mt-2 min-h-28 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveStatusUpdate}
            disabled={isSaving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Send update
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicantListSection({
  isLoading,
  filteredApplications,
  positions,
  selectedPosition,
  selectedStatus,
  selectedDate,
  dateFrom,
  dateTo,
  searchTerm,
  setSelectedPosition,
  setSelectedStatus,
  setSelectedDate,
  setDateFrom,
  setDateTo,
  setSearchTerm,
  onViewApplication,
  openStatusUpdate,
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
  const applicationRows = Array.isArray(filteredApplications)
    ? filteredApplications.filter(Boolean)
    : [];
  const positionOptions = Array.isArray(positions) ? positions : [];
  const labels = statusLabels || {};
  const hasFilters =
    Boolean(searchTerm.trim()) ||
    selectedPosition !== "all" ||
    selectedStatus !== "all" ||
    Boolean(selectedDate) ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  return (
    <section className="oas-panel">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5 sm:py-4">
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-[minmax(0,1.2fr)_180px_210px_220px_auto]">
          <div className="relative col-span-2 xl:col-span-1">
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
            {positionOptions.map((position) => (
              <option
                key={position.id || position.title}
                value={position.id || position.title}
              >
                {position.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            aria-label="Filter by status"
            className="h-10 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:rounded-xl sm:px-3 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            {statusFilterOptions.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>

          <div className="col-span-2 min-w-0 sm:col-span-1">
            <DateFilterControl
              label="Date Filter"
              value={{
                date: selectedDate,
                dateFrom,
                dateTo,
              }}
              onChange={(nextFilter) => {
                setSelectedDate(nextFilter.date || "");
                setDateFrom(nextFilter.dateFrom || "");
                setDateTo(nextFilter.dateTo || "");
              }}
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedPosition("all");
                setSelectedStatus("all");
                setSelectedDate("");
                setDateFrom("");
                setDateTo("");
              }}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 sm:col-span-1 sm:justify-self-end sm:px-4 sm:text-sm xl:h-11"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {!isLoading && applicationRows.length > 0 && (
        <div className="grid gap-2 p-2 sm:p-4 md:hidden">
          {applicationRows.map((application) => (
              <article
                key={application.id}
                className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm"
              >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  {formatUanDisplay(application.uan)}
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
                  openStatusUpdate(application, event.target.value)
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
                    {labels[value]}
                  </option>
                ))}
              </select>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => onViewApplication(application)}
                    className="oas-action-button oas-card-action-button"
                  >
                    View
                  </button>
                </div>
              </article>
            ))}
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
            {applicationRows.map((application) => (
                <tr
                  key={application.id}
                  className="border-t border-slate-100 align-top"
                >
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {formatUanDisplay(application.uan)}
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
                      openStatusUpdate(application, event.target.value)
                    }
                    className={`h-10 min-w-[190px] cursor-pointer rounded-full border px-3 text-sm font-semibold outline-none transition ${getStatusBadgeClass(
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
                        {labels[value]}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewApplication(application)}
                    className="oas-action-button"
                  >
                    View
                  </button>
                </td>
                </tr>
              ))}
          </tbody>
        </table>

      </div>

      {!isLoading && applicationRows.length === 0 && (
        <EmptyState label="No applicants found." />
      )}

      {isLoading && <LoadingState label="Loading applicants..." />}

      {!isLoading && applicationRows.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={pagination?.totalRecords || pagination?.total || applicationRows.length}
          currentCount={applicationRows.length}
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
      {isLoading ? (
        <LoadingState label="Loading vacancies..." />
      ) : jobs.length === 0 ? (
        <EmptyState label="No vacancies available." />
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
                  {formatDate(job.deadline)} {formatTime(job.deadlineTime)}
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
          itemLabel="vacancies"
        />
      )}

      {viewJob && (
        <JobListingDetailsModal
          job={viewJob}
          onClose={() => setViewJob(null)}
        />
      )}
    </section>
  );
}

function JobListingDetailsModal({ job, onClose }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-3xl sm:rounded-xl">
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

        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
          <VacancyDetailsContent job={job} showTitle={false} />
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
  const [previewFile, setPreviewFile] = useState(null);
  const requirements = Array.isArray(application.requirements)
    ? application.requirements
    : [];
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
  const applicationPosition = getApplicationPosition(application);
  const submissionRule = getApplicationSubmissionRule(
    jobPosition.positionType || applicationPosition
  );
  const requiresPersonalSubmission = Boolean(
    application.personalSubmissionRequired ||
      application.requirementSubmissionMode === "personal" ||
      applicationData.personalSubmissionRequired ||
      applicationData.requirementSubmissionMode === "personal" ||
      submissionRule.requiresPersonalSubmission
  );

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
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-x-hidden overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-6">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-5xl sm:rounded-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Application Form
            </p>

            <h3 className="mt-1 break-words text-xl font-bold text-slate-900 [overflow-wrap:anywhere] sm:text-2xl">
              {fullName}
            </h3>

            <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {formatUanDisplay(application.uan)} /{" "}
              {applicationPosition} /{" "}
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

        <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-xl sm:p-4">
            <dl className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Email", getApplicantEmail(application)],
                ["Position", applicationPosition],
                ["Location", getApplicationLocation(application)],
                ["Date Applied", formatDate(getApplicationDate(application))],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
                    {value || "N/A"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-4 min-w-0 max-w-full space-y-4 sm:mt-6 sm:space-y-6">
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

            <ApplicationSection
              title={
                requiresPersonalSubmission
                  ? "Vacancy Position"
                  : "Vacancy Position and Attachments"
              }
            >
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
                      applicationPosition ||
                      "N/A",
                  ],
                  ["Location", getApplicationLocation(application)],
                  ["Salary Grade", application.jobSalaryGrade || "N/A"],
                  ["Salary Amount", application.jobSalaryAmount || "N/A"],
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
                      const requirementFile = requirement.file;

                      return (
                        <div
                          key={draftKey}
                          className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3 sm:rounded-xl"
                        >
                          <div className="min-w-0 max-w-full">
                            <p className="break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">
                              {requirement.label || requirement.field}
                              {requirement.required ? (
                                <span className="ml-1 text-red-600">*</span>
                              ) : null}
                            </p>

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
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : !requiresPersonalSubmission ? (
                <div className="mt-4">
                  <h5 className="text-sm font-bold text-slate-800">
                    Attached Files
                  </h5>

                  <div className="mt-3 grid min-w-0 max-w-full gap-2 sm:grid-cols-2">
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
              ) : null}
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

function ApplicationSection({ title, children }) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-3 sm:rounded-xl sm:p-5">
      <h4 className="break-words text-lg font-bold text-blue-950 [overflow-wrap:anywhere]">
        {title}
      </h4>

      <div className="mt-3 border-b border-slate-200" />

      <div className="mt-4 min-w-0 max-w-full">{children}</div>
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 max-w-full overflow-hidden rounded-lg bg-slate-50 px-3 py-2 text-sm"
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
  const isDateField = (label) =>
    /date|valid until|from|to/i.test(String(label || ""));

  return (
    <div className="mt-4 min-w-0 max-w-full first:mt-0">
      <h5 className="break-words text-sm font-bold text-slate-800 [overflow-wrap:anywhere]">
        {title}
      </h5>

      <div className="mt-3 space-y-3">
        {records.length > 0 ? (
          records.map((record, index) => {
            const normalFields = fields.filter(([label]) => !isDateField(label));
            const dateFields = fields.filter(([label]) => isDateField(label));

            return (
              <div
                key={index}
                className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  Entry {index + 1}
                </p>

                <div className="grid min-w-0 gap-x-10 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0 space-y-2">
                    {normalFields.map(([label, key]) => (
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

                  <div className="min-w-0 space-y-2">
                    {dateFields.map(([label, key]) => (
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
              </div>
            );
          })
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

function LoadingOverlay({ label }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-2xl">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="p-8 text-center text-slate-500">{label}</div>;
}
