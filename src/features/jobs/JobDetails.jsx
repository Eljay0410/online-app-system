import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
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
import {
  getJobSubmissionRule,
  getJobUploadRequirements,
  QualificationStandards,
  RequirementSummary,
  VacancyBreakdown,
  VacancyDescription,
  VacancySummaryTable,
} from "./jobPostingUi";
const uploadMaxFileSize = 15 * 1024 * 1024;
const maxRequirementFilesPerField = 5;
const maxRequirementUploadBatch = 3;
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const acceptedRequirementFileTypesText = acceptedRequirementFileTypes.join(",");

function normalizeSelectedFileIds(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return value ? [String(value)] : [];
}

function getJobRequirements(job = null) {
  return getJobUploadRequirements(job || {});
}

export default function JobDetails() {
  const { jobId } = useParams();
  const location = useLocation();
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

  const getApplyPath = () => {
    const params = new URLSearchParams();

    if (job?.id || jobId) params.set("jobId", String(job?.id || jobId));
    if (job?.title) params.set("position", job.title);
    if (job?.positionCategory) params.set("category", job.positionCategory);

    const query = params.toString();
    return `/applicant-information${query ? `?${query}` : ""}`;
  };

  const handleBack = () => {
    const returnTo = location.state?.returnTo;

    if (returnTo) {
      navigate(returnTo, {
        state:
          location.state?.returnState ||
          (location.state?.restoreApplicationId
            ? {
                restoreApplicationId: location.state.restoreApplicationId,
                restoreApplication: location.state.restoreApplication || null,
              }
            : null),
      });
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

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
            message: error.message || "Unable to load this vacancy.",
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

    navigate(getApplyPath(), { state: { job } });
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
        [field]: normalizeSelectedFileIds(current.selectedFiles[field]).includes(
          String(fileId)
        )
          ? normalizeSelectedFileIds(current.selectedFiles[field]).filter(
              (id) => id !== String(fileId)
            )
          : [
              ...normalizeSelectedFileIds(current.selectedFiles[field]),
              String(fileId),
            ].slice(0, maxRequirementFilesPerField),
      },
    }));
  };

  const uploadRequirementToLibrary = async (requirement, incomingFiles) => {
    const files = Array.from(incomingFiles || []).filter(Boolean);
    if (files.length === 0) return;

    if (files.length > maxRequirementUploadBatch) {
      showToast({
        type: "warning",
        message: `Upload up to ${maxRequirementUploadBatch} files at a time for one requirement.`,
      });
      return;
    }

    const existingCount = (
      applyFlow.libraryByField[requirement.field] || []
    ).length;
    if (existingCount + files.length > maxRequirementFilesPerField) {
      showToast({
        type: "warning",
        message: `Each requirement can keep up to ${maxRequirementFilesPerField} files.`,
      });
      return;
    }

    const invalidSize = files.find((file) => file.size > uploadMaxFileSize);
    if (invalidSize) {
      showToast({
        type: "warning",
        message: "Please upload files smaller than 15 MB.",
      });
      return;
    }

    const invalidType = files.find(
      (file) => !acceptedRequirementFileTypes.includes(file.type)
    );
    if (invalidType) {
      showToast({
        type: "warning",
        message: "Upload images, PDFs, TXT, DOC, or DOCX files only.",
      });
      return;
    }

    setApplyFlow((current) => ({
      ...current,
      uploadingFields: {
        ...current.uploadingFields,
        [requirement.field]: true,
      },
    }));

    try {
      const uploadedFiles = [];

      for (const file of files) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("requirementLabel", requirement.label || requirement.field);
        payload.append("positionCategory", job?.positionCategory || "");
        payload.append("positionTitle", job?.title || "");
        payload.append("positionType", job?.title || "");

        const result = await apiRequest(
          `/api/applicant/requirement-files/${encodeURIComponent(
            requirement.field
          )}`,
          { method: "POST", body: payload }
        );

        uploadedFiles.push(result.file);
      }

      setApplyFlow((current) => ({
        ...current,
        libraryByField: {
          ...current.libraryByField,
          [requirement.field]: [
            ...uploadedFiles,
            ...(current.libraryByField[requirement.field] || []),
          ],
        },
        selectedFiles: {
          ...current.selectedFiles,
          [requirement.field]: [
            ...normalizeSelectedFileIds(current.selectedFiles[requirement.field]),
            ...uploadedFiles.map((file) => file.id),
          ].slice(0, maxRequirementFilesPerField),
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

    if (applyFlow.profileGaps.length > 0) {
      setApplyFlow((current) => ({
        ...current,
        error: "Complete the required profile sections before submitting.",
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
        <BackButton
          onClick={handleBack}
          label={
            location.state?.fromLabel
              ? `Back to ${location.state.fromLabel}`
              : "Go back"
          }
        />

        {isLoading ? (
          <div className="oas-panel flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading vacancy details...
          </div>
        ) : !job ? (
          <div className="oas-panel p-10 text-center text-slate-500">
            Vacancy unavailable.
          </div>
        ) : (
          <section className="oas-panel p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between sm:pb-5">
              <div>
                <h1 className="oas-page-title">
                  {job.title}
                </h1>
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

            <div className="mt-4 sm:mt-5">
              <VacancySummaryTable job={job} />
            </div>

            <VacancyBreakdown job={job} />
            <VacancyDescription job={job} />
            <QualificationStandards job={job} />
            <RequirementSummary job={job} />
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
                state={{ next: getApplyPath() }}
                className="oas-mobile-full inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78]"
                onClick={() => setShowPrompt(false)}
              >
                Sign Up
              </Link>
              <Link
                to={`/login?next=${encodeURIComponent(getApplyPath())}`}
                className="oas-mobile-full inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={() => setShowPrompt(false)}
              >
                Login
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              className="mt-3 h-10 w-full rounded-xl text-sm font-medium text-slate-500"
            >
              Cancel
            </button>
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
  const submissionRule = getJobSubmissionRule(job);
  const jobRequirements = getJobRequirements(job);
  const [selectedRequirementField, setSelectedRequirementField] = useState(
    () => jobRequirements[0]?.field || ""
  );
  const canSubmit =
    !applyFlow.isLoading &&
    applyFlow.profileGaps.length === 0;
  const selectedRequirement =
    jobRequirements.find(
      (requirement) => requirement.field === selectedRequirementField
    ) ||
    jobRequirements[0] ||
    null;
  const selectedRequirementOptions = selectedRequirement
    ? applyFlow.libraryByField[selectedRequirement.field] || []
    : [];
  const selectedRequirementFileIds = normalizeSelectedFileIds(
    selectedRequirement
      ? applyFlow.selectedFiles[selectedRequirement.field]
      : []
  );
  const selectedRequirementFiles = selectedRequirementOptions.filter((file) =>
    selectedRequirementFileIds.includes(String(file.id))
  );
  const isSelectedRequirementUploading = Boolean(
    selectedRequirement &&
      applyFlow.uploadingFields[selectedRequirement.field]
  );

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
              {submissionRule.requiresPersonalSubmission
                ? "Submit your application online, then submit the required documents in person to the Division Office."
                : "Select documents from your reusable library or upload new files."}
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
                      List of Requirements
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {submissionRule.requiresPersonalSubmission
                        ? "Your online application will be submitted without file uploads."
                        : "Attached documents are copied into this application when submitted."}
                    </p>
                  </div>
                  {!submissionRule.requiresPersonalSubmission && (
                    <button
                      type="button"
                      onClick={onOpenDocuments}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Open library
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-3">
                  {submissionRule.requiresPersonalSubmission ? (
                    <>
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        <p className="font-bold">{submissionRule.notice?.title}</p>
                        <p className="mt-1">
                          Applicants must submit the required documents in person to the Division Office.
                        </p>
                      </div>
                      {jobRequirements.length ? (
                        <ul className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                          {jobRequirements.map((requirement) => (
                            <li
                              key={requirement.field || requirement.label}
                              className="border-b border-slate-200 py-2.5 first:pt-0 last:border-b-0 last:pb-0"
                            >
                              <p className="min-w-0 break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">
                                {requirement.label}
                              </p>
                              {requirement.description && (
                                <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                                  {requirement.description}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          No physical requirements are configured for this vacancy.
                        </p>
                      )}
                    </>
                  ) : jobRequirements.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No upload requirements configured for this vacancy.
                    </p>
                  ) : selectedRequirement ? (
                    <>
                      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div>
                          <label
                            htmlFor="apply-requirement-category"
                            className="block text-sm font-semibold text-slate-700"
                          >
                            Requirement category
                          </label>
                          <select
                            id="apply-requirement-category"
                            value={selectedRequirement.field}
                            onChange={(event) =>
                              setSelectedRequirementField(event.target.value)
                            }
                            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
                          >
                            {jobRequirements.map((requirement) => {
                              const selectedCount = normalizeSelectedFileIds(
                                applyFlow.selectedFiles[requirement.field]
                              ).length;

                              return (
                                <option
                                  key={requirement.field}
                                  value={requirement.field}
                                >
                                  {requirement.label}
                                  {selectedCount > 0
                                    ? ` - ${selectedCount} selected`
                                    : ""}
                                </option>
                              );
                            })}
                          </select>

                          <div className="mt-4 grid gap-2">
                            {jobRequirements.map((requirement) => {
                              const selectedCount = normalizeSelectedFileIds(
                                applyFlow.selectedFiles[requirement.field]
                              ).length;

                              return (
                                <button
                                  key={requirement.field}
                                  type="button"
                                  onClick={() =>
                                    setSelectedRequirementField(
                                      requirement.field
                                    )
                                  }
                                  className={`flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    selectedRequirement.field ===
                                    requirement.field
                                      ? "border-blue-500 bg-blue-50 text-blue-900"
                                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                  }`}
                                >
                                  <span className="min-w-0 break-words font-medium [overflow-wrap:anywhere]">
                                    {requirement.label}
                                  </span>
                                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                    {selectedCount}/
                                    {maxRequirementFilesPerField}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
                                {selectedRequirement.label}
                              </p>
                              {selectedRequirement.description && (
                                <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                                  {selectedRequirement.description}
                                </p>
                              )}
                            </div>

                            <div className="grid gap-2 lg:min-w-[320px]">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                                {selectedRequirementOptions.length === 0 ? (
                                  <p className="px-1 py-1 text-sm text-slate-500">
                                    No saved file yet.
                                  </p>
                                ) : (
                                  <div className="max-h-36 space-y-1 overflow-y-auto">
                                    {selectedRequirementOptions.map((file) => {
                                      const checked =
                                        selectedRequirementFileIds.includes(
                                          String(file.id)
                                        );

                                      return (
                                        <label
                                          key={file.id}
                                          className="flex min-w-0 items-start gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-white"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              onSelectFile(
                                                selectedRequirement.field,
                                                file.id
                                              )
                                            }
                                            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                                          />
                                          <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                                            {file.name}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <input
                                type="file"
                                accept={acceptedRequirementFileTypesText}
                                disabled={isSelectedRequirementUploading}
                                multiple
                                onChange={(event) => {
                                  onUploadFile(
                                    selectedRequirement,
                                    event.target.files
                                  );
                                  event.target.value = "";
                                }}
                                className="block w-full text-sm text-slate-600 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-70"
                              />

                              <p className="text-xs leading-5 text-slate-500">
                                Images, PDF, TXT, DOC, or DOCX only. Max {maxRequirementUploadBatch} files per upload and {maxRequirementFilesPerField} files per category.
                              </p>

                              {selectedRequirementFiles.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {selectedRequirementFiles.map((file) => (
                                    <button
                                      key={file.id}
                                      type="button"
                                      onClick={() => onPreviewFile(file)}
                                      className="text-sm font-semibold text-blue-700 hover:underline"
                                    >
                                      View {file.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
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
