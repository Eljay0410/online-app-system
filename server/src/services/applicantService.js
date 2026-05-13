import { assignUan } from "./uanService.js";
import { normalizeEmail } from "../utils/formatters.js";

const profileSections = [
  "personalInfo",
  "educationalBackground",
  "eligibility",
  "learningDevelopment",
  "jobPosition",
];

function getPersonalInfo(data = {}) {
  return data.personalInfo || data.profileData?.personalInfo || {};
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
       u.last_name,
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
    `SELECT id, email, first_name, last_name, role, uan, password_hash, last_activation_sent_at
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
         last_name,
         role,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, 'applicant', NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, uan, password_hash, last_activation_sent_at`,
      [
        email,
        personalInfo.firstName || null,
        personalInfo.lastName || null,
      ]
    );

    user = inserted.rows[0];
  } else {
    const updated = await client.query(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, first_name, last_name, role, uan, password_hash, last_activation_sent_at`,
      [
        user.id,
        personalInfo.firstName || null,
        personalInfo.lastName || null,
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
  { user, profile, jobOpeningId, applicationData = {} }
) {
  const jobId = Number.parseInt(jobOpeningId, 10);

  if (!Number.isInteger(jobId) || jobId <= 0) {
    const error = new Error("A valid job opening is required.");
    error.statusCode = 400;
    throw error;
  }

  const jobResult = await client.query(
    `SELECT id, title, location, vacancy, deadline, status, description
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

  if (job.status !== "open") {
    const error = new Error("This job opening is no longer accepting applications.");
    error.statusCode = 409;
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
        job: {
          id: job.id,
          title: job.title,
          location: job.location,
          deadline: job.deadline,
        },
        submittedAt: new Date().toISOString(),
      },
    ]
  );

  return {
    application: result.rows[0],
    job,
  };
}
