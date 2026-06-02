import { assignUan } from "./uanService.js";
import { copyUploadedFileSnapshot } from "./fileStorageService.js";
import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirements,
} from "../config/applicationRequirements.js";
import { uploadMaxFilesPerRequirement } from "../config/env.js";
import { normalizeEmail } from "../utils/formatters.js";

const profileSections = [
  "personalInfo",
  "applicationDetails",
  "educationalBackground",
  "eligibility",
  "learningDevelopment",
  "uploads",
  "requirements",
  "jobPosition",
];

function getPersonalInfo(data = {}) {
  return data.personalInfo || data.profileData?.personalInfo || {};
}

function trim(value) {
  return String(value || "").trim();
}

function normalizeSelectedFileIds(value) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(
    new Set(values.map((item) => String(item || "").trim()).filter(Boolean))
  ).slice(0, uploadMaxFilesPerRequirement + 1);
}

export function getApplicationProfileGaps(data = {}) {
  const personal = getPersonalInfo(data);
  const education = data.educationalBackground || {};
  const eligibility = data.eligibility || {};
  const firstBachelor = (education.bachelors || []).find(
    (item) => trim(item?.school) || trim(item?.course) || trim(item?.year)
  );
  const firstEligibility = (eligibility.eligibilities || []).find(
    (item) => trim(item?.type) || trim(item?.rating) || trim(item?.examDate)
  );
  const missing = [];

  if (
    !trim(personal.firstName) ||
    (!personal.noMiddleName && !trim(personal.middleName)) ||
    !trim(personal.lastName) ||
    !trim(personal.address) ||
    !trim(personal.contactNumber) ||
    !trim(personal.emailAddress) ||
    !trim(personal.dob) ||
    !trim(personal.sex) ||
    !trim(personal.civilStatus) ||
    !trim(personal.nationality) ||
    !trim(personal.religion)
  ) {
    missing.push("Personal information");
  }

  if (
    !firstBachelor ||
    !trim(firstBachelor.school) ||
    !trim(firstBachelor.course) ||
    !trim(firstBachelor.year)
  ) {
    missing.push("Educational background - bachelor's degree");
  }

  if (
    !firstEligibility ||
    !trim(firstEligibility.type) ||
    !trim(firstEligibility.rating) ||
    !trim(firstEligibility.examDate)
  ) {
    missing.push("Eligibility");
  }

  return missing;
}

export function getApplicantEmail(data = {}) {
  return normalizeEmail(
    data.email ||
      data.emailAddress ||
      getPersonalInfo(data).emailAddress ||
      data.profileData?.email ||
      data.profileData?.emailAddress
  );
}

export function mergeApplicantData(existingData = {}, incomingData = {}) {
  const nextData = {
    ...existingData,
    ...incomingData,
  };

  for (const section of profileSections) {
    if (existingData[section] || incomingData[section]) {
      nextData[section] = {
        ...(existingData[section] || {}),
        ...(incomingData[section] || {}),
      };
    }
  }

  return nextData;
}

export async function getApplicantProfileRecord(queryable, email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) return null;

  const result = await queryable.query(
    `SELECT
       u.id AS user_id,
       u.email,
       u.first_name,
       u.middle_name,
       u.no_middle_name,
       u.last_name,
       u.contact_number,
       u.role,
       u.is_active,
       u.uan AS user_uan,
       p.id,
       p.uan,
       p.data,
       p.created_at,
       p.updated_at
     FROM users u
     LEFT JOIN applicant_profiles p ON p.user_id = u.id
     WHERE LOWER(u.email) = LOWER($1)
     LIMIT 1`,
    [normalizedEmail]
  );

  return result.rows[0] || null;
}

