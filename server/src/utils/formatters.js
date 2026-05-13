export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function mapJobOpening(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    vacancy: row.vacancy,
    deadline: row.deadline,
    status: row.status,
    description: row.description || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApplicantProfile(row) {
  if (!row?.id) {
    return null;
  }

  const data = row.data || {};
  const personalInfo = data.personalInfo || {};

  return {
    id: row.id,
    userId: row.user_id,
    uan: String(row.uan || row.user_uan || "").toUpperCase(),
    email: row.email || personalInfo.emailAddress || "",
    firstName: personalInfo.firstName || row.first_name || "",
    middleName: personalInfo.middleName || "",
    lastName: personalInfo.lastName || row.last_name || "",
    phone: personalInfo.contactNumber || personalInfo.phone || "",
    address: personalInfo.address || "",
    birthDate: personalInfo.dob || personalInfo.birthDate || "",
    sex: personalInfo.sex || "",
    civilStatus: personalInfo.civilStatus || "",
    nationality: personalInfo.nationality || "",
    religion: personalInfo.religion || "",
    profileComplete: true,
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapApplication(row) {
  const data = row.data || {};
  const personalInfo = data.personalInfo || {};
  const jobPosition = data.jobPosition || {};
  const job = data.job || {};
  const position =
    row.job_title ||
    job.title ||
    jobPosition.positionType ||
    jobPosition.positionCategory ||
    data.position ||
    "Not specified";

  return {
    id: row.id,
    uan: String(row.uan || "").toUpperCase(),
    userId: row.user_id,
    profileId: row.applicant_profile_id,
    jobOpeningId: row.job_opening_id,
    status: row.status || "submitted",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicantName:
      [row.first_name, row.last_name].filter(Boolean).join(" ") ||
      [personalInfo.firstName, personalInfo.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Applicant",
    email: row.email || personalInfo.emailAddress || "",
    position,
    jobTitle: position,
    jobLocation: row.job_location || job.location || "",
    jobDeadline: row.job_deadline || job.deadline || null,
    raw: data,
  };
}
