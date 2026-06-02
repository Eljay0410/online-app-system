import pool from "../config/db.js";
import {
  createJobApplicationFromProfile,
  getApplicationProfileGaps,
  getApplicantEmail,
  getApplicantProfileRecord,
  upsertApplicantProfile,
} from "../services/applicantService.js";
import { toClientFile } from "../services/fileStorageService.js";
import {
  mapApplicantProfile,
  mapApplication,
} from "../utils/formatters.js";
import { recordActivityLog } from "../services/activityLogService.js";
import {
  sendSystemMail,
  transporter,
} from "../config/mailer.js";

const applicationStatusLabels = {
  draft: "Draft",
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

const allowedStatusTransitions = {
  draft: ["submitted"],
  submitted: ["reviewed", "qualified", "disqualified", "rejected"],
  reviewed: ["qualified", "shortlisted", "disqualified", "rejected"],
  qualified: ["shortlisted", "selected", "hired", "disqualified", "rejected"],
  shortlisted: ["selected", "hired", "disqualified", "rejected"],
  selected: ["hired", "disqualified", "rejected"],
  pending_review: ["reviewed", "qualified", "disqualified", "rejected"],
  for_compliance: ["reviewed", "qualified", "disqualified", "rejected"],
  under_review: ["reviewed", "qualified", "disqualified", "rejected"],
  rejected: [],
  hired: [],
  disqualified: [],
};
const allowedTargetApplicationStatuses = new Set([
  "submitted",
  "reviewed",
  "qualified",
  "disqualified",
  "shortlisted",
  "selected",
  "hired",
  "rejected",
  "pending_review",
  "for_compliance",
  "under_review",
]);

const defaultApplicationLimit = 10;
const requirementReviewStatuses = new Set([
  "pending",
  "checked",
  "incomplete",
  "invalid",
]);

function isFinalApplicationStatus(status) {
  return (allowedStatusTransitions[status] || []).length === 0;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusEmailTemplate(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  const templates = {
    submitted: {
      subject: "We received your application",
      title: "Thank you for applying",
      message:
        "We have received your application for {jobTitle}.",
      encouragement:
        "Our team will review your submission soon. We appreciate your interest and effort.",
      nextStep:
        "You can sign in to the Online Application System anytime for updates.",
    },
    pending_review: {
      subject: "Your application is in review",
      title: "We are reviewing your application",
      message:
        "Your application for {jobTitle} is now in our review queue.",
      encouragement:
        "Thank you for your patience. We are carefully going through each submission.",
      nextStep:
        "We will notify you once there is a new update.",
    },
    for_compliance: {
      subject: "Your application is in review",
      title: "We are reviewing your application",
      message:
        "Your application for {jobTitle} is now in our review queue.",
      encouragement:
        "Thank you for your patience. We are carefully going through each submission.",
      nextStep:
        "We will notify you once there is a new update.",
    },
    under_review: {
      subject: "Your application is under review",
      title: "Your application is under review",
      message:
        "Your application for {jobTitle} is currently under review.",
      encouragement:
        "We are taking time to give every applicant a fair and careful review.",
      nextStep:
        "We will share the next update as soon as it is ready.",
    },
    reviewed: {
      subject: "Your application has been reviewed",
      title: "Your application has been reviewed",
      message:
        "Your application for {jobTitle} has been reviewed.",
      encouragement:
        "We appreciate the time you spent on your submission.",
      nextStep:
        "We will contact you if we need anything else.",
    },
    qualified: {
      subject: "Good news - you are qualified",
      title: "Congratulations, you are qualified",
      message:
        "Your application for {jobTitle} has met the qualification requirements.",
      encouragement:
        "We are excited to move forward with you.",
      nextStep:
        "Please review the note below and keep your lines open for next steps.",
    },
    shortlisted: {
      subject: "You are shortlisted",
      title: "You are shortlisted",
      message:
        "Your application for {jobTitle} has been shortlisted.",
      encouragement:
        "We are happy to see your profile stand out.",
      nextStep:
        "We will contact you with the next steps soon.",
    },
    selected: {
      subject: "Congratulations - you are selected",
      title: "You are selected",
      message:
        "You have been selected for the next stage for {jobTitle}.",
      encouragement:
        "Great job and thank you for your effort.",
      nextStep:
        "Please watch your email and phone for instructions.",
    },
    hired: {
      subject: "Welcome to the team",
      title: "You are hired",
      message:
        "We are pleased to offer you the role for {jobTitle}.",
      encouragement:
        "Welcome aboard. We look forward to working with you.",
      nextStep:
        "Please sign in to view your onboarding details.",
    },
    rejected: {
      subject: "Update on your application",
      title: "Thank you for applying",
      message:
        "We are sorry to inform you that your application for {jobTitle} did not move forward at this time.",
      encouragement:
        "Please do not be discouraged. We appreciate your interest and effort.",
      nextStep:
        "You are welcome to apply again when new opportunities open.",
    },
    disqualified: {
      subject: "Update on your application",
      title: "Thank you for applying",
      message:
        "We are sorry to inform you that your application for {jobTitle} did not meet the requirements at this time.",
      encouragement:
        "Please keep your head up. We appreciate your interest and effort.",
      nextStep:
        "You are welcome to apply again when new opportunities open.",
    },
    draft: {
      subject: "Your application is saved as draft",
      title: "Your application is saved as draft",
      message:
        "Your application for {jobTitle} is currently saved as a draft.",
      encouragement:
        "Complete your details when you are ready. We are here when you need us.",
      nextStep:
        "Sign in to complete and submit your application.",
    },
    default: {
      subject: "Update on your application",
      title: "Application update",
      message:
        "Here is the latest update for your application for {jobTitle}.",
      encouragement:
        "Thank you for your patience and interest.",
      nextStep:
        "Please sign in to the Online Application System for more details.",
    },
  };

  return templates[normalizedStatus] || templates.default;
}

function getStatusBadgeStyles(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "qualified" || normalizedStatus === "selected") {
    return {
      background: "#ecfdf3",
      border: "#a7f3d0",
      text: "#065f46",
    };
  }

  if (normalizedStatus === "shortlisted" || normalizedStatus === "under_review") {
    return {
      background: "#fff7ed",
      border: "#fdba74",
      text: "#9a3412",
    };
  }

  if (normalizedStatus === "rejected" || normalizedStatus === "disqualified") {
    return {
      background: "#fef2f2",
      border: "#fecaca",
      text: "#b91c1c",
    };
  }

  if (normalizedStatus === "hired") {
    return {
      background: "#ecfeff",
      border: "#a5f3fc",
      text: "#0e7490",
    };
  }

  return {
    background: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  };
}

async function sendApplicationStatusEmail({
  application,
  fromStatus,
  toStatus,
  reviewNotes,
}) {
  if (!transporter || !application?.email) {
    return false;
  }

  const toLabel = applicationStatusLabels[toStatus] || toStatus;
  const rawNotes = String(reviewNotes || application.reviewNotes || "").trim();
  const allowNotes = String(toStatus || "").toLowerCase() === "qualified";
  const notes = allowNotes ? rawNotes : "";
  const applicantName = application.applicantName || "Applicant";
  const jobTitle = application.jobTitle || application.position || "your application";
  const uan = application.uan || "Not assigned";
  const htmlNotes = escapeHtml(notes).replace(/\n/g, "<br>");
  const noteBlock = notes ? `\n\nNote from HR:\n${notes}` : "";
  const template = getStatusEmailTemplate(toStatus);
  const statusBadge = getStatusBadgeStyles(toStatus);
  const message = template.message.replace("{jobTitle}", jobTitle);
  const encouragement = template.encouragement;
  const nextStep = template.nextStep;
  const subject = template.subject;

  try {
    await sendSystemMail({
      to: application.email,
      subject,
      text: [
        `Hello ${applicantName},`,
        "",
        template.title,
        message,
        encouragement,
        "",
        `Status: ${toLabel}`,
        `UAN: ${uan}${noteBlock}`,
        "",
        nextStep,
      ].join("\n"),
      html: `
        <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial, sans-serif;color:#0f172a;text-align:left;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;text-align:left;">
            <div style="padding:24px 28px;background:#0f172a;color:#ffffff;text-align:left;">
              <div style="font-size:13px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Online Application System</div>
              <h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;">${escapeHtml(template.title)}</h1>
            </div>
            <div style="padding:24px 28px;text-align:left;">
              <p style="margin:0 0 14px;font-size:15px;">Hello ${escapeHtml(applicantName)},</p>
              <p style="margin:0 0 14px;font-size:15px;">${escapeHtml(message)}</p>
              <p style="margin:0 0 18px;font-size:14px;color:#475569;">${escapeHtml(encouragement)}</p>
              <div style="margin:18px auto 20px;max-width:420px;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;padding:14px;text-align:center;">
                <div style="margin:0 0 10px;display:inline-block;padding:6px 12px;border-radius:999px;border:1px solid ${statusBadge.border};background:${statusBadge.background};color:${statusBadge.text};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                  Status: ${escapeHtml(toLabel)}
                </div>
                <p style="margin:0 0 6px;font-size:14px;"><strong>Position:</strong> ${escapeHtml(jobTitle)}</p>
                <p style="margin:0;font-size:14px;"><strong>UAN:</strong> ${escapeHtml(uan)}</p>
              </div>
              ${notes ? `<div style="margin:18px 0 0;padding:14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;text-align:left;"><p style="margin:0 0 6px;font-weight:700;font-size:13px;">Note from HR</p><p style="margin:0;font-size:14px;color:#334155;">${htmlNotes}</p></div>` : ""}
              <p style="margin:22px 0 0;font-size:14px;color:#475569;">${escapeHtml(nextStep)}</p>
            </div>
            <div style="padding:16px 28px;border-top:1px solid #e2e8f0;background:#f8fafc;font-size:12px;color:#64748b;text-align:left;">
              Thank you for your interest in DepEd opportunities.
            </div>
          </div>
        </div>
      `,
      headers: {
        "X-OAS-Email-Purpose": "application_status",
      },
    });

    return true;
  } catch (error) {
    console.error("Failed to send application status email:", error?.message || error);
    return false;
  }
}

function sendControllerError(res, error, fallbackMessage) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
}

