import pool from "../config/db.js";
import {
  createJobApplicationFromProfile,
  getApplicationProfileGaps,
  getApplicantEmail,
  getApplicantProfileRecord,
  upsertApplicantProfile,
} from "../services/applicantService.js";
import {
  copyUploadedFileSnapshot,
  toClientFile,
} from "../services/fileStorageService.js";
import {
  mapApplicantProfile,
  mapApplication,
} from "../utils/formatters.js";
import { recordActivityLog } from "../services/activityLogService.js";
import {
  MAIL_FROM_ADDRESS,
  MAIL_FROM_NAME,
  transporter,
} from "../config/mailer.js";

const applicationStatusLabels = {
  draft: "Draft",
  submitted: "Submitted",
  pending_review: "Pending Review",
  for_compliance: "For Compliance",
  under_review: "Under Review",
  qualified: "Qualified",
  rejected: "Rejected",
  hired: "Hired",
};

const allowedStatusTransitions = {
  draft: ["submitted"],
  submitted: ["pending_review", "for_compliance", "under_review", "rejected"],
  pending_review: ["for_compliance", "under_review", "rejected"],
  for_compliance: ["pending_review", "under_review", "rejected"],
  under_review: ["for_compliance", "qualified", "rejected", "hired"],
  qualified: ["hired", "rejected"],
  rejected: [],
  hired: [],
};

const defaultApplicationLimit = 10;
const requirementReviewStatuses = new Set([
  "pending",
  "approved",
  "rejected",
  "needs_resubmission",
  "missing",
]);
const complianceRequirementStatuses = new Set([
  "missing",
  "needs_resubmission",
  "rejected",
]);

function isFinalApplicationStatus(status) {
  return (allowedStatusTransitions[status] || []).length === 0;
}

