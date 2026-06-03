import { useEffect, useState } from "react";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";
import DateFilterControl from "../../components/ui/DateFilterControl";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import PaginationControls from "../../components/ui/PaginationControls";
import { useToast } from "../../components/ui/toastContext";
import { apiRequest } from "../../lib/api";

const pageSizeOptions = [10, 25, 50];
const emptyDateFilter = {
  date: "",
  dateFrom: "",
  dateTo: "",
};

const statusLabels = {
  submitted: "Pending Review",
  reviewed: "Reviewed",
  qualified: "Qualified",
  disqualified: "Disqualified",
  shortlisted: "Shortlisted",
  selected: "Selected",
  rejected: "Rejected",
  hired: "Hired",
  pending_review: "Pending Review",
  for_compliance: "Pending Review",
  under_review: "Under Review",
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-500";
const textareaClass =
  "min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:ring-2 focus:ring-blue-500";

function formatDate(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getStatusLabel(status) {
  return statusLabels[status] || status || "Submitted";
}

function getStatusBadgeClass(status) {
  const value = String(status || "").toLowerCase();

  if (["qualified", "selected", "hired"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (["rejected", "disqualified"].includes(value)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (["shortlisted", "under_review"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (["reviewed", "pending_review"].includes(value)) {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getAccountBadgeClass(isActive) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-600";
}

function getRequirementFileName(file) {
  return file?.name || file?.fileName || file?.filename || "Uploaded file";
}

function getPrimaryStatus(applicant) {
  const counts = applicant?.applicationStatusCounts || {};
  const [status] =
    Object.entries(counts)
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]))[0] || [];

  return status || "";
}

function buildEditForm(applicant = {}) {
  return {
    firstName: applicant.firstName || "",
    middleName: applicant.noMiddleName ? "" : applicant.middleName || "",
    noMiddleName: Boolean(applicant.noMiddleName),
    lastName: applicant.lastName || "",
    suffix: applicant.suffix || "",
    contactNumber: applicant.contactNumber || "",
    address: applicant.address || "",
  };
}

export default function ApplicantManagement() {
  const { showToast } = useToast();
  const [applicants, setApplicants] = useState([]);
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(emptyDateFilter);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState(null);
  const [editForm, setEditForm] = useState(buildEditForm());
  const [isSaving, setIsSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const hasFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(dateFilter.date) ||
    Boolean(dateFilter.dateFrom) ||
    Boolean(dateFilter.dateTo);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });

    if (debouncedSearchTerm) params.set("q", debouncedSearchTerm);
    if (dateFilter.date) {
      params.set("date", dateFilter.date);
    } else {
      if (dateFilter.dateFrom) params.set("dateFrom", dateFilter.dateFrom);
      if (dateFilter.dateTo) params.set("dateTo", dateFilter.dateTo);
    }

    queueMicrotask(() => {
      if (isMounted) setIsLoading(true);
    });
    apiRequest(`/api/admin/applicant-management?${params.toString()}`, {
      dedupe: false,
    })
      .then((result) => {
        if (!isMounted) return;

        const nextApplicants = result.applicants || [];
        setApplicants(nextApplicants);
        setPagination(
          result.pagination || {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            total: nextApplicants.length,
          }
        );
      })
      .catch((error) => {
        if (isMounted) {
          showToast({
            type: "error",
            message: error.message || "Failed to load applicant accounts.",
          });
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    dateFilter.date,
    dateFilter.dateFrom,
    dateFilter.dateTo,
    debouncedSearchTerm,
    page,
    pageSize,
    showToast,
  ]);

  const visibleCount = applicants.length;

  const openDetails = async (applicant) => {
    setIsDetailLoading(true);
    setSelectedApplicant(null);

    try {
      const result = await apiRequest(
        `/api/admin/applicant-management/${applicant.id}`,
        { dedupe: false }
      );
      setSelectedApplicant(result.applicant || applicant);
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to load applicant details.",
      });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const openEdit = (applicant) => {
    setEditingApplicant(applicant);
    setEditForm(buildEditForm(applicant));
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditingApplicant(null);
    setEditForm(buildEditForm());
  };

  const updateEditField = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "noMiddleName" && value ? { middleName: "" } : {}),
    }));
  };

  const saveBasicInfo = async (event) => {
    event.preventDefault();
    if (isSaving || !editingApplicant) return;

    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      showToast({
        type: "warning",
        message: "First name and last name are required.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const result = await apiRequest(
        `/api/admin/applicant-management/${editingApplicant.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(editForm),
        }
      );
      const updatedApplicant = result.applicant;

      setApplicants((current) =>
        current.map((applicant) =>
          applicant.id === updatedApplicant.id
            ? { ...applicant, ...updatedApplicant }
            : applicant
        )
      );
      setSelectedApplicant((current) =>
        current?.id === updatedApplicant.id ? updatedApplicant : current
      );
      setEditingApplicant(null);
      setEditForm(buildEditForm());
      showToast({
        type: "success",
        message: "Applicant basic information updated.",
      });
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to update applicant.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter(emptyDateFilter);
    setPage(1);
  };

  return (
    <>
      <section className="oas-panel">
        <div className="border-b border-slate-200 bg-slate-50 px-3 py-3 sm:px-5 sm:py-4">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:gap-3">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search UAN, name, email, or contact"
                aria-label="Search applicant accounts"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-blue-500 sm:h-11 sm:rounded-xl sm:text-sm"
              />
            </div>

            <DateFilterControl
              label="Date Filter"
              value={dateFilter}
              onChange={(nextFilter) => {
                setDateFilter(nextFilter);
                setPage(1);
              }}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-10 items-center justify-center gap-1.5 justify-self-start rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 sm:h-11 sm:justify-self-end sm:px-4 sm:text-sm"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {!isLoading && applicants.length > 0 && (
          <div className="grid gap-2 p-2 sm:p-4 md:hidden">
            {applicants.map((applicant) => (
              <ApplicantCard
                key={applicant.id}
                applicant={applicant}
                onView={() => openDetails(applicant)}
                onEdit={() => openEdit(applicant)}
              />
            ))}
          </div>
        )}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-44 px-4 py-3">UAN</th>
                <th className="min-w-[240px] px-4 py-3">Applicant</th>
                <th className="w-36 px-4 py-3">Contact</th>
                <th className="w-36 px-4 py-3">Account Status</th>
                <th className="w-40 px-4 py-3">Date Registered</th>
                <th className="w-44 px-4 py-3">Applications</th>
                <th className="w-20 px-4 py-3">Files</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {applicants.map((applicant) => (
                <ApplicantRow
                  key={applicant.id}
                  applicant={applicant}
                  onView={() => openDetails(applicant)}
                  onEdit={() => openEdit(applicant)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading applicant accounts...
          </div>
        ) : applicants.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
              <UserRound className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-950">
              No applicants found
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Try clearing filters or searching for another applicant.
            </p>
          </div>
        ) : null}

        {!isLoading && applicants.length > 0 && (
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={pagination.total || visibleCount}
            currentCount={visibleCount}
            onPageChange={setPage}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize);
              setPage(1);
            }}
            pageSizeOptions={pageSizeOptions}
            itemLabel="applicants"
          />
        )}
      </section>

      {isDetailLoading && (
        <LoadingModal label="Loading applicant details..." />
      )}

      {selectedApplicant && (
        <ApplicantDetailsModal
          applicant={selectedApplicant}
          onClose={() => setSelectedApplicant(null)}
          onEdit={() => openEdit(selectedApplicant)}
          onPreviewFile={setPreviewFile}
        />
      )}

      {editingApplicant && (
        <EditApplicantModal
          applicant={editingApplicant}
          form={editForm}
          isSaving={isSaving}
          onChange={updateEditField}
          onClose={closeEdit}
          onSubmit={saveBasicInfo}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          backLabel="Back to applicant details"
        />
      )}
    </>
  );
}

function ApplicantRow({ applicant, onView, onEdit }) {
  const primaryStatus = getPrimaryStatus(applicant);

  return (
    <tr className="align-top transition hover:bg-slate-50">
      <td className="px-4 py-4">
        <p className="font-bold text-blue-700">{applicant.uan || "No UAN"}</p>
      </td>
      <td className="px-4 py-4">
        <p className="break-words font-bold text-slate-950 [overflow-wrap:anywhere]">
          {applicant.fullName}
        </p>
        <p className="mt-1 break-all text-xs text-slate-500">
          {applicant.email || "No email"}
        </p>
      </td>
      <td className="px-4 py-4 text-slate-600">
        {applicant.contactNumber || "N/A"}
      </td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getAccountBadgeClass(
            applicant.isActive
          )}`}
        >
          {applicant.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-4 text-slate-600">
        {formatDate(applicant.dateRegistered || applicant.createdAt)}
      </td>
      <td className="px-4 py-4">
        <div
          className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold ${
            primaryStatus
              ? getStatusBadgeClass(primaryStatus)
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <span className="font-bold">{applicant.applicationCount || 0}</span>
          {primaryStatus && <span>{getStatusLabel(primaryStatus)}</span>}
        </div>
      </td>
      <td className="px-4 py-4 text-slate-600">
        {applicant.uploadedFileCount || 0}
      </td>
      <td className="px-4 py-4">
        <div className="flex justify-end gap-2">
          <IconButton label="View details" onClick={onView}>
            <Eye className="h-4 w-4" />
          </IconButton>
          <IconButton label="Edit basic info" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

function ApplicantCard({ applicant, onView, onEdit }) {
  const primaryStatus = getPrimaryStatus(applicant);

  return (
    <article className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
            {applicant.uan || "No UAN"}
          </p>
          <h3 className="mt-1 break-words text-sm font-bold text-slate-950 [overflow-wrap:anywhere]">
            {applicant.fullName}
          </h3>
          <p className="mt-1 break-all text-xs text-slate-500">
            {applicant.email || "No email"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getAccountBadgeClass(
            applicant.isActive
          )}`}
        >
          {applicant.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-xs">
        <InfoPair label="Contact" value={applicant.contactNumber || "N/A"} />
        <InfoPair
          label="Registered"
          value={formatDate(applicant.dateRegistered || applicant.createdAt)}
        />
        <InfoPair label="Applications" value={applicant.applicationCount || 0} />
        <InfoPair label="Files" value={applicant.uploadedFileCount || 0} />
        {primaryStatus && (
          <InfoPair label="Top status" value={getStatusLabel(primaryStatus)} />
        )}
      </dl>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-3 text-xs font-semibold text-white hover:bg-[#003a78]"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
    </article>
  );
}

function ApplicantDetailsModal({ applicant, onClose, onEdit, onPreviewFile }) {
  const applications = Array.isArray(applicant.applications)
    ? applicant.applications
    : [];
  const uploadedFiles = Array.isArray(applicant.uploadedFiles)
    ? applicant.uploadedFiles
    : [];
  const personalInfo = applicant.personalInfo || {};
  const applicationStatusItems = Object.entries(
    applicant.applicationStatusCounts || {}
  ).filter(([, count]) => Number(count) > 0);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Applicant Details
            </p>
            <h3 className="mt-2 break-words text-xl font-bold text-slate-950 [overflow-wrap:anywhere]">
              {applicant.fullName}
            </h3>
            <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
              {applicant.uan || "Not assigned"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close applicant details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-bold text-slate-900">
                Basic Information
              </h4>
              <dl className="mt-4 grid gap-3">
                <InfoPair label="Email" value={applicant.email || "N/A"} />
                <InfoPair
                  label="Contact"
                  value={applicant.contactNumber || "N/A"}
                />
                <InfoPair label="Address" value={applicant.address || "N/A"} />
                <InfoPair
                  label="Registered"
                  value={formatDateTime(applicant.dateRegistered)}
                />
                <InfoPair
                  label="Last Updated"
                  value={formatDateTime(applicant.updatedAt)}
                />
                <InfoPair
                  label="Last Login"
                  value={formatDateTime(applicant.lastLogin)}
                />
              </dl>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900">
                Profile Details
              </h4>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoPair label="Suffix" value={personalInfo.suffix || "N/A"} />
                <InfoPair
                  label="Birth Date"
                  value={personalInfo.dob || personalInfo.birthDate || "N/A"}
                />
                <InfoPair label="Sex" value={personalInfo.sex || "N/A"} />
                <InfoPair
                  label="Civil Status"
                  value={personalInfo.civilStatus || "N/A"}
                />
                <InfoPair
                  label="Nationality"
                  value={
                    personalInfo.nationalityInput ||
                    personalInfo.nationality ||
                    "N/A"
                  }
                />
                <InfoPair
                  label="Profile Updated"
                  value={formatDateTime(applicant.profile?.updatedAt)}
                />
              </dl>
            </section>
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-900">
                Applications Submitted
              </h4>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {applicant.applicationCount || applications.length} total
              </span>
            </div>

            {applicationStatusItems.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {applicationStatusItems.map(([status, count]) => (
                  <span
                    key={status}
                    className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-center text-[11px] font-semibold leading-5 ${getStatusBadgeClass(
                      status
                    )}`}
                  >
                    <span className="font-bold">{count}</span>
                    <span>{getStatusLabel(status)}</span>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)] sm:items-start"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">
                        {application.position}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                        {application.location || "No location"} / Submitted{" "}
                        {formatDate(application.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex h-fit max-w-full justify-center whitespace-nowrap rounded-md border px-2 py-0.5 text-center text-[11px] font-semibold leading-5 sm:justify-self-end ${getStatusBadgeClass(
                        application.status
                      )}`}
                    >
                      {getStatusLabel(application.status)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No submitted applications found.
                </p>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="h-4 w-4 text-slate-500" />
                Uploaded Documents
              </h4>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {applicant.uploadedFileCount || uploadedFiles.length} files
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {uploadedFiles.length > 0 ? (
                uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-slate-900 [overflow-wrap:anywhere]">
                        {getRequirementFileName(file)}
                      </p>
                      <p className="mt-1 break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
                        {file.requirementLabel || file.requirementField || "Document"} /{" "}
                        {formatFileSize(file.size)} / {formatDate(file.uploadedAt)}
                      </p>
                    </div>

                    {file.previewUrl && (
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No uploaded documents found.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
          >
            <Pencil className="h-4 w-4" />
            Edit Basic Info
          </button>
        </div>
      </section>
    </div>
  );
}

function EditApplicantModal({
  applicant,
  form,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/55 p-3 sm:p-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Edit Basic Information
            </p>
            <h3 className="mt-2 break-words text-xl font-bold text-slate-950 [overflow-wrap:anywhere]">
              {applicant.fullName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close edit basic information"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="min-h-0 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First Name" required>
              <input
                value={form.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Last Name" required>
              <input
                value={form.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
                className={inputClass}
                required
              />
            </FormField>

            <FormField label="Middle Name">
              <input
                value={form.middleName}
                onChange={(event) => onChange("middleName", event.target.value)}
                disabled={form.noMiddleName}
                className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-400`}
              />
            </FormField>

            <FormField label="Suffix">
              <input
                value={form.suffix}
                onChange={(event) => onChange("suffix", event.target.value)}
                className={inputClass}
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.noMiddleName}
                onChange={(event) =>
                  onChange("noMiddleName", event.target.checked)
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
              />
              No middle name
            </label>

            <FormField label="Contact Number">
              <input
                value={form.contactNumber}
                onChange={(event) =>
                  onChange("contactNumber", event.target.value)
                }
                className={inputClass}
              />
            </FormField>

            <div className="sm:col-span-2">
              <FormField label="Address">
                <textarea
                  value={form.address}
                  onChange={(event) => onChange("address", event.target.value)}
                  className={textareaClass}
                />
              </FormField>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-5 mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
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
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function LoadingModal({ label }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex items-center gap-2 rounded-xl bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-2xl">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
    >
      {children}
    </button>
  );
}

function InfoPair({ label, value }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-2 text-sm sm:grid-cols-[132px_minmax(0,1fr)]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words text-right font-semibold text-slate-900 [overflow-wrap:anywhere] sm:text-left">
        {value || "N/A"}
      </dd>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
