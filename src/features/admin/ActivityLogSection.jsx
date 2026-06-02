import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import PaginationControls from "../../components/ui/PaginationControls";

const actionLabels = {
  "job_opening.created": "Created vacancy posting",
  "job_opening.updated": "Updated vacancy posting",
  "job_opening.deleted": "Deleted vacancy posting",
  "job_position.created": "Created position",
  "job_position.updated": "Updated position",
  "job_position.deleted": "Deleted position",
  "application.status_changed": "Changed applicant status",
  "application.requirement_reviewed": "Reviewed applicant requirement",
};

const defaultActivityLogPageSize = 10;
const activityLogPageSizeOptions = [10, 25, 50];

const jobOpeningChangeFields = [
  ["title", "Vacancy title"],
  ["location", "Location"],
  ["district", "District"],
  ["barangay", "Barangay"],
  ["vacancy", "Vacancy"],
  ["deadline", "Deadline"],
  ["deadlineTime", "Deadline time"],
  ["positionCategory", "Category"],
  ["status", "Status"],
  ["description", "Description"],
  ["requirements", "List of Requirements"],
];

const positionChangeFields = [
  ["category", "Category"],
  ["title", "Position title"],
  ["requirements", "List of Requirements"],
];

function formatDateTime(value) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateOnly(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatStatus(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function truncateText(value, limit = 80) {
  const text = String(value || "").trim();
  if (text.length <= limit) return text;

  return `${text.slice(0, limit - 3)}...`;
}

function formatActivityValue(key, value) {
  if (value === null || value === undefined || value === "") return "blank";

  if (key === "status" || key === "previousStatus") {
    return formatStatus(value);
  }

  if (key === "deadline") {
    return formatDateOnly(value);
  }

  if (key === "requirements") {
    const requirements = Array.isArray(value) ? value : [];
    return `${requirements.length} requirement(s)`;
  }

  if (key === "description") {
    return truncateText(value);
  }

  return truncateText(value);
}

function normalizeComparableValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();

  return JSON.stringify(value);
}

function getChangedFields(log) {
  const metadata = log.metadata || {};
  const before = metadata.before;
  const after = metadata.after;

  if (!before || !after) return [];

  const fields =
    log.action === "job_position.updated"
      ? positionChangeFields
      : jobOpeningChangeFields;

  return fields
    .filter(
      ([key]) =>
        normalizeComparableValue(before[key]) !==
        normalizeComparableValue(after[key])
    )
    .map(([key, label]) => ({
      key,
      label,
      from: formatActivityValue(key, before[key]),
      to: formatActivityValue(key, after[key]),
    }));
}

function getActivitySummary(log) {
  const metadata = log.metadata || {};
  const target = log.entityLabel || "Untitled record";

  switch (log.action) {
    case "job_opening.created":
      return `Created vacancy posting "${target}" with ${formatActivityValue(
        "vacancy",
        metadata.vacancy
      )} vacancy and ${formatStatus(metadata.status)} status.`;
    case "job_opening.updated":
      return `Updated vacancy posting "${target}".`;
    case "job_opening.deleted":
      return `Deleted vacancy posting "${target}".`;
    case "job_position.created":
      return `Created ${metadata.category || "vacancy"} position "${target}".`;
    case "job_position.updated":
      return `Updated position "${target}".`;
    case "job_position.deleted":
      return `Deleted ${metadata.category || "vacancy"} position "${target}".`;
    case "application.status_changed":
      return `Changed applicant status for "${target}" from ${formatStatus(
        metadata.fromStatus
      )} to ${formatStatus(metadata.toStatus)}.`;
    case "application.requirement_reviewed":
      return `Reviewed "${metadata.requirementField || target}" from ${formatStatus(
        metadata.fromStatus
      )} to ${formatStatus(metadata.toStatus)}.`;
    default:
      return `${actionLabels[log.action] || formatStatus(log.action)}: ${target}`;
  }
}

function ActivityDetails({ log }) {
  const metadata = log.metadata || {};
  const changedFields = getChangedFields(log);

  if (log.action === "application.status_changed") {
    return (
      <p className="mt-1 text-xs text-slate-500">
        {formatStatus(metadata.fromStatus)} to {formatStatus(metadata.toStatus)}
        {metadata.uan ? ` / UAN ${metadata.uan}` : ""}
      </p>
    );
  }

  if (log.action === "application.requirement_reviewed") {
    return (
      <p className="mt-1 text-xs text-slate-500">
        {formatStatus(metadata.fromStatus)} to {formatStatus(metadata.toStatus)}
        {metadata.remarks ? ` / ${metadata.remarks}` : ""}
      </p>
    );
  }

  if (changedFields.length > 0) {
    return (
      <ul className="mt-2 grid gap-1 text-xs text-slate-500">
        {changedFields.map((field) => (
          <li key={field.key} className="break-words [overflow-wrap:anywhere]">
            <span className="font-semibold text-slate-600">
              {field.label}:
            </span>{" "}
            {field.from} to {field.to}
          </li>
        ))}
      </ul>
    );
  }

  if (metadata.previousStatus) {
    return (
      <p className="mt-1 text-xs text-slate-500">
        Previous status: {formatStatus(metadata.previousStatus)}
      </p>
    );
  }

  if (metadata.status) {
    return (
      <p className="mt-1 text-xs text-slate-500">
        Status: {formatStatus(metadata.status)}
      </p>
    );
  }

  return null;
}

export default function ActivityLogSection() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultActivityLogPageSize);
  const [pagination, setPagination] = useState({
    limit: defaultActivityLogPageSize,
    offset: 0,
    total: 0,
  });
  const totalActivityLogs = Number(pagination.total || logs.length || 0);
  const hasScrollableLogs = totalActivityLogs > defaultActivityLogPageSize;

  useEffect(() => {
    let isMounted = true;
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    });

    apiRequest(`/api/activity-logs?${params.toString()}`, { dedupe: false })
      .then((result) => {
        if (!isMounted) return;
        setLogs(result.logs || []);
        setPagination(
          result.pagination || {
            limit: pageSize,
            offset: (page - 1) * pageSize,
            total: result.logs?.length || 0,
          }
        );
        setErrorMessage("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setErrorMessage(error.message || "Failed to load activity logs.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [page, pageSize]);

  return (
    <section className="oas-panel">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading activity logs...
        </div>
      ) : errorMessage ? (
        <p className="p-6 text-center text-sm text-red-600">{errorMessage}</p>
      ) : logs.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          No activity recorded yet.
        </p>
      ) : (
        <div
          className={`divide-y divide-slate-100 ${
            hasScrollableLogs ? "max-h-[640px] overflow-y-auto overscroll-contain" : ""
          }`}
        >
          {logs.map((log) => (
            <article key={log.id} className="px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-950">
                    {actionLabels[log.action] || formatStatus(log.action)}
                  </p>
                  <p className="mt-0.5 break-words text-sm text-slate-700 [overflow-wrap:anywhere]">
                    Action: {getActivitySummary(log)}
                  </p>
                  <ActivityDetails log={log} />
                </div>

                <div className="shrink-0 text-left text-xs text-slate-500 sm:text-right">
                  <p className="font-semibold text-slate-700">
                    {log.actorName}
                  </p>
                  <p>{formatDateTime(log.createdAt)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && logs.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          totalItems={totalActivityLogs}
          currentCount={logs.length}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(1);
          }}
          pageSizeOptions={activityLogPageSizeOptions}
          itemLabel="activity logs"
        />
      )}
    </section>
  );
}