function formatMailerFrom() {
  return MAIL_FROM_NAME
    ? `"${MAIL_FROM_NAME.replace(/"/g, "'")}" <${MAIL_FROM_ADDRESS}>`
    : MAIL_FROM_ADDRESS;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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

  const fromLabel = applicationStatusLabels[fromStatus] || fromStatus;
  const toLabel = applicationStatusLabels[toStatus] || toStatus;
  const notes = String(reviewNotes || application.reviewNotes || "").trim();
  const applicantName = application.applicantName || "Applicant";
  const jobTitle = application.jobTitle || application.position || "your application";
  const uan = application.uan || "Not assigned";
  const htmlNotes = escapeHtml(notes).replace(/\n/g, "<br>");
  const noteBlock = notes
    ? `\n\nNotes from HR:\n${notes}`
    : "";

  try {
    await transporter.sendMail({
      from: formatMailerFrom(),
      to: application.email,
      subject: `Application status update - ${toLabel}`,
      text: [
        `Hello ${applicantName},`,
        "",
        `Your application for ${jobTitle} has been updated from ${fromLabel} to ${toLabel}.`,
        `UAN: ${uan}${noteBlock}`,
        "",
        "Please sign in to the Online Application System for the full details.",
      ].join("\n"),
      html: `
        <p>Hello ${escapeHtml(applicantName)},</p>
        <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> has been updated from <strong>${escapeHtml(fromLabel)}</strong> to <strong>${escapeHtml(toLabel)}</strong>.</p>
        <p><strong>UAN:</strong> ${escapeHtml(uan)}</p>
        ${notes ? `<p><strong>Notes from HR:</strong><br>${htmlNotes}</p>` : ""}
        <p>Please sign in to the Online Application System for the full details.</p>
      `,
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

function mapApplicationRequirement(row = {}) {
  return {
    id: row.id,
    applicationId: row.job_application_id,
    field: row.requirement_field,
    label: row.requirement_label,
    description: row.requirement_description || "",
    required: row.required !== false,
    status: row.status || "pending",
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
       ja.created_at,
       ja.updated_at,
       u.email,
       u.first_name,
       u.last_name,
       jo.title AS job_title,
       jo.location AS job_location,
       jo.district AS job_district,
       jo.barangay AS job_barangay,
       jo.deadline AS job_deadline,
       jo.deadline_time AS job_deadline_time,
       jo.position_category AS job_position_category,
       jo.requirements AS job_requirements
     FROM job_applications ja
     JOIN users u ON u.id = ja.user_id
     LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
     WHERE ja.id = $1
     LIMIT 1`,
    [applicationId]
  );

  if (result.rowCount === 0) return null;

  const [application] = await attachRequirementsToApplications(client, [
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

function buildAdminApplicationFilters(query = {}) {
  const conditions = [];
  const values = [];
  const search = normalizeQueryValue(query.q || query.search);
  const position = normalizeQueryValue(query.position);
  const location = normalizeQueryValue(query.location);

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

  if (location && location !== "all") {
    values.push(location.toLowerCase());
    conditions.push(`LOWER(${applicationLocationSql}) = $${values.length}`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

async function getAdminApplicationFilterOptions() {
  const [positions, locations] = await Promise.all([
    pool.query(
      `SELECT DISTINCT ${applicationPositionSql} AS value
       FROM job_applications ja
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       WHERE ${applicationPositionSql} <> ''
       ORDER BY value ASC`
    ),
    pool.query(
      `SELECT DISTINCT ${applicationLocationSql} AS value
       FROM job_applications ja
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       WHERE ${applicationLocationSql} <> ''
       ORDER BY value ASC`
    ),
  ]);

  return {
    positions: positions.rows.map((row) => row.value).filter(Boolean),
    locations: locations.rows.map((row) => row.value).filter(Boolean),
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
        ja.created_at,
        ja.updated_at,
        u.email,
        u.first_name,
        u.last_name,
        jo.title AS job_title,
        jo.location AS job_location,
        jo.district AS job_district,
        jo.barangay AS job_barangay,
        jo.deadline AS job_deadline,
        jo.deadline_time AS job_deadline_time,
        jo.position_category AS job_position_category,
        jo.requirements AS job_requirements
      FROM job_applications ja
      JOIN users u ON u.id = ja.user_id
      LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
      ${where}
      ORDER BY ja.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
      values
    );
    const filterOptions = await filterOptionsPromise;

    const applications = await attachRequirementsToApplications(
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

  const allowedStatuses = Object.keys(applicationStatusLabels);

  if (!allowedStatuses.includes(status)) {
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
         SET status = $2,
             review_notes = COALESCE($3, review_notes),
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
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
        jo.location AS job_location,
        jo.district AS job_district,
        jo.barangay AS job_barangay,
        jo.deadline AS job_deadline,
        jo.deadline_time AS job_deadline_time,
        jo.position_category AS job_position_category,
        jo.requirements AS job_requirements
       FROM updated ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id`,
      [req.params.id, status, reviewNotes]
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

async function copyRequirementFileForApplication(client, { requirement, sourceFile }) {
  const copiedFile = await copyUploadedFileSnapshot({
    sourceFile,
    ownerUserId: requirement.user_id,
    jobOpeningId: requirement.job_opening_id,
    jobApplicationId: requirement.job_application_id,
    requirementField: requirement.requirement_field,
  });

  const insertedFile = await client.query(
    `INSERT INTO uploaded_files (
       id,
       owner_user_id,
       applicant_profile_id,
       job_application_id,
       job_opening_id,
       requirement_field,
       requirement_label,
       original_name,
       stored_name,
       relative_path,
       mime_type,
       size_bytes,
       original_size_bytes,
       checksum_sha256,
       image_width,
       image_height,
       status,
       created_at,
       updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15, $16, 'submitted', NOW(), NOW()
     )
     RETURNING id`,
    [
      copiedFile.id,
      requirement.user_id,
      requirement.applicant_profile_id,
      requirement.job_application_id,
      requirement.job_opening_id,
      requirement.requirement_field,
      requirement.requirement_label,
      copiedFile.originalName,
      copiedFile.storedName,
      copiedFile.relativePath,
      copiedFile.mimeType,
      copiedFile.sizeBytes,
      copiedFile.originalSizeBytes,
      copiedFile.checksumSha256,
      copiedFile.width,
      copiedFile.height,
    ]
  );

  return insertedFile.rows[0].id;
}

async function hasComplianceRequirements(client, applicationId) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM application_requirements
       WHERE job_application_id = $1
         AND status = ANY($2::text[])
     ) AS has_compliance`,
    [applicationId, Array.from(complianceRequirementStatuses)]
  );

  return Boolean(result.rows[0]?.has_compliance);
}

export async function updateApplicationRequirementReview(req, res) {
  const status = String(req.body?.status || "").trim().toLowerCase();
  const remarks = String(req.body?.remarks || "").trim();

  if (!requirementReviewStatuses.has(status)) {
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
      [current.id, status, remarks, req.user.id]
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
        status,
        current.file_id,
        remarks,
      ]
    );

    const needsCompliance =
      complianceRequirementStatuses.has(status) ||
      (await hasComplianceRequirements(client, current.job_application_id));
    const nextApplicationStatus = needsCompliance
      ? "for_compliance"
      : current.application_status === "for_compliance" ||
        current.application_status === "submitted" ||
        current.application_status === "pending_review"
      ? "under_review"
      : current.application_status;

    await client.query(
      `UPDATE job_applications
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [current.job_application_id, nextApplicationStatus]
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
        toStatus: status,
        remarks,
      },
    });

    await client.query("COMMIT");
    const mappedApplication = await getMappedApplicationById(
      pool,
      current.job_application_id
    );
    const emailSent =
      nextApplicationStatus !== current.application_status
        ? await sendApplicationStatusEmail({
            application: mappedApplication,
            fromStatus: current.application_status,
            toStatus: nextApplicationStatus,
            reviewNotes: complianceRequirementStatuses.has(status)
              ? [
                  `${current.requirement_label}: ${
                    applicationStatusLabels[nextApplicationStatus] ||
                    nextApplicationStatus
                  }`,
                  remarks,
                ]
                  .filter(Boolean)
                  .join("\n")
              : remarks,
          })
        : false;

    return res.json({
      success: true,
      application: mappedApplication,
      notification: {
        emailSent,
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
  const fileId = String(req.body?.fileId || "").trim();

  if (!fileId) {
    return res.status(400).json({
      success: false,
      message: "Select or upload a replacement file first.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requirementResult = await client.query(
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
         AND ja.user_id = $3
       FOR UPDATE`,
      [req.params.requirementId, req.params.id, req.user.id]
    );

    if (requirementResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Application requirement not found.",
      });
    }

    const requirement = requirementResult.rows[0];

    if (!complianceRequirementStatuses.has(requirement.status)) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "Only problematic requirements can be replaced here.",
      });
    }

    const sourceResult = await client.query(
      `SELECT *
       FROM uploaded_files
       WHERE id = $1
         AND owner_user_id = $2
         AND requirement_field = $3
         AND job_opening_id IS NULL
         AND status = 'active'
       LIMIT 1`,
      [fileId, req.user.id, requirement.requirement_field]
    );
    const sourceFile = sourceResult.rows[0];

    if (!sourceFile) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Replacement file was not found in your document library.",
      });
    }

    const previousFileId = requirement.file_id;
    const snapshotFileId = await copyRequirementFileForApplication(client, {
      requirement,
      sourceFile,
    });

    await client.query(
      `UPDATE application_requirements
       SET file_id = $2,
           source_file_id = $3,
           status = 'pending',
           remarks = NULL,
           submitted_at = NOW(),
           reviewed_by = NULL,
           reviewed_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [requirement.id, snapshotFileId, sourceFile.id]
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
       VALUES ($1, $2, $3, 'resubmit', $4, 'pending', $5, $6, NULL, NOW())`,
      [
        requirement.id,
        requirement.job_application_id,
        req.user.id,
        requirement.status,
        previousFileId,
        snapshotFileId,
      ]
    );

    const stillNeedsCompliance = await hasComplianceRequirements(
      client,
      requirement.job_application_id
    );
    await client.query(
      `UPDATE job_applications
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [
        requirement.job_application_id,
        stillNeedsCompliance ? "for_compliance" : "pending_review",
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      application: await getMappedApplicationById(pool, requirement.job_application_id),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("replaceApplicationRequirementFile error:", error);
    return sendControllerError(res, error, "Failed to replace requirement file");
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
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
        jo.location AS job_location,
        jo.district AS job_district,
        jo.barangay AS job_barangay,
        jo.deadline AS job_deadline,
        jo.deadline_time AS job_deadline_time,
        jo.position_category AS job_position_category,
        jo.requirements AS job_requirements
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
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

    const applications = await attachRequirementsToApplications(
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
        "Complete your applicant profile before applying to a job."
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
          job_deadline: job.deadline,
          job_deadline_time: job.deadline_time,
          job_position_category: job.position_category,
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
          job_deadline: job.deadline,
          job_deadline_time: job.deadline_time,
          job_position_category: job.position_category,
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
