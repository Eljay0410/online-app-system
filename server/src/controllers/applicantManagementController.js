import pool from "../config/db.js";
import { toClientFile } from "../services/fileStorageService.js";
import { assignUan } from "../services/uanService.js";

const defaultApplicantLimit = 10;

function getPagination(query = {}) {
  const limit = Number.parseInt(query.limit || String(defaultApplicantLimit), 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 100)
      : defaultApplicantLimit,
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

function parseStatusCounts(value) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function getProfileData(row = {}) {
  return row.profile_data && typeof row.profile_data === "object"
    ? row.profile_data
    : {};
}

function getPersonalInfo(row = {}) {
  return getProfileData(row).personalInfo || {};
}

function getFullName(row = {}) {
  const personalInfo = getPersonalInfo(row);
  const firstName = row.first_name || personalInfo.firstName || "";
  const middleName = row.no_middle_name
    ? ""
    : row.middle_name || personalInfo.middleName || "";
  const lastName = row.last_name || personalInfo.lastName || "";
  const suffix = personalInfo.suffix || "";

  return [firstName, middleName, lastName, suffix]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
}

function mapApplicantListRow(row = {}) {
  const personalInfo = getPersonalInfo(row);
  const statusCounts = parseStatusCounts(row.application_status_counts);

  return {
    id: row.id,
    uan: String(row.profile_uan || row.user_uan || "").toUpperCase(),
    fullName: getFullName(row) || "Applicant",
    firstName: row.first_name || personalInfo.firstName || "",
    middleName: row.middle_name || personalInfo.middleName || "",
    noMiddleName: Boolean(row.no_middle_name || personalInfo.noMiddleName),
    lastName: row.last_name || personalInfo.lastName || "",
    suffix: personalInfo.suffix || "",
    email: row.email || personalInfo.emailAddress || "",
    contactNumber:
      row.contact_number ||
      personalInfo.contactNumber ||
      personalInfo.phone ||
      "",
    address: personalInfo.address || "",
    isActive: row.is_active !== false,
    emailVerifiedAt: row.email_verified_at,
    dateRegistered: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login,
    applicationCount: Number(row.application_count || 0),
    applicationStatusCounts: statusCounts,
    uploadedFileCount: Number(row.uploaded_file_count || 0),
  };
}

function mapApplicationSummary(row = {}) {
  return {
    id: row.id,
    uan: String(row.uan || "").toUpperCase(),
    status: row.status || "submitted",
    position: row.job_title || row.data?.job?.title || row.data?.position || "N/A",
    location: row.job_location || row.data?.job?.location || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildApplicantFilters(query = {}) {
  const conditions = ["u.role = 'applicant'"];
  const values = [];
  const search = normalizeQueryValue(query.q || query.search);
  const specificDate = normalizeDateValue(query.date || query.registeredDate);
  const dateFrom = normalizeDateValue(query.dateFrom || query.from);
  const dateTo = normalizeDateValue(query.dateTo || query.to);

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    conditions.push(
      `(LOWER(u.email) LIKE $${values.length}
        OR LOWER(COALESCE(u.first_name, '')) LIKE $${values.length}
        OR LOWER(COALESCE(u.last_name, '')) LIKE $${values.length}
        OR LOWER(CONCAT_WS(' ', u.first_name, u.middle_name, u.last_name)) LIKE $${values.length}
        OR LOWER(COALESCE(u.uan, p.uan, '')) LIKE $${values.length}
        OR LOWER(COALESCE(u.contact_number, '')) LIKE $${values.length})`
    );
  }

  if (specificDate) {
    values.push(specificDate);
    conditions.push(
      `(u.created_at >= $${values.length}::date AND u.created_at < ($${values.length}::date + INTERVAL '1 day'))`
    );
  } else {
    if (dateFrom) {
      values.push(dateFrom);
      conditions.push(`u.created_at >= $${values.length}::date`);
    }

    if (dateTo) {
      values.push(dateTo);
      conditions.push(
        `u.created_at < ($${values.length}::date + INTERVAL '1 day')`
      );
    }
  }

  return {
    where: `WHERE ${conditions.join(" AND ")}`,
    values,
  };
}

function normalizeBasicInfo(body = {}) {
  const noMiddleName = Boolean(body.noMiddleName);

  return {
    firstName: String(body.firstName || "").trim().slice(0, 100),
    middleName: noMiddleName
      ? ""
      : String(body.middleName || "").trim().slice(0, 100),
    noMiddleName,
    lastName: String(body.lastName || "").trim().slice(0, 100),
    suffix: String(body.suffix || "").trim().slice(0, 40),
    contactNumber: String(body.contactNumber || "").trim().slice(0, 30),
    address: String(body.address || "").trim().slice(0, 500),
  };
}

async function getApplicantDetailData(client, applicantId) {
  const applicantResult = await client.query(
    `SELECT
       u.id,
       u.email,
       u.first_name,
       u.middle_name,
       u.no_middle_name,
       u.last_name,
       u.contact_number,
       u.is_active,
       u.email_verified_at,
       u.created_at,
       u.updated_at,
       u.last_login,
       u.uan AS user_uan,
       p.id AS profile_id,
       p.uan AS profile_uan,
       p.data AS profile_data,
       p.created_at AS profile_created_at,
       p.updated_at AS profile_updated_at,
       COALESCE(app_counts.application_count, 0)::int AS application_count,
       COALESCE(app_counts.status_counts, '{}'::jsonb) AS application_status_counts,
       COALESCE(file_counts.uploaded_file_count, 0)::int AS uploaded_file_count
     FROM users u
     LEFT JOIN applicant_profiles p ON p.user_id = u.id
     LEFT JOIN (
       SELECT COALESCE(SUM(status_count), 0)::int AS application_count,
              COALESCE(jsonb_object_agg(application_status, status_count), '{}'::jsonb) AS status_counts
       FROM (
         SELECT COALESCE(status, 'submitted') AS application_status,
                COUNT(*)::int AS status_count
         FROM job_applications
         WHERE user_id = $1
         GROUP BY COALESCE(status, 'submitted')
       ) grouped_applications
     ) app_counts ON TRUE
     LEFT JOIN (
       SELECT COUNT(*)::int AS uploaded_file_count
       FROM uploaded_files
       WHERE owner_user_id = $1
         AND status IN ('active', 'submitted')
     ) file_counts ON TRUE
     WHERE u.id = $1
       AND u.role = 'applicant'
     LIMIT 1`,
    [applicantId]
  );

  if (applicantResult.rowCount === 0) return null;

  const [applicationsResult, filesResult] = await Promise.all([
    client.query(
      `SELECT
         ja.id,
         ja.uan,
         ja.status,
         ja.data,
         ja.created_at,
         ja.updated_at,
         jo.title AS job_title,
         jo.location AS job_location
       FROM job_applications ja
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
       WHERE ja.user_id = $1
       ORDER BY ja.created_at DESC
       LIMIT 25`,
      [applicantId]
    ),
    client.query(
      `SELECT id, original_name, stored_name, relative_path, mime_type,
         size_bytes, original_size_bytes, checksum_sha256, image_width,
         image_height, requirement_field, requirement_label, status, created_at
       FROM uploaded_files
       WHERE owner_user_id = $1
         AND status IN ('active', 'submitted')
       ORDER BY created_at DESC
       LIMIT 50`,
      [applicantId]
    ),
  ]);

  const row = applicantResult.rows[0];
  const applicant = mapApplicantListRow(row);

  return {
    ...applicant,
    profileId: row.profile_id,
    profile: {
      id: row.profile_id,
      uan: String(row.profile_uan || row.user_uan || "").toUpperCase(),
      data: getProfileData(row),
      createdAt: row.profile_created_at,
      updatedAt: row.profile_updated_at,
    },
    personalInfo: getPersonalInfo(row),
    applications: applicationsResult.rows.map(mapApplicationSummary),
    uploadedFiles: filesResult.rows.map(toClientFile),
  };
}

export async function listApplicantManagement(req, res) {
  try {
    const { limit, offset } = getPagination(req.query);
    const { where, values } = buildApplicantFilters(req.query);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM users u
       LEFT JOIN applicant_profiles p ON p.user_id = u.id
       ${where}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `WITH filtered_applicants AS (
         SELECT
           u.id,
           u.email,
           u.first_name,
           u.middle_name,
           u.no_middle_name,
           u.last_name,
           u.contact_number,
           u.is_active,
           u.email_verified_at,
           u.created_at,
           u.updated_at,
           u.last_login,
           u.uan AS user_uan,
           p.id AS profile_id,
           p.uan AS profile_uan,
           p.data AS profile_data,
           p.updated_at AS profile_updated_at
         FROM users u
         LEFT JOIN applicant_profiles p ON p.user_id = u.id
         ${where}
         ORDER BY u.created_at DESC, u.id DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}
       ),
       application_status_counts AS (
         SELECT user_id,
                COALESCE(status, 'submitted') AS application_status,
                COUNT(*)::int AS status_count
         FROM job_applications
         WHERE user_id IN (SELECT id FROM filtered_applicants)
         GROUP BY user_id, COALESCE(status, 'submitted')
       ),
       app_counts AS (
         SELECT user_id,
                COALESCE(SUM(status_count), 0)::int AS application_count,
                COALESCE(jsonb_object_agg(application_status, status_count), '{}'::jsonb) AS status_counts
         FROM application_status_counts
         GROUP BY user_id
       ),
       file_counts AS (
         SELECT owner_user_id,
                COUNT(*)::int AS uploaded_file_count
         FROM uploaded_files
         WHERE owner_user_id IN (SELECT id FROM filtered_applicants)
           AND status IN ('active', 'submitted')
         GROUP BY owner_user_id
       )
       SELECT
         filtered_applicants.*,
         COALESCE(app_counts.application_count, 0)::int AS application_count,
         COALESCE(app_counts.status_counts, '{}'::jsonb) AS application_status_counts,
         COALESCE(file_counts.uploaded_file_count, 0)::int AS uploaded_file_count
       FROM filtered_applicants
       LEFT JOIN app_counts ON app_counts.user_id = filtered_applicants.id
       LEFT JOIN file_counts ON file_counts.owner_user_id = filtered_applicants.id
       ORDER BY filtered_applicants.created_at DESC, filtered_applicants.id DESC`,
      values
    );

    return res.json({
      success: true,
      applicants: result.rows.map(mapApplicantListRow),
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching applicant management list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applicant accounts.",
    });
  }
}

export async function getApplicantManagementDetail(req, res) {
  const applicantId = Number.parseInt(req.params.id, 10);

  if (!Number.isInteger(applicantId) || applicantId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid applicant account.",
    });
  }

  try {
    const applicant = await getApplicantDetailData(pool, applicantId);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant account not found.",
      });
    }

    return res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    console.error("Error fetching applicant details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch applicant details.",
    });
  }
}

