import path from "path";
import pool from "../config/db.js";
import {
  uploadCleanupRetentionDays,
  uploadMaxFilesPerRequirement,
} from "../config/env.js";
import { assignUan } from "../services/uanService.js";
import {
  getUploadStorageStats,
  removeStoredFile,
  safeResolveUploadPath,
  storeRequirementFile,
  toClientFile,
} from "../services/fileStorageService.js";
import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirement,
  getFixedApplicationRequirements,
} from "../config/applicationRequirements.js";

function parsePositiveInt(value) {
  const number = Number.parseInt(value || "", 10);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeRequirementField(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

function getRequestedPositionTitle(body = {}) {
  return (
    body.positionTitle ||
    body.positionType ||
    body.jobTitle ||
    body.title ||
    body.job?.title ||
    body.jobPosition?.positionType ||
    body.jobPosition?.title ||
    ""
  );
}

function assertOnlineUploadAllowedForPosition(positionTitle = "") {
  const submissionRule = getApplicationSubmissionRule(positionTitle);

  if (!submissionRule.canUploadRequirements) {
    const error = new Error(
      submissionRule.notice?.message ||
        "This position requires personal submission of documentary requirements."
    );
    error.statusCode = 403;
    error.code = "TEACHER_I_PERSONAL_SUBMISSION_ONLY";
    throw error;
  }
}

function getRequirementSignature(requirements = []) {
  const list = Array.isArray(requirements) ? requirements : [];

  return JSON.stringify(
    list.map((requirement) => ({
      field: String(requirement?.field || ""),
      label: String(requirement?.label || ""),
      description: String(requirement?.description || ""),
      required: requirement?.required !== false,
    }))
  );
}

function normalizeRequirementList(requirements, category = "", title = "") {
  const fallback = getFixedApplicationRequirements(category, title);
  const list =
    typeof requirements === "string"
      ? (() => {
          try {
            return JSON.parse(requirements);
          } catch {
            return [];
          }
        })()
      : requirements;

  if (!Array.isArray(list) || list.length === 0) {
    return fallback;
  }

  const normalized = list
    .map((requirement, index) => {
      const fieldValue = String(requirement?.field || "").trim();
      const labelValue = String(requirement?.label || "").trim();

      if (!fieldValue && !labelValue) return null;

      return {
        field: fieldValue || `requirement_${index + 1}`,
        label: labelValue || fieldValue || `Requirement ${index + 1}`,
        description: String(requirement?.description || "").trim(),
        required: requirement?.required !== false,
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function canAccessFile(user, file) {
  const role = String(user?.role || "").toLowerCase();

  if (["admin", "superadmin", "super_admin"].includes(role)) return true;

  return String(file.owner_user_id) === String(user?.id);
}

function normalizeFileList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

async function getJobRequirement(
  jobOpeningId,
  field,
  positionCategory = "",
  positionTitle = ""
) {
  if (!jobOpeningId) {
    const requirement = getFixedApplicationRequirement(
      field,
      positionCategory,
      positionTitle
    );

    if (!requirement) {
      const error = new Error("This is not a valid application requirement.");
      error.statusCode = 400;
      throw error;
    }

    return {
      job: null,
      requirement,
      requirements: getFixedApplicationRequirements(
        positionCategory,
        positionTitle
      ),
    };
  }

  const result = await pool.query(
    `SELECT id, title, position_category, requirements, created_at, updated_at
     FROM job_openings
     WHERE id = $1
       AND status = 'open'
       AND (deadline + COALESCE(deadline_time, TIME '23:59')) >= NOW()
     LIMIT 1`,
    [jobOpeningId]
  );
  const job = result.rows[0];

  if (!job) {
    const error = new Error("Vacancy is not available for uploads.");
    error.statusCode = 404;
    throw error;
  }

  assertOnlineUploadAllowedForPosition(job.title);

  const requirements = normalizeRequirementList(
    job.requirements,
    job.position_category,
    job.title
  );
  const requirement = requirements.find(
    (item) => String(item.field) === String(field)
  );

  if (!requirement) {
    const error = new Error("This is not a valid application requirement.");
    error.statusCode = 400;
    throw error;
  }

  return {
    job,
    requirement,
    requirements,
  };
}

async function getOrCreateApplicantProfile(client, userId, nextData = {}) {
  const userResult = await client.query(
    `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
       contact_number, role, uan
     FROM users
     WHERE id = $1
     FOR UPDATE`,
    [userId]
  );
  const user = userResult.rows[0];

  if (!user) {
    const error = new Error("Applicant account was not found.");
    error.statusCode = 404;
    throw error;
  }

  const assignedUan = await assignUan(client, user.id, user.uan);
  const profileResult = await client.query(
    `SELECT id, user_id, uan, data, created_at, updated_at
     FROM applicant_profiles
     WHERE user_id = $1
     FOR UPDATE`,
    [user.id]
  );

  if (profileResult.rowCount > 0) {
    const profile = profileResult.rows[0];
    const mergedData = {
      ...(profile.data || {}),
      ...nextData,
    };

    const updatedProfile = await client.query(
      `UPDATE applicant_profiles
       SET uan = $2,
           data = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, uan, data, created_at, updated_at`,
      [profile.id, assignedUan, mergedData]
    );

    return updatedProfile.rows[0];
  }

  const insertedProfile = await client.query(
    `INSERT INTO applicant_profiles (user_id, uan, data, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     RETURNING id, user_id, uan, data, created_at, updated_at`,
    [user.id, assignedUan, { uan: assignedUan, ...nextData }]
  );

  return insertedProfile.rows[0];
}

function mergeFileIntoProfileData(
  profileData,
  { field, file, job, jobOpeningId, requirements }
) {
  const currentJobPosition = profileData.jobPosition || {};
  const currentFiles = currentJobPosition.files || {};
  const currentFieldFiles = normalizeFileList(currentFiles[field]);
  const nextFieldFiles = Array.isArray(file)
    ? file.filter(Boolean)
    : file
      ? [
          ...currentFieldFiles.filter(
            (item) => String(item?.id || "") !== String(file.id || "")
          ),
          file,
        ]
      : [];
  const normalizedRequirements = Array.isArray(requirements)
    ? requirements
    : getFixedApplicationRequirements();
  const hasJobContext = Boolean(jobOpeningId && job);
  const nextRequirements = normalizedRequirements.length
    ? normalizedRequirements
    : getFixedApplicationRequirements();

  return {
    ...profileData,
    jobPosition: {
      ...currentJobPosition,
      jobOpeningId: hasJobContext
        ? jobOpeningId
        : currentJobPosition.jobOpeningId || "",
      positionCategory:
        hasJobContext && job?.position_category
          ? job.position_category
          : currentJobPosition.positionCategory || "",
      positionType:
        hasJobContext && job?.title
          ? job.title
          : currentJobPosition.positionType || "",
      requirements: nextRequirements,
      requirementSignature: getRequirementSignature(nextRequirements),
      requirementsUpdatedAt: hasJobContext
        ? job?.updated_at || job?.created_at || ""
        : currentJobPosition.requirementsUpdatedAt || "",
      files: {
        ...currentFiles,
        [field]: nextFieldFiles,
      },
    },
  };
}

export async function uploadRequirementFile(req, res, next) {
  const field = normalizeRequirementField(req.params.field);
  const jobOpeningId = parsePositiveInt(req.body?.jobOpeningId);
  const positionCategory = String(req.body?.positionCategory || "").trim();
  const incomingPositionTitle = getRequestedPositionTitle(req.body || {});
  const incomingLabel = String(req.body?.requirementLabel || field).trim();

  if (!field) {
    return res.status(400).json({
      success: false,
      message: "Requirement field is required.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please attach a file to upload.",
    });
  }

  try {
    assertOnlineUploadAllowedForPosition(incomingPositionTitle);
  } catch (error) {
    return res.status(error.statusCode || 403).json({
      success: false,
      message: error.message,
      code: error.code || "TEACHER_I_PERSONAL_SUBMISSION_ONLY",
    });
  }

  let storedFile;

  try {
    const { job, requirement, requirements } = jobOpeningId
      ? await getJobRequirement(jobOpeningId, field)
      : await getJobRequirement(
          null,
          field,
          positionCategory,
          incomingPositionTitle
        );

    const requirementLabel = String(
      requirement.label || incomingLabel || field
    ).trim();

    storedFile = await storeRequirementFile({
      file: req.file,
      ownerUserId: req.user.id,
      jobOpeningId,
      requirementField: field,
      destination: jobOpeningId ? "application" : "library",
    });

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const profile = await getOrCreateApplicantProfile(client, req.user.id);

      const activeCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM uploaded_files
         WHERE owner_user_id = $1
           AND requirement_field = $2
           AND COALESCE(job_opening_id, 0) = COALESCE($3, 0)
           AND status = 'active'`,
        [req.user.id, field, jobOpeningId]
      );
      const activeCount = Number(activeCountResult.rows[0]?.count || 0);

      if (activeCount >= uploadMaxFilesPerRequirement) {
        await client.query("ROLLBACK");
        await removeStoredFile(storedFile.relativePath).catch(() => {});
        return res.status(409).json({
          success: false,
          message: `Each requirement can keep up to ${uploadMaxFilesPerRequirement} active files.`,
        });
      }

      const insertResult = await client.query(
        `INSERT INTO uploaded_files (
           id,
           owner_user_id,
           applicant_profile_id,
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
           $11, $12, $13, $14, $15, 'active', NOW(), NOW()
         )
         RETURNING *`,
        [
          storedFile.id,
          req.user.id,
          profile.id,
          jobOpeningId,
          field,
          requirementLabel,
          storedFile.originalName,
          storedFile.storedName,
          storedFile.relativePath,
          storedFile.mimeType,
          storedFile.sizeBytes,
          storedFile.originalSizeBytes,
          storedFile.checksumSha256,
          storedFile.width,
          storedFile.height,
        ]
      );

      const clientFile = toClientFile(insertResult.rows[0]);
      const nextData = mergeFileIntoProfileData(profile.data || {}, {
        field,
        file: clientFile,
        job,
        jobOpeningId,
        requirements,
      });

      await client.query(
        `UPDATE applicant_profiles
         SET data = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [profile.id, nextData]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        file: clientFile,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      await removeStoredFile(storedFile.relativePath).catch(() => {});
      return next(error);
    } finally {
      client.release();
    }
  } catch (error) {
    if (storedFile?.relativePath) {
      await removeStoredFile(storedFile.relativePath).catch(() => {});
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    return next(error);
  }
}

export async function removeRequirementFile(req, res, next) {
  const field = normalizeRequirementField(req.params.field);
  const fileId = String(req.body?.fileId || "").trim();
  const jobOpeningId = parsePositiveInt(req.body?.jobOpeningId);

  if (!field || !fileId) {
    return res.status(400).json({
      success: false,
      message: "File id and requirement field are required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const fileResult = await client.query(
      `SELECT *
       FROM uploaded_files
       WHERE id = $1
         AND owner_user_id = $2
         AND requirement_field = $3
         AND COALESCE(job_opening_id, 0) = COALESCE($4, 0)
         AND status = 'active'
       FOR UPDATE`,
      [fileId, req.user.id, field, jobOpeningId]
    );

    if (fileResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Uploaded file was not found.",
      });
    }

    await client.query(
      `UPDATE uploaded_files
       SET status = 'deleted',
           deleted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [fileId]
    );

    const profileResult = await client.query(
      `SELECT id, data
       FROM applicant_profiles
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (profileResult.rowCount > 0) {
      const profile = profileResult.rows[0];
      const remainingResult = await client.query(
        `SELECT *
         FROM uploaded_files
         WHERE owner_user_id = $1
           AND requirement_field = $2
           AND COALESCE(job_opening_id, 0) = COALESCE($3, 0)
           AND status = 'active'
         ORDER BY created_at DESC`,
        [req.user.id, field, jobOpeningId]
      );
      const nextData = mergeFileIntoProfileData(profile.data || {}, {
        field,
        file: remainingResult.rows.map(toClientFile),
        jobOpeningId: null,
      });

      await client.query(
        `UPDATE applicant_profiles
         SET data = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [profile.id, nextData]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "File removed.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return next(error);
  } finally {
    client.release();
  }
}

export async function listRequirementFiles(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM uploaded_files
       WHERE owner_user_id = $1
         AND job_opening_id IS NULL
         AND status = 'active'
       ORDER BY requirement_field ASC, created_at DESC`,
      [req.user.id]
    );
    const files = result.rows.map(toClientFile);
    const byField = files.reduce((groups, file) => {
      const key = file.requirementField || "other";
      return {
        ...groups,
        [key]: [...(groups[key] || []), file],
      };
    }, {});

    return res.json({
      success: true,
      files,
      byField,
    });
  } catch (error) {
    return next(error);
  }
}

export async function serveUploadedFile(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM uploaded_files
       WHERE id = $1
          AND status IN ('active', 'submitted')
       LIMIT 1`,
      [req.params.id]
    );
    const file = result.rows[0];

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    if (!canAccessFile(req.user, file)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this file.",
      });
    }

    const absolutePath = safeResolveUploadPath(file.relative_path);
    const mode = req.params.mode === "download" ? "attachment" : "inline";
    const fileName = path.basename(file.original_name || file.stored_name);

    res.setHeader("Content-Type", file.mime_type);
    res.setHeader(
      "Content-Disposition",
      `${mode}; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Content-Security-Policy", "default-src 'self' blob: data:");
    res.setHeader("Cache-Control", "private, no-store");

    return res.sendFile(absolutePath);
  } catch (error) {
    return next(error);
  }
}

export async function getUploadStorageHealth(_req, res, next) {
  try {
    const stats = await getUploadStorageStats();
    const counts = await pool.query(
      `SELECT status, COUNT(*)::int AS count, COALESCE(SUM(size_bytes), 0)::bigint AS bytes
       FROM uploaded_files
       GROUP BY status
       ORDER BY status`
    );

    return res.json({
      success: true,
      storage: stats,
      files: counts.rows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function cleanupInactiveUploads(_req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, relative_path
       FROM uploaded_files
       WHERE status IN ('replaced', 'deleted')
         AND deleted_at < NOW() - ($1::int * INTERVAL '1 day')
         AND NOT EXISTS (
           SELECT 1
           FROM uploaded_files kept
           WHERE kept.relative_path = uploaded_files.relative_path
             AND kept.id <> uploaded_files.id
             AND kept.status IN ('active', 'submitted')
         )
       ORDER BY deleted_at ASC
       LIMIT 200`,
      [uploadCleanupRetentionDays]
    );

    let purged = 0;

    for (const file of result.rows) {
      await removeStoredFile(file.relative_path);
      await pool.query(
        `UPDATE uploaded_files
         SET status = 'purged',
             updated_at = NOW()
         WHERE id = $1`,
        [file.id]
      );
      purged += 1;
    }

    return res.json({
      success: true,
      purged,
      retentionDays: uploadCleanupRetentionDays,
    });
  } catch (error) {
    return next(error);
  }
}