function getJobOpeningId(payload = {}) {
  return (
    payload.jobOpeningId ||
    payload.job_opening_id ||
    payload.jobPosition?.jobOpeningId ||
    payload.job?.id ||
    null
  );
}

function getPagination(query = {}) {
  const limit = Number.parseInt(query.limit || String(defaultApplicationLimit), 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 200)
      : defaultApplicationLimit,
    offset: Number.isInteger(offset) ? Math.max(offset, 0) : 0,
  };
}

function normalizeQueryValue(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeDateValue(value) {
  const normalizedValue = String(value || "").trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)
    ? normalizedValue
    : "";
}

function mapRequirementFile(row = {}) {
  if (!row.file_id) return null;

  return toClientFile({
    id: row.file_id,
    original_name: row.file_original_name,
    stored_name: row.file_stored_name,
    relative_path: row.file_relative_path,
    mime_type: row.file_mime_type,
    size_bytes: row.file_size_bytes,
    original_size_bytes: row.file_original_size_bytes,
    checksum_sha256: row.file_checksum_sha256,
    image_width: row.file_image_width,
    image_height: row.file_image_height,
    requirement_field: row.requirement_field,
    requirement_label: row.requirement_label,
    status: row.file_status,
    created_at: row.file_created_at,
  });
}

