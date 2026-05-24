import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Loader2,
  MapPin,
  UserRoundPlus,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import BackButton from "../../components/ui/BackButton";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import {
  getInitialSidebarCollapsed,
  getSidebarContentPadding,
} from "../../lib/sidebar";
import { useToast } from "../../components/ui/toastContext";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

const formatDeadline = (job) =>
  `${formatDate(job.deadline)} ${job.deadlineTime || ""}`.trim();
const uploadMaxFileSize = 15 * 1024 * 1024;
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const acceptedRequirementFileTypesText = acceptedRequirementFileTypes.join(",");

function getInitialRequirementSelection(requirements = [], byField = {}) {
  return Object.fromEntries(
    requirements
      .map((requirement) => [
        requirement.field,
        byField?.[requirement.field]?.[0]?.id || "",
      ])
      .filter(([, fileId]) => fileId)
  );
}

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);
  const [isApplying, setIsApplying] = useState(false);
  const [applyFlow, setApplyFlow] = useState({
    isOpen: false,
    isLoading: false,
    profileGaps: [],
    libraryByField: {},
    selectedFiles: {},
    uploadingFields: {},
    error: "",
  });
  const [previewFile, setPreviewFile] = useState(null);

  const isApplicant = user && normalizeRole(user.role) === "applicant";
  const contentPadding = getSidebarContentPadding(collapsed);

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
          showToast({
            type: "error",
            message: error.message || "Unable to load this job opening.",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadJob();

    return () => {
      isMounted = false;
    };
  }, [jobId, showToast]);

  const handleApply = async () => {
    if (isApplying || job?.applied) return;

    if (!user) {
      setShowPrompt(true);
      return;
    }

    if (normalizeRole(user.role) !== "applicant") {
      navigate(getAuthenticatedHomePath(user));
      return;
    }

    setApplyFlow((current) => ({
      ...current,
      isOpen: true,
      isLoading: true,
      error: "",
    }));

    try {
      const [profileResult, libraryResult] = await Promise.all([
        apiRequest("/api/applicant/profile").catch((error) => ({
          error: error.message || "Complete your applicant profile first.",
          applicationProfileGaps: [
            "Personal information",
            "Educational background - bachelor's degree",
            "Eligibility",
          ],
        })),
        apiRequest("/api/applicant/requirement-files"),
      ]);
      const libraryByField = libraryResult.byField || {};

      setApplyFlow((current) => ({
        ...current,
        isOpen: true,
        isLoading: false,
        profileGaps:
          profileResult.applicationProfileGaps ||
          (profileResult.error
            ? [
                "Personal information",
                "Educational background - bachelor's degree",
                "Eligibility",
              ]
            : []),
        libraryByField,
        selectedFiles: getInitialRequirementSelection(
          job?.requirements || [],
          libraryByField
        ),
        uploadingFields: {},
        error: profileResult.error || "",
      }));
    } catch (error) {
      setApplyFlow((current) => ({
        ...current,
        isOpen: true,
        isLoading: false,
        error: error.message || "Unable to prepare your application.",
      }));
    }
  };

  const closeApplyFlow = () => {
    if (isApplying) return;
    setApplyFlow((current) => ({ ...current, isOpen: false, error: "" }));
  };

  const selectRequirementFile = (field, fileId) => {
    setApplyFlow((current) => ({
      ...current,
      selectedFiles: {
        ...current.selectedFiles,
        [field]: fileId,
      },
    }));
  };

  const uploadRequirementToLibrary = async (requirement, file) => {
    if (!file) return;

    if (file.size > uploadMaxFileSize) {
      showToast({
        type: "warning",
        message: "Please upload a file smaller than 15 MB.",
      });
      return;
    }

    if (!acceptedRequirementFileTypes.includes(file.type)) {
      showToast({
        type: "warning",
        message: "Upload images, PDFs, or common Office documents only.",
      });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("requirementLabel", requirement.label || requirement.field);

    setApplyFlow((current) => ({
      ...current,
      uploadingFields: {
        ...current.uploadingFields,
        [requirement.field]: true,
      },
    }));

    try {
      const result = await apiRequest(
        `/api/applicant/requirement-files/${encodeURIComponent(
          requirement.field
        )}`,
        { method: "POST", body: payload }
      );
      const uploadedFile = result.file;

      setApplyFlow((current) => ({
        ...current,
        libraryByField: {
          ...current.libraryByField,
          [requirement.field]: [
            uploadedFile,
            ...(current.libraryByField[requirement.field] || []),
          ],
        },
        selectedFiles: {
          ...current.selectedFiles,
          [requirement.field]: uploadedFile.id,
        },
      }));
      showToast({ type: "success", message: "Document added to your library." });
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to upload requirement.",
      });
    } finally {
      setApplyFlow((current) => ({
        ...current,
        uploadingFields: {
          ...current.uploadingFields,
          [requirement.field]: false,
        },
      }));
    }
  };

  const submitApplication = async () => {
    if (isApplying || !job) return;

    const requiredRequirements = (job.requirements || []).filter(
      (requirement) => requirement.required !== false
    );
    const missingDocuments = requiredRequirements.filter(
      (requirement) => !applyFlow.selectedFiles[requirement.field]
    );

    if (applyFlow.profileGaps.length > 0) {
      setApplyFlow((current) => ({
        ...current,
        error: "Complete the required profile sections before submitting.",
      }));
      return;
    }

    if (missingDocuments.length > 0) {
      setApplyFlow((current) => ({
        ...current,
        error: `Attach required documents: ${missingDocuments
          .map((requirement) => requirement.label)
          .join(", ")}.`,
      }));
      return;
    }

    setIsApplying(true);

    try {
      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          jobOpeningId: jobId,
          requirementFiles: applyFlow.selectedFiles,
        }),
      });
      navigate("/applications");
    } catch (error) {
      setApplyFlow((current) => ({
        ...current,
        error: error.message || "Failed to submit application.",
      }));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <main
      className={`min-h-screen bg-slate-50 ${
        isApplicant
          ? `pt-24 ${contentPadding}`
          : "px-4 pb-10 pt-24 sm:px-6 lg:px-8"
      }`}
    >
      {isApplicant && (
        <SuperAdminSidebar
          activeTab="jobs"
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          role="applicant"
        />
      )}

      <section
        className={
          isApplicant ? "px-4 pb-10 pt-6 sm:px-6 lg:px-8" : undefined
        }
      >
        <div className="mx-auto w-full max-w-4xl space-y-6">
        <BackButton to="/" label="Back to job listings" />

        {isLoading ? (
          <div className="oas-panel flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading job details...
          </div>
        ) : !job ? (
          <div className="oas-panel p-10 text-center text-slate-500">
            Job opening unavailable.
          </div>
        ) : (
          <section className="oas-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="oas-page-title">
                  {job.title}
                </h1>
                <p className="oas-page-description mt-3 whitespace-pre-wrap break-words">
                  {job.description || "No description provided yet."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || job.applied}
                className="oas-action-button disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {job.applied ? "Applied" : isApplying ? "Applying..." : "Apply"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <InfoCard label="School / Location" value={job.location} icon={<MapPin className="h-4 w-4" />} />
              <InfoCard label="Vacancies" value={job.vacancy} icon={<UserRoundPlus className="h-4 w-4" />} />
              <InfoCard label="Application Deadline" value={formatDeadline(job)} icon={<CalendarDays className="h-4 w-4" />} />
            </div>

            {job.requirements?.length > 0 && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Upload Requirements
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {job.requirements.map((requirement) => (
                    <li key={requirement.field}>
                      <span className="font-semibold text-slate-800">
                        {requirement.label}
                      </span>
                      <span
                        className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] uppercase ${
                          requirement.required === false
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {requirement.required === false ? "Optional" : "Required"}
                      </span>
                      {requirement.description
                        ? ` - ${requirement.description}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        </div>
      </section>

      {showPrompt && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-slate-950/50 p-4 sm:items-center">
          <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="break-words text-lg font-semibold text-slate-900 [overflow-wrap:anywhere]">
              Login or register first
            </h3>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              Create an account or log in before applying to this vacancy.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                onClick={() => setShowPrompt(false)}
              >
                Sign Up
              </Link>
              <Link
                to={`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setShowPrompt(false)}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}

      {applyFlow.isOpen && job && (
        <ApplyRequirementsModal
          job={job}
          applyFlow={applyFlow}
          isSubmitting={isApplying}
          onClose={closeApplyFlow}
          onSelectFile={selectRequirementFile}
          onUploadFile={uploadRequirementToLibrary}
          onSubmit={submitApplication}
          onPreviewFile={setPreviewFile}
          onOpenProfile={() => navigate(`/applicant-information?jobId=${jobId}`)}
          onOpenDocuments={() => navigate(`/requirements?jobId=${jobId}`)}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </main>
  );
}

function ApplyRequirementsModal({
  job,
  applyFlow,
  isSubmitting,
  onClose,
  onSelectFile,
  onUploadFile,
  onSubmit,
  onPreviewFile,
  onOpenProfile,
  onOpenDocuments,
}) {
  const requiredRequirements = (job.requirements || []).filter(
    (requirement) => requirement.required !== false
  );
  const missingRequiredCount = requiredRequirements.filter(
    (requirement) => !applyFlow.selectedFiles[requirement.field]
  ).length;
  const canSubmit =
    !applyFlow.isLoading &&
    applyFlow.profileGaps.length === 0 &&
    missingRequiredCount === 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center overflow-y-auto bg-slate-950/55 p-3 sm:items-center sm:p-6">
      <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">
              Apply to vacancy
            </p>
            <h2 className="mt-1 break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
              {job.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Select documents from your reusable library or upload new files.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-60"
            aria-label="Close application requirements"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-5">
          {applyFlow.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing application...
            </div>
          ) : (
            <div className="space-y-5">
              {applyFlow.profileGaps.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-950">
                    Complete required profile sections first.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                    {applyFlow.profileGaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className="mt-3 inline-flex h-9 items-center justify-center rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Complete profile
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                  Profile requirements are complete.
                </div>
              )}

              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-950">
                      Job requirements
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Required documents are copied into this application when submitted.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenDocuments}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open library
                  </button>
                </div>

                <div className="mt-3 grid gap-3">
                  {(job.requirements || []).length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No upload requirements configured for this job posting.
                    </p>
                  ) : (
                    job.requirements.map((requirement) => {
                      const options =
                        applyFlow.libraryByField[requirement.field] || [];
                      const selectedFile = options.find(
                        (file) =>
                          String(file.id) ===
                          String(applyFlow.selectedFiles[requirement.field] || "")
                      );
                      const isUploading = Boolean(
                        applyFlow.uploadingFields[requirement.field]
                      );

                      return (
                        <div
                          key={requirement.field}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                                {requirement.label}
                                <span
                                  className={`ml-2 rounded-md px-1.5 py-0.5 text-[10px] uppercase ${
                                    requirement.required === false
                                      ? "bg-slate-100 text-slate-600"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {requirement.required === false
                                    ? "Optional"
                                    : "Required"}
                                </span>
                              </p>
                              {requirement.description && (
                                <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                                  {requirement.description}
                                </p>
                              )}
                            </div>

                            <div className="grid gap-2 lg:min-w-[320px]">
                              <select
                                value={
                                  applyFlow.selectedFiles[requirement.field] || ""
                                }
                                onChange={(event) =>
                                  onSelectFile(
                                    requirement.field,
                                    event.target.value
                                  )
                                }
                                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select from library</option>
                                {options.map((file) => (
                                  <option key={file.id} value={file.id}>
                                    {file.name}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="file"
                                accept={acceptedRequirementFileTypesText}
                                disabled={isUploading}
                                onChange={(event) => {
                                  onUploadFile(
                                    requirement,
                                    event.target.files?.[0] || null
                                  );
                                  event.target.value = "";
                                }}
                                className="block w-full text-sm text-slate-600 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-70"
                              />

                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={() => onPreviewFile(selectedFile)}
                                  className="justify-self-start text-sm font-semibold text-blue-700 hover:underline"
                                >
                                  View selected file
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {applyFlow.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {applyFlow.error}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Submitting..." : "Submit application"}
          </button>
        </div>
      </section>
    </div>
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