export async function updateApplicantBasicInfo(req, res) {
  const applicantId = Number.parseInt(req.params.id, 10);
  const basicInfo = normalizeBasicInfo(req.body || {});

  if (!Number.isInteger(applicantId) || applicantId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid applicant account.",
    });
  }

  if (!basicInfo.firstName || !basicInfo.lastName) {
    return res.status(400).json({
      success: false,
      message: "First name and last name are required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `SELECT
         u.id,
         u.email,
         u.uan AS user_uan,
         p.id AS profile_id,
         p.uan AS profile_uan,
         p.data AS profile_data
       FROM users u
       LEFT JOIN applicant_profiles p ON p.user_id = u.id
       WHERE u.id = $1
         AND u.role = 'applicant'
       FOR UPDATE OF u`,
      [applicantId]
    );

    if (currentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Applicant account not found.",
      });
    }

    const current = currentResult.rows[0];
    const assignedUan =
      current.user_uan ||
      current.profile_uan ||
      (await assignUan(client, applicantId, current.user_uan));

    if (!current.user_uan && assignedUan) {
      await client.query(
        `UPDATE users
         SET uan = $2,
             updated_at = NOW()
         WHERE id = $1
           AND (uan IS NULL OR uan = '')`,
        [applicantId, assignedUan]
      );
    }
    const profileData =
      current.profile_data && typeof current.profile_data === "object"
        ? current.profile_data
        : {};
    const currentPersonalInfo = profileData.personalInfo || {};
    const nextPersonalInfo = {
      ...currentPersonalInfo,
      firstName: basicInfo.firstName,
      middleName: basicInfo.middleName,
      noMiddleName: basicInfo.noMiddleName,
      lastName: basicInfo.lastName,
      suffix: basicInfo.suffix,
      contactNumber: basicInfo.contactNumber,
      phone: basicInfo.contactNumber,
      address: basicInfo.address,
      emailAddress: current.email || currentPersonalInfo.emailAddress || "",
    };
    const nextProfileData = {
      ...profileData,
      uan: assignedUan,
      personalInfo: nextPersonalInfo,
    };

    await client.query(
      `UPDATE users
       SET first_name = $2,
           middle_name = $3,
           no_middle_name = $4,
           last_name = $5,
           contact_number = $6,
           updated_at = NOW()
       WHERE id = $1
         AND role = 'applicant'`,
      [
        applicantId,
        basicInfo.firstName,
        basicInfo.middleName || null,
        basicInfo.noMiddleName,
        basicInfo.lastName,
        basicInfo.contactNumber || null,
      ]
    );

    if (current.profile_id) {
      await client.query(
        `UPDATE applicant_profiles
         SET uan = $2,
             data = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [current.profile_id, assignedUan, nextProfileData]
      );
    } else {
      await client.query(
        `INSERT INTO applicant_profiles (user_id, uan, data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [applicantId, assignedUan, nextProfileData]
      );
    }

    await client.query("COMMIT");

    const applicant = await getApplicantDetailData(pool, applicantId);

    return res.json({
      success: true,
      applicant,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("Error updating applicant basic information:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update applicant basic information.",
    });
  } finally {
    client.release();
  }
}
