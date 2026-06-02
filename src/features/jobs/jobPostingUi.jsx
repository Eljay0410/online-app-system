/* eslint-disable react-refresh/only-export-components */
import { getApplicationSubmissionRule, getFixedApplicationRequirements } from "../../lib/applicationRequirements";

export const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

export const formatTime = (value) => {
  const timeValue = String(value || "").slice(0, 5);

  if (!timeValue) return "Not set";

  const [hour, minute] = timeValue.split(":").map(Number);
  const date = new Date(1970, 0, 1, hour || 0, minute || 0);

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

export const formatDeadline = (job) =>
  `Date: ${formatDate(job?.deadline)}. Time: ${formatTime(job?.deadlineTime)}.`;

export function DeadlineDetails({ job, compact = false }) {
  return (
    <span
      className={`grid min-w-0 gap-0.5 ${
        compact ? "text-xs leading-5" : "text-sm leading-6"
      }`}
    >
      <span className="break-words [overflow-wrap:anywhere]">
        <span className="font-semibold">Date:</span> {formatDate(job?.deadline)}
      </span>
      <span className="break-words [overflow-wrap:anywhere]">
        <span className="font-semibold">Time:</span>{" "}
        {formatTime(job?.deadlineTime)}
      </span>
    </span>
  );
}

export const summarizeVacancyItems = (items = []) =>
  items.length
    ? items
        .slice(0, 3)
        .map(
          (item) =>
            `${item.schoolStation}${item.subjectArea ? ` - ${item.subjectArea}` : ""} (${item.vacancyCount})`
        )
        .join("; ") + (items.length > 3 ? `; +${items.length - 3} more` : "")
    : "School/station not set";

export function getJobPositionTitle(job = {}) {
  return (
    job.positionType ||
    job.positionTitle ||
    job.itemPosition ||
    job.title ||
    ""
  );
}

export function getJobSubmissionRule(job = {}) {
  return getApplicationSubmissionRule(getJobPositionTitle(job));
}

export function getJobUploadRequirements(job = {}) {
  return getFixedApplicationRequirements(
    job?.positionCategory || "",
    getJobPositionTitle(job)
  );
}

export function JobInfoCard({ label, value, icon }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 flex items-center gap-2 break-words text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">
        {icon && <span className="text-slate-400">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

export function VacancyBreakdown({ job }) {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:mt-5 sm:p-4">
      <h4 className="text-sm font-bold text-slate-900">
        School / Station Vacancy Breakdown
      </h4>
      {job.vacancyItems?.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">School/Station</th>
                <th className="px-3 py-2">Subject/Learning Area</th>
                <th className="px-3 py-2">Vacancy</th>
              </tr>
            </thead>
            <tbody>
              {job.vacancyItems.map((item) => (
                <tr
                  key={item.id || `${item.schoolStation}-${item.subjectArea}`}
                  className="border-t border-slate-100"
                >
                  <td className="px-3 py-2 font-semibold text-slate-800">
                    {item.schoolStation}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {item.subjectArea || "General"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {item.vacancyCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No school/station vacancy items configured.
        </p>
      )}
    </section>
  );
}

export function QualificationStandards({ job }) {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:mt-5 sm:p-4">
      <h4 className="text-sm font-bold text-slate-900">
        Qualification Standards
      </h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <JobInfoCard label="Education" value={job.education || "N/A"} />
        <JobInfoCard label="Training" value={job.training || "N/A"} />
        <JobInfoCard label="Experience" value={job.experience || "N/A"} />
        <JobInfoCard label="Eligibility" value={job.eligibility || "N/A"} />
      </div>
    </section>
  );
}

export function RequirementSummary({ job }) {
  const submissionRule = getJobSubmissionRule(job);
  const requirements = getJobUploadRequirements(job);

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 sm:mt-5 sm:p-4">
      <h4 className="text-sm font-bold text-slate-900">
        Upload Requirements
      </h4>
      {submissionRule.requiresPersonalSubmission ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">{submissionRule.notice.title}</p>
          <p className="mt-1">
            Documentary requirements must be submitted personally to HR/Admin.
          </p>
        </div>
      ) : requirements.length ? (
        <ul className="mt-3 space-y-2.5">
          {requirements.map((requirement) => (
            <li
              key={requirement.field || requirement.label}
              className="border-b border-slate-200 pb-2.5 last:border-b-0 last:pb-0"
            >
              <p className="min-w-0 break-words text-xs font-semibold text-slate-800 [overflow-wrap:anywhere] sm:text-sm">
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
        <p className="mt-3 text-sm text-slate-500">
          No online upload requirements for this vacancy.
        </p>
      )}
    </section>
  );
}