export async function upsertApplicantProfile(client, incomingData = {}) {
  const profileData = incomingData.profileData || incomingData;
  const personalInfo = getPersonalInfo(profileData);
  const email = getApplicantEmail(profileData);

  if (!email) {
    const error = new Error("Applicant email is required.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await client.query(
    `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
       contact_number, role, uan, password_hash, last_activation_sent_at
     FROM users
     WHERE LOWER(email) = LOWER($1)
     FOR UPDATE`,
    [email]
  );

  let user = existingUser.rows[0];

  if (!user) {
    const inserted = await client.query(
      `INSERT INTO users (
         email,
         first_name,
         middle_name,
         no_middle_name,
         last_name,
         contact_number,
         role,
         is_active,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'applicant', FALSE, NOW(), NOW())
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, uan, password_hash, last_activation_sent_at`,
      [
        email,
        personalInfo.firstName || null,
        personalInfo.noMiddleName ? null : personalInfo.middleName || null,
        Boolean(personalInfo.noMiddleName),
        personalInfo.lastName || null,
        personalInfo.contactNumber || personalInfo.phone || null,
      ]
    );

    user = inserted.rows[0];
  } else {
    const updated = await client.query(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           middle_name = $3,
           no_middle_name = $4,
           last_name = COALESCE($5, last_name),
           contact_number = COALESCE($6, contact_number),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, uan, password_hash, last_activation_sent_at`,
      [
        user.id,
        personalInfo.firstName || null,
        personalInfo.noMiddleName ? null : personalInfo.middleName || null,
        Boolean(personalInfo.noMiddleName),
        personalInfo.lastName || null,
        personalInfo.contactNumber || personalInfo.phone || null,
      ]
    );

    user = updated.rows[0];
  }

  const assignedUan = await assignUan(client, user.id, user.uan);

  const currentProfile = await client.query(
    "SELECT id, user_id, uan, data, created_at, updated_at FROM applicant_profiles WHERE user_id = $1 FOR UPDATE",
    [user.id]
  );

  const existingData = currentProfile.rows[0]?.data || {};
  const mergedData = mergeApplicantData(existingData, {
    ...profileData,
    personalInfo: {
      ...personalInfo,
      emailAddress: email,
      middleName: personalInfo.noMiddleName ? "" : personalInfo.middleName || "",
      contactNumber: personalInfo.contactNumber || personalInfo.phone || "",
    },
    uan: assignedUan,
  });

  let profile;

  if (currentProfile.rowCount === 0) {
    const insertedProfile = await client.query(
      `INSERT INTO applicant_profiles (user_id, uan, data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, user_id, uan, data, created_at, updated_at`,
      [user.id, assignedUan, mergedData]
    );

    profile = insertedProfile.rows[0];
  } else {
    const updatedProfile = await client.query(
      `UPDATE applicant_profiles
       SET uan = $2,
           data = $3,
           updated_at = NOW()
       WHERE user_id = $1
       RETURNING id, user_id, uan, data, created_at, updated_at`,
      [user.id, assignedUan, mergedData]
    );

    profile = updatedProfile.rows[0];
  }

  return {
    user: {
      ...user,
      uan: assignedUan,
    },
    profile,
  };
}

export async function createJobApplicationFromProfile(
  client,
  { user, profile, jobOpeningId, applicationData = {}, requirementFiles = {} }
) {
  const jobId = Number.parseInt(jobOpeningId, 10);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    const error = new Error("A valid job opening is required.");
    error.statusCode = 400;
    throw error;
  }

  const jobResult = await client.query(
    `SELECT id, title, location, district, barangay, vacancy, deadline,
       deadline_time, position_id, position_category, salary_grade, salary_amount,
       education, training, experience, eligibility, status, description,
       deadline + COALESCE(deadline_time, TIME '23:59') AS deadline_at
     FROM job_openings
     WHERE id = $1
     LIMIT 1`,
    [jobId]
  );

  const job = jobResult.rows[0];

  if (!job) {
    const error = new Error("Job opening not found.");
    error.statusCode = 404;
    throw error;
  }

  const deadline = job.deadline_at ? new Date(job.deadline_at) : null;

  if (job.status !== "open" || (deadline && deadline < new Date())) {
    const error = new Error("This job opening is no longer accepting applications.");
    error.statusCode = 409;
    throw error;
  }

  const submissionRule = getApplicationSubmissionRule(job.title);
  const jobRequirements = getFixedApplicationRequirements(
    job.position_category,
    job.title
  );
  const itemResult = await client.query(
    `SELECT id, school_station, subject_area, vacancy_count, assigned_count
     FROM job_opening_items
     WHERE job_opening_id = $1
     ORDER BY school_station ASC, subject_area ASC, id ASC`,
    [job.id]
  );
  const vacancyItems = itemResult.rows.map((item) => ({
    id: item.id,
    schoolStation: item.school_station || "",
    subjectArea: item.subject_area || "",
    vacancyCount: Number(item.vacancy_count || 0),
    assignedCount: Number(item.assigned_count || 0),
  }));
  const profileGaps = getApplicationProfileGaps(profile.data || {});
  const selectedRequirementFiles =
    requirementFiles && typeof requirementFiles === "object"
      ? requirementFiles
      : {};

  if (profileGaps.length > 0) {
    const error = new Error(
      `Complete these profile sections before applying: ${profileGaps.join(", ")}.`
    );
    error.statusCode = 409;
    error.details = { missingProfileSections: profileGaps };
    throw error;
  }

  const duplicate = await client.query(
    `SELECT id
     FROM job_applications
     WHERE user_id = $1 AND job_opening_id = $2
     LIMIT 1`,
    [user.id, jobId]
  );

  if (duplicate.rowCount > 0) {
    const error = new Error("You already applied to this job.");
    error.statusCode = 409;
    error.code = "DUPLICATE_APPLICATION";
    throw error;
  }

  const snapshot = mergeApplicantData(profile.data || {}, applicationData);

  const result = await client.query(
    `INSERT INTO job_applications (
       user_id,
       applicant_profile_id,
       job_opening_id,
       uan,
       data,
       status,
       created_at,
       updated_at
     )
      VALUES ($1, $2, $3, $4, $5, 'submitted', NOW(), NOW())
      RETURNING id, user_id, applicant_profile_id, job_opening_id, uan, data, status, created_at, updated_at`,
    [
      user.id,
      profile.id,
      jobId,
      profile.uan,
      {
        ...snapshot,
        uan: profile.uan,
        jobOpeningId: job.id,
        personalSubmissionRequired: submissionRule.requiresPersonalSubmission,
        requirementSubmissionMode: submissionRule.requiresPersonalSubmission
          ? "personal"
          : "online",
        job: {
          id: job.id,
          title: job.title,
          location: job.location,
          district: job.district,
          barangay: job.barangay,
          salaryGrade: job.salary_grade,
          salaryAmount: job.salary_amount,
          education: job.education,
          training: job.training,
          experience: job.experience,
          eligibility: job.eligibility,
          vacancyItems,
          deadline: job.deadline,
          deadlineTime: job.deadline_time,
          positionId: job.position_id,
          positionCategory: job.position_category,
          requirements: jobRequirements,
          submissionRule,
        },
        submittedAt: new Date().toISOString(),
      },
    ]
  );
  const application = result.rows[0];
  const storedSnapshotPaths = [];

  if (submissionRule.createRequirementSnapshot) {
    for (const requirement of jobRequirements) {
      const selectedFileIds = normalizeSelectedFileIds(
        selectedRequirementFiles[requirement.field]
      );

    if (selectedFileIds.length > uploadMaxFilesPerRequirement) {
      const error = new Error(
        `Select up to ${uploadMaxFilesPerRequirement} files for ${requirement.label || requirement.field}.`
      );
      error.statusCode = 409;
      throw error;
    }

    if (selectedFileIds.length === 0) {
      await client.query(
        `INSERT INTO application_requirements (
           job_application_id,
           requirement_field,
           requirement_label,
           requirement_description,
           required,
           file_id,
           source_file_id,
           status,
           submitted_at,
           created_at,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, NULL, NULL, 'incomplete', NOW(), NOW(), NOW())`,
        [
          application.id,
          requirement.field,
          requirement.label || requirement.field,
          requirement.description || "",
          false,
        ]
      );
      continue;
    }

    for (const selectedFileId of selectedFileIds) {
      const sourceResult = await client.query(
        `SELECT *
         FROM uploaded_files
         WHERE id = $1
           AND owner_user_id = $2
           AND requirement_field = $3
           AND job_opening_id IS NULL
           AND status = 'active'
         LIMIT 1`,
        [selectedFileId, user.id, requirement.field]
      );
      const sourceFile = sourceResult.rows[0];

      if (!sourceFile) {
        const error = new Error(
          `Selected file for ${requirement.label || requirement.field} was not found.`
        );
        error.statusCode = 409;
        throw error;
      }

      const copiedFile = await copyUploadedFileSnapshot({
        sourceFile,
        ownerUserId: user.id,
        jobOpeningId: job.id,
        jobApplicationId: application.id,
        requirementField: requirement.field,
      });
      storedSnapshotPaths.push(copiedFile.relativePath);

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
          user.id,
          profile.id,
          application.id,
          job.id,
          requirement.field,
          requirement.label || requirement.field,
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

      await client.query(
        `INSERT INTO application_requirements (
           job_application_id,
           requirement_field,
           requirement_label,
           requirement_description,
           required,
           file_id,
           source_file_id,
           status,
           submitted_at,
           created_at,
           updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW(), NOW(), NOW())`,
        [
          application.id,
          requirement.field,
          requirement.label || requirement.field,
          requirement.description || "",
          false,
          insertedFile.rows[0].id,
          sourceFile.id,
        ]
      );
    }
    }
  }

  return {
    application,
    job,
    storedSnapshotPaths,
  };
}