function normalizeRequirementReviewStatus(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "approved") return "checked";
  if (normalizedStatus === "missing") return "incomplete";
  if (normalizedStatus === "rejected") return "invalid";

  return normalizedStatus || "pending";
}

function mapApplicationRequirement(row = {}) {
  const status = normalizeRequirementReviewStatus(row.status);

  return {
    id: row.id,
    applicationId: row.job_application_id,
    field: row.requirement_field,
    label: row.requirement_label,
    description: row.requirement_description || "",
    required: row.required !== false,
    status,
    remarks: row.remarks || "",
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    file: mapRequirementFile(row),
    sourceFileId: row.source_file_id || null,
  };
}

async function getApplicationRequirements(client, applicationIds = []) {
  const ids = Array.from(
    new Set(
      applicationIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (ids.length === 0) return new Map();

  const result = await client.query(
    `SELECT
       ar.*,
       uf.id AS file_id,
       uf.original_name AS file_original_name,
       uf.stored_name AS file_stored_name,
       uf.relative_path AS file_relative_path,
       uf.mime_type AS file_mime_type,
       uf.size_bytes AS file_size_bytes,
       uf.original_size_bytes AS file_original_size_bytes,
       uf.checksum_sha256 AS file_checksum_sha256,
       uf.image_width AS file_image_width,
       uf.image_height AS file_image_height,
       uf.status AS file_status,
       uf.created_at AS file_created_at
     FROM application_requirements ar
     LEFT JOIN uploaded_files uf ON uf.id = ar.file_id
     WHERE ar.job_application_id = ANY($1::int[])
     ORDER BY ar.id ASC`,
    [ids]
  );

  return result.rows.reduce((groups, row) => {
    const key = Number(row.job_application_id);
    const next = groups.get(key) || [];
    next.push(mapApplicationRequirement(row));
    groups.set(key, next);
    return groups;
  }, new Map());
}

async function attachRequirementsToApplications(client, applications = []) {
  const requirementMap = await getApplicationRequirements(
    client,
    applications.map((application) => application.id)
  );

  return applications.map((application) => ({
    ...application,
    requirements: requirementMap.get(Number(application.id)) || [],
  }));
}

async function getJobItemsByOpeningIds(client, jobOpeningIds = []) {
  const ids = Array.from(
    new Set(
      jobOpeningIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (ids.length === 0) return new Map();

  const result = await client.query(
    `SELECT id, job_opening_id, school_station, subject_area,
       vacancy_count, assigned_count, created_at, updated_at
     FROM job_opening_items
     WHERE job_opening_id = ANY($1::int[])
     ORDER BY school_station ASC, subject_area ASC, id ASC`,
    [ids]
  );

  return result.rows.reduce((groups, row) => {
    const key = Number(row.job_opening_id);
    const next = groups.get(key) || [];
    next.push({
      id: row.id,
      jobOpeningId: row.job_opening_id,
      schoolStation: row.school_station || "",
      subjectArea: row.subject_area || "",
      vacancyCount: Number(row.vacancy_count || 0),
      assignedCount: Number(row.assigned_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
    groups.set(key, next);
    return groups;
  }, new Map());
}

async function attachJobItemsToApplications(client, applications = []) {
  const itemMap = await getJobItemsByOpeningIds(
    client,
    applications.map((application) => application.jobOpeningId)
  );

  return applications.map((application) => ({
    ...application,
    jobItems: itemMap.get(Number(application.jobOpeningId)) || [],
  }));
}

async function attachApplicationDetails(client, applications = []) {
  const withRequirements = await attachRequirementsToApplications(
    client,
    applications
  );

  return attachJobItemsToApplications(client, withRequirements);
}

async function getMappedApplicationById(client, applicationId) {
  const result = await client.query(
    `SELECT
       ja.id,
       ja.user_id,
       ja.applicant_profile_id,
       ja.job_opening_id,
       ja.uan,
       ja.data,
       ja.status,
       ja.review_notes,
       ja.reviewed_by,
       ja.reviewed_at,
       ja.admin_remarks,
       ja.created_at,
       ja.updated_at,
       u.email,
       u.first_name,
       u.last_name,
       jo.title AS job_title,
       jo.location AS job_location,
       jo.district AS job_district,
       jo.barangay AS job_barangay,
       jo.vacancy AS job_vacancy,
       jo.deadline AS job_deadline,
       jo.deadline_time AS job_deadline_time,
       jo.position_category AS job_position_category,
       jo.salary_grade AS job_salary_grade,
       jo.salary_amount AS job_salary_amount,
       jo.education AS job_education,
       jo.training AS job_training,
       jo.experience AS job_experience,
       jo.eligibility AS job_eligibility,
       jo.description AS job_description,
       jo.requirements AS job_requirements,
       aa.job_opening_item_id AS assigned_item_id,
       aa.assigned_by,
       aa.assigned_at,
       assigned_item.school_station AS assigned_school_station,
       assigned_item.subject_area AS assigned_subject_area,
       assigned_item.vacancy_count AS assigned_vacancy_count,
       assigned_item.assigned_count
     FROM job_applications ja
     JOIN users u ON u.id = ja.user_id
     LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
     LEFT JOIN application_assignments aa ON aa.job_application_id = ja.id
     LEFT JOIN job_opening_items assigned_item ON assigned_item.id = aa.job_opening_item_id
     WHERE ja.id = $1
     LIMIT 1`,
    [applicationId]
  );

  if (result.rowCount === 0) return null;

  const [application] = await attachApplicationDetails(client, [
    mapApplication(result.rows[0]),
  ]);
  return application;
}

const applicationPositionSql = `COALESCE(
  jo.title,
  ja.data->'job'->>'title',
  ja.data->'jobPosition'->>'positionType',
  ja.data->'jobPosition'->>'positionCategory',
  ja.data->>'position',
  ''
)`;

const applicationLocationSql = `COALESCE(
  jo.location,
  ja.data->'job'->>'location',
  ''
)`;

const applicationSchoolSql = `COALESCE(
  NULLIF(SPLIT_PART(${applicationLocationSql}, ',', 1), ''),
  ${applicationLocationSql}
)`;

function buildAdminApplicationFilters(query = {}) {
  const conditions = [];
  const values = [];
  const search = normalizeQueryValue(query.q || query.search);
  const position = normalizeQueryValue(query.position);
  const school = normalizeQueryValue(query.school || query.location);
  const status = normalizeQueryValue(query.status).toLowerCase();
  const specificDate = normalizeDateValue(query.date || query.applicationDate);
  const dateFrom = normalizeDateValue(query.dateFrom || query.from);
  const dateTo = normalizeDateValue(query.dateTo || query.to);

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(u.email) LIKE $${values.length}
        OR LOWER(u.first_name) LIKE $${values.length}
        OR LOWER(u.last_name) LIKE $${values.length}
        OR LOWER(CONCAT_WS(' ', u.first_name, u.last_name)) LIKE $${values.length}
        OR LOWER(ja.uan) LIKE $${values.length}
        OR LOWER(${applicationPositionSql}) LIKE $${values.length}
        OR LOWER(${applicationLocationSql}) LIKE $${values.length})`
    );
  }

  if (position && position !== "all") {
    values.push(position.toLowerCase());
    conditions.push(`LOWER(${applicationPositionSql}) = $${values.length}`);
  }

  if (school && school !== "all") {
    values.push(school.toLowerCase());
    conditions.push(`LOWER(${applicationSchoolSql}) = $${values.length}`);
  }

  if (status && status !== "all") {
    values.push(status);
    conditions.push(`ja.status = $${values.length}`);
  }

  if (specificDate) {
    values.push(specificDate);
    conditions.push(
      `(ja.created_at >= $${values.length}::date AND ja.created_at < ($${values.length}::date + INTERVAL '1 day'))`
    );
  } else {
    if (dateFrom) {
      values.push(dateFrom);
      conditions.push(`ja.created_at >= $${values.length}::date`);
    }

    if (dateTo) {
      values.push(dateTo);
      conditions.push(
        `ja.created_at < ($${values.length}::date + INTERVAL '1 day')`
      );
    }
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

async function getAdminApplicationFilterOptions() {
  const [positions, schools] = await Promise.all([
    pool.query(
      `SELECT DISTINCT ${applicationPositionSql} AS value
       FROM job_applications ja
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       WHERE ${applicationPositionSql} <> ''
       ORDER BY value ASC`
    ),
    pool.query(
      `SELECT DISTINCT ${applicationSchoolSql} AS value
       FROM job_applications ja
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       WHERE ${applicationSchoolSql} <> ''
       ORDER BY value ASC`
    ),
  ]);

  return {
    positions: positions.rows.map((row) => row.value).filter(Boolean),
    schools: schools.rows.map((row) => row.value).filter(Boolean),
    locations: schools.rows.map((row) => row.value).filter(Boolean),
  };
}

function mapProfileResponse(user, profile) {
  return mapApplicantProfile({
    ...profile,
    user_id: user.id,
    email: user.email,
    first_name: user.first_name,
    middle_name: user.middle_name,
    no_middle_name: user.no_middle_name,
    last_name: user.last_name,
    contact_number: user.contact_number,
    user_uan: user.uan,
  });
}

export async function listAdminApplications(req, res) {
  try {
    const { limit, offset } = getPagination(req.query);
    const { where, values } = buildAdminApplicationFilters(req.query);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       ${where}`,
      values
    );
    const filterOptionsPromise = getAdminApplicationFilterOptions();

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `
      SELECT
        ja.id,
        ja.user_id,
        ja.applicant_profile_id,
        ja.job_opening_id,
        ja.uan,
        ja.data,
        ja.status,
        ja.review_notes,
        ja.reviewed_by,
        ja.reviewed_at,
        ja.admin_remarks,
        ja.created_at,
        ja.updated_at,
        u.email,
        u.first_name,
        u.last_name,
        jo.title AS job_title,
        jo.location AS job_location,
        jo.district AS job_district,
        jo.barangay AS job_barangay,
        jo.vacancy AS job_vacancy,
        jo.deadline AS job_deadline,
        jo.deadline_time AS job_deadline_time,
        jo.position_category AS job_position_category,
        jo.salary_grade AS job_salary_grade,
        jo.salary_amount AS job_salary_amount,
        jo.education AS job_education,
        jo.training AS job_training,
        jo.experience AS job_experience,
        jo.eligibility AS job_eligibility,
        jo.description AS job_description,
        jo.requirements AS job_requirements,
        aa.job_opening_item_id AS assigned_item_id,
        aa.assigned_by,
        aa.assigned_at,
        assigned_item.school_station AS assigned_school_station,
        assigned_item.subject_area AS assigned_subject_area,
        assigned_item.vacancy_count AS assigned_vacancy_count,
        assigned_item.assigned_count
      FROM job_applications ja
      JOIN users u ON u.id = ja.user_id
      LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
      LEFT JOIN application_assignments aa ON aa.job_application_id = ja.id
      LEFT JOIN job_opening_items assigned_item ON assigned_item.id = aa.job_opening_item_id
      ${where}
      ORDER BY ja.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
      values
    );
    const filterOptions = await filterOptionsPromise;

    const applications = await attachApplicationDetails(
      pool,
      result.rows.map(mapApplication)
    );

    res.json({
      success: true,
      applications,
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
      filters: filterOptions,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
}

export async function updateApplicationStatus(req, res) {
  const { status } = req.body || {};
  const reviewNotes =
    req.body?.reviewNotes === undefined
      ? null
      : String(req.body.reviewNotes || "").trim();

  if (!allowedTargetApplicationStatuses.has(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid application status.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT id, status, review_notes
       FROM job_applications
       WHERE id = $1
       FOR UPDATE`,
      [req.params.id]
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const currentStatus = currentResult.rows[0].status || "submitted";
    const currentReviewNotes = currentResult.rows[0].review_notes || "";
    const nextStatuses = allowedStatusTransitions[currentStatus] || [];
    const isSameStatus = currentStatus === status;
    const hasReviewNoteChange =
      reviewNotes !== null && reviewNotes !== currentReviewNotes;

    if (!isSameStatus && !nextStatuses.includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Application status must follow the flow. ${applicationStatusLabels[currentStatus] || currentStatus} can only move to ${
          nextStatuses.map((item) => applicationStatusLabels[item]).join(" or ") ||
          "no further status"
        }.`,
      });
    }

    if (
      isSameStatus &&
      isFinalApplicationStatus(currentStatus) &&
      hasReviewNoteChange
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Final application review notes cannot be edited.",
      });
    }

    const result = await client.query(
      `WITH updated AS (
         UPDATE job_applications
         SET status = $2::varchar(30),
             review_notes = COALESCE($3, review_notes),
             admin_remarks = COALESCE($3, admin_remarks),
             reviewed_by = CASE
               WHEN $2::varchar(30) IN ('reviewed', 'qualified', 'disqualified', 'shortlisted', 'selected', 'hired', 'rejected')
               THEN $4
               ELSE reviewed_by
             END,
             reviewed_at = CASE
               WHEN $2::varchar(30) IN ('reviewed', 'qualified', 'disqualified', 'shortlisted', 'selected', 'hired', 'rejected')
               THEN NOW()
               ELSE reviewed_at
             END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *
       )
       SELECT
         ja.id,
         ja.user_id,
         ja.applicant_profile_id,
         ja.job_opening_id,
         ja.uan,
         ja.data,
         ja.status,
         ja.review_notes,
         ja.reviewed_by,
         ja.reviewed_at,
         ja.admin_remarks,
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.district AS job_district,
         jo.barangay AS job_barangay,
         jo.vacancy AS job_vacancy,
         jo.deadline AS job_deadline,
         jo.deadline_time AS job_deadline_time,
         jo.position_category AS job_position_category,
         jo.salary_grade AS job_salary_grade,
         jo.salary_amount AS job_salary_amount,
         jo.education AS job_education,
         jo.training AS job_training,
         jo.experience AS job_experience,
         jo.eligibility AS job_eligibility,
         jo.description AS job_description,
         jo.requirements AS job_requirements,
        aa.job_opening_item_id AS assigned_item_id,
        aa.assigned_by,
        aa.assigned_at,
        assigned_item.school_station AS assigned_school_station,
        assigned_item.subject_area AS assigned_subject_area,
        assigned_item.vacancy_count AS assigned_vacancy_count,
        assigned_item.assigned_count
       FROM updated ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       LEFT JOIN application_assignments aa ON aa.job_application_id = ja.id
       LEFT JOIN job_opening_items assigned_item ON assigned_item.id = aa.job_opening_item_id`,
      [req.params.id, status, reviewNotes, req.user?.id || null]
    );
    const application = mapApplication(result.rows[0]);

    if (!isSameStatus) {
      await recordActivityLog(client, {
        actor: req.user,
        action: "application.status_changed",
        entityType: "job_application",
        entityId: application.id,
        entityLabel: `${application.applicantName} - ${application.jobTitle}`,
        metadata: {
          fromStatus: currentStatus,
          toStatus: status,
          uan: application.uan,
          reviewNotes,
        },
      });
    }

    await client.query("COMMIT");
    const mappedApplication =
      (await getMappedApplicationById(pool, application.id)) || application;
    const emailSent = !isSameStatus
      ? await sendApplicationStatusEmail({
          application: mappedApplication,
          fromStatus: currentStatus,
          toStatus: status,
          reviewNotes,
        })
      : false;

    res.json({
      success: true,
      application: mappedApplication,
      notification: {
        emailSent,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error updating application status:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update application status",
    });
  } finally {
    client.release();
  }
}

export async function updateApplicationRequirementReview(req, res) {
  const status = String(req.body?.status || "").trim().toLowerCase();
  const remarks = String(req.body?.remarks || "").trim();
  const normalizedStatus = normalizeRequirementReviewStatus(status);

  if (!requirementReviewStatuses.has(normalizedStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid requirement review status.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT
         ar.*,
         ja.user_id,
         ja.applicant_profile_id,
         ja.job_opening_id,
         ja.status AS application_status
       FROM application_requirements ar
       JOIN job_applications ja ON ja.id = ar.job_application_id
       WHERE ar.id = $1
         AND ar.job_application_id = $2
       FOR UPDATE`,
      [req.params.requirementId, req.params.id]
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Application requirement not found.",
      });
    }

    const current = currentResult.rows[0];
    const previousStatus = current.status || "pending";

    await client.query(
      `UPDATE application_requirements
       SET status = $2,
           remarks = $3,
           reviewed_by = $4,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [current.id, normalizedStatus, remarks, req.user.id]
    );

    await client.query(
      `INSERT INTO application_requirement_history (
         application_requirement_id,
         job_application_id,
         actor_user_id,
         action,
         from_status,
         to_status,
         previous_file_id,
         next_file_id,
         remarks,
         created_at
       )
       VALUES ($1, $2, $3, 'review', $4, $5, $6, $6, $7, NOW())`,
      [
        current.id,
        current.job_application_id,
        req.user.id,
        previousStatus,
        normalizedStatus,
        current.file_id,
        remarks,
      ]
    );

    await recordActivityLog(client, {
      actor: req.user,
      action: "application.requirement_reviewed",
      entityType: "job_application",
      entityId: current.job_application_id,
      entityLabel: current.requirement_label,
      metadata: {
        requirementId: current.id,
        requirementField: current.requirement_field,
        fromStatus: previousStatus,
        toStatus: normalizedStatus,
        remarks,
      },
    });

    await client.query("COMMIT");
    const mappedApplication = await getMappedApplicationById(
      pool,
      current.job_application_id
    );

    return res.json({
      success: true,
      application: mappedApplication,
      notification: {
        emailSent: false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("updateApplicationRequirementReview error:", error);
    return sendControllerError(res, error, "Failed to update requirement review");
  } finally {
    client.release();
  }
}

export async function replaceApplicationRequirementFile(req, res) {
  return res.status(410).json({
    success: false,
    message:
      "Requirement reupload requests are no longer part of the review flow. Upload fixed requirements from the Requirements / Documents page before applying.",
  });
}

export async function assignApplicationToVacancyItem(req, res) {
  const applicationId = Number.parseInt(req.params.id, 10);
  const jobOpeningItemId = Number.parseInt(req.body?.jobOpeningItemId, 10);

  if (!Number.isInteger(applicationId) || applicationId <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid application is required.",
    });
  }

  if (!Number.isInteger(jobOpeningItemId) || jobOpeningItemId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Select a school/station vacancy item.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const applicationResult = await client.query(
      `SELECT id, job_opening_id, status
       FROM job_applications
       WHERE id = $1
       FOR UPDATE`,
      [applicationId]
    );
    const application = applicationResult.rows[0];

    if (!application) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (!["qualified", "shortlisted", "selected", "hired"].includes(application.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message:
          "Only qualified, shortlisted, selected, or hired applicants can be assigned to a vacancy item.",
      });
    }

    const itemResult = await client.query(
      `SELECT id, job_opening_id, school_station, subject_area,
         vacancy_count, assigned_count
       FROM job_opening_items
       WHERE id = $1
         AND job_opening_id = $2
       FOR UPDATE`,
      [jobOpeningItemId, application.job_opening_id]
    );
    const item = itemResult.rows[0];

    if (!item) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Vacancy item not found for this application.",
      });
    }

    const existingResult = await client.query(
      `SELECT aa.*, joi.id AS previous_item_id
       FROM application_assignments aa
       JOIN job_opening_items joi ON joi.id = aa.job_opening_item_id
       WHERE aa.job_application_id = $1
       FOR UPDATE`,
      [applicationId]
    );
    const existingAssignment = existingResult.rows[0];

    if (Number(existingAssignment?.job_opening_item_id) === Number(item.id)) {
      await client.query("COMMIT");
      return res.json({
        success: true,
        application: await getMappedApplicationById(pool, applicationId),
      });
    }

    if (Number(item.assigned_count || 0) >= Number(item.vacancy_count || 0)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "This school/station vacancy item has no remaining slots.",
      });
    }

    if (existingAssignment) {
      await client.query(
        `UPDATE job_opening_items
         SET assigned_count = GREATEST(assigned_count - 1, 0),
             updated_at = NOW()
         WHERE id = $1`,
        [existingAssignment.job_opening_item_id]
      );

      await client.query(
        `UPDATE application_assignments
         SET job_opening_item_id = $2,
             assigned_by = $3,
             assigned_at = NOW()
         WHERE job_application_id = $1`,
        [applicationId, item.id, req.user?.id || null]
      );
    } else {
      await client.query(
        `INSERT INTO application_assignments (
           job_application_id, job_opening_item_id, assigned_by, assigned_at
         )
         VALUES ($1, $2, $3, NOW())`,
        [applicationId, item.id, req.user?.id || null]
      );
    }

    await client.query(
      `UPDATE job_opening_items
       SET assigned_count = assigned_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [item.id]
    );

    await recordActivityLog(client, {
      actor: req.user,
      action: "application.assigned",
      entityType: "job_application",
      entityId: applicationId,
      entityLabel: `${item.school_station}${item.subject_area ? ` - ${item.subject_area}` : ""}`,
      metadata: {
        jobOpeningItemId: item.id,
        schoolStation: item.school_station,
        subjectArea: item.subject_area,
      },
    });

    await client.query("COMMIT");

    return res.json({
      success: true,
      application: await getMappedApplicationById(pool, applicationId),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("assignApplicationToVacancyItem error:", error);
    return sendControllerError(res, error, "Failed to assign applicant");
  } finally {
    client.release();
  }
}

export async function listApplicantApplications(req, res) {
  const email = req.user?.email || getApplicantEmail(req.query);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const { limit, offset } = getPagination(req.query);
    const status = normalizeQueryValue(req.query.status);
    const conditions = ["LOWER(u.email) = LOWER($1)"];
    const values = [email];

    if (status && status !== "all") {
      values.push(status);
      conditions.push(`ja.status = $${values.length}`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const [countResult, statusCountsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM job_applications ja
         JOIN users u ON u.id = ja.user_id
         ${where}`,
        values
      ),
      pool.query(
        `SELECT ja.status, COUNT(*)::int AS count
         FROM job_applications ja
         JOIN users u ON u.id = ja.user_id
         WHERE LOWER(u.email) = LOWER($1)
         GROUP BY ja.status`,
        [email]
      ),
    ]);

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT
         ja.id,
         ja.user_id,
         ja.applicant_profile_id,
         ja.job_opening_id,
         ja.uan,
         ja.data,
         ja.status,
         ja.review_notes,
         ja.reviewed_by,
         ja.reviewed_at,
         ja.admin_remarks,
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.district AS job_district,
         jo.barangay AS job_barangay,
         jo.vacancy AS job_vacancy,
         jo.deadline AS job_deadline,
         jo.deadline_time AS job_deadline_time,
         jo.position_category AS job_position_category,
         jo.salary_grade AS job_salary_grade,
         jo.salary_amount AS job_salary_amount,
         jo.education AS job_education,
         jo.training AS job_training,
         jo.experience AS job_experience,
         jo.eligibility AS job_eligibility,
         jo.description AS job_description,
         jo.requirements AS job_requirements,
        aa.job_opening_item_id AS assigned_item_id,
        aa.assigned_by,
        aa.assigned_at,
        assigned_item.school_station AS assigned_school_station,
        assigned_item.subject_area AS assigned_subject_area,
        assigned_item.vacancy_count AS assigned_vacancy_count,
        assigned_item.assigned_count
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       LEFT JOIN application_assignments aa ON aa.job_application_id = ja.id
       LEFT JOIN job_opening_items assigned_item ON assigned_item.id = aa.job_opening_item_id
       ${where}
       ORDER BY ja.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const statusCounts = statusCountsResult.rows.reduce(
      (counts, row) => ({
        ...counts,
        [row.status || "submitted"]: row.count,
        all: (counts.all || 0) + row.count,
      }),
      { all: 0 }
    );

    const applications = await attachApplicationDetails(
      pool,
      result.rows.map(mapApplication)
    );

    res.json({
      success: true,
      applications,
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
      statusCounts,
    });
  } catch (error) {
    console.error("Error fetching applicant applications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
}

export async function getApplicantProfile(req, res) {
  const email = req.user?.email || getApplicantEmail(req.query);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const record = await getApplicantProfileRecord(pool, email);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Applicant account not found.",
      });
    }

    const mappedProfile = mapApplicantProfile(record);

    return res.json({
      success: true,
      profileComplete: Boolean(mappedProfile?.profileComplete),
      profile: mappedProfile,
      applicationProfileGaps: getApplicationProfileGaps(record.data || {}),
      user: {
        id: record.user_id,
        email: record.email,
        firstName: record.first_name || "",
        middleName: record.middle_name || "",
        noMiddleName: Boolean(record.no_middle_name),
        lastName: record.last_name || "",
        contactNumber: record.contact_number || "",
        role: record.role,
        uan: String(record.uan || record.user_uan || "").toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error fetching applicant profile:", error);
    return sendControllerError(
      res,
      error,
      "Failed to fetch applicant profile"
    );
  }
}

export async function saveApplicantProfile(req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const payload = {
      ...(req.body || {}),
      email: req.user.email,
      personalInfo: {
        ...(req.body?.personalInfo || req.body?.profileData?.personalInfo || {}),
        emailAddress: req.user.email,
      },
    };
    const { user, profile } = await upsertApplicantProfile(client, payload);
    const mappedProfile = mapProfileResponse(user, profile);

    await client.query("COMMIT");

    return res.json({
      success: true,
      profileComplete: Boolean(mappedProfile?.profileComplete),
      uan: String(profile.uan).toUpperCase(),
      userId: user.id,
      profile: mappedProfile,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("saveApplicantProfile error:", error);
    return sendControllerError(res, error, "Failed to save applicant profile");
  } finally {
    client.release();
  }
}

export async function applyToJob(req, res) {
  const email = req.user?.email;
  const jobOpeningId = getJobOpeningId(req.body);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const record = await getApplicantProfileRecord(client, email);

    if (!record?.id) {
      const error = new Error(
        "Complete your applicant profile before applying to a vacancy."
      );
      error.statusCode = 409;
      throw error;
    }

    const user = {
      id: record.user_id,
      email: record.email,
      first_name: record.first_name,
      last_name: record.last_name,
      uan: record.uan || record.user_uan,
    };

    const profile = {
      id: record.id,
      uan: record.uan || record.user_uan,
      data: record.data || {},
    };

    const { application, job } = await createJobApplicationFromProfile(client, {
      user,
      profile,
      jobOpeningId,
      applicationData: req.body?.applicationData || {},
      requirementFiles: req.body?.requirementFiles || {},
    });

    await client.query("COMMIT");

    const mappedApplication = await getMappedApplicationById(pool, application.id);

    return res.status(201).json({
      success: true,
      application:
        mappedApplication ||
        mapApplication({
          ...application,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          job_title: job.title,
          job_location: job.location,
          job_district: job.district,
          job_barangay: job.barangay,
          job_vacancy: job.vacancy,
          job_deadline: job.deadline,
          job_deadline_time: job.deadline_time,
          job_position_category: job.position_category,
          job_salary_grade: job.salary_grade,
          job_salary_amount: job.salary_amount,
          job_education: job.education,
          job_training: job.training,
          job_experience: job.experience,
          job_eligibility: job.eligibility,
          job_description: job.description,
          job_requirements: job.requirements,
        }),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("applyToJob error:", error);
    return sendControllerError(res, error, "Failed to submit application");
  } finally {
    client.release();
  }
}

export async function submitApplication(req, res) {
  const incomingProfileData = req.body?.profileData || req.body || {};
  const profileData = {
    ...incomingProfileData,
    email: req.user?.email || getApplicantEmail(incomingProfileData),
    personalInfo: {
      ...(incomingProfileData.personalInfo || {}),
      emailAddress: req.user?.email || getApplicantEmail(incomingProfileData),
    },
  };
  const email = getApplicantEmail(profileData);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Missing applicant email.",
    });
  }

  const client = await pool.connect();
  let createdApplication = null;

  try {
    await client.query("BEGIN");

    const { user, profile } = await upsertApplicantProfile(client, profileData);
    const jobOpeningId = getJobOpeningId(profileData);

    if (jobOpeningId) {
      const { application, job } = await createJobApplicationFromProfile(
        client,
        {
          user,
          profile,
          jobOpeningId,
          applicationData: profileData,
          requirementFiles: req.body?.requirementFiles || profileData.requirementFiles || {},
        }
      );

      createdApplication =
        (await getMappedApplicationById(client, application.id)) ||
        mapApplication({
          ...application,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          job_title: job.title,
          job_location: job.location,
          job_district: job.district,
          job_barangay: job.barangay,
          job_vacancy: job.vacancy,
          job_deadline: job.deadline,
          job_deadline_time: job.deadline_time,
          job_position_category: job.position_category,
          job_salary_grade: job.salary_grade,
          job_salary_amount: job.salary_amount,
          job_education: job.education,
          job_training: job.training,
          job_experience: job.experience,
          job_eligibility: job.eligibility,
          job_description: job.description,
          job_requirements: job.requirements,
        });
    }

    await client.query("COMMIT");
    const mappedProfile = mapProfileResponse(user, profile);

    return res.json({
      success: true,
      profileComplete: Boolean(mappedProfile?.profileComplete),
      uan: String(profile.uan).toUpperCase(),
      userId: user.id,
      profile: mappedProfile,
      application: createdApplication,
      applicationCreated: Boolean(createdApplication),
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("/api/submit-application error:", err);

    return sendControllerError(res, err, "Server error");
  } finally {
    client.release();
  }
}
