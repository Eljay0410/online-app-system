export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function mapJobOpening(row) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = row.deadline ? new Date(row.deadline) : null;
  const storedStatus = row.status || "open";
  const status =
    storedStatus === "open" && deadline && deadline < today
      ? "expired"
      : storedStatus;

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    district: row.district || "",
    barangay: row.barangay || "",
    vacancy: row.vacancy,
    deadline: row.deadline,
    expirationDate: row.deadline,
    status,
    description: row.description || "",
    postedAt: row.created_at,
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
  const applicationDetails = data.applicationDetails || {};
  const uploads = data.uploads || data.requirements || {};
  const profileComplete = Boolean(applicationDetails.completedAt);

  return {
    id: row.id,
    userId: row.user_id,
    uan: String(row.uan || row.user_uan || "").toUpperCase(),
    email: row.email || personalInfo.emailAddress || "",
    firstName: personalInfo.firstName || row.first_name || "",
    middleName: personalInfo.middleName || row.middle_name || "",
    noMiddleName: Boolean(personalInfo.noMiddleName || row.no_middle_name),
    lastName: personalInfo.lastName || row.last_name || "",
    contactNumber:
      personalInfo.contactNumber || personalInfo.phone || row.contact_number || "",
    phone: personalInfo.contactNumber || personalInfo.phone || row.contact_number || "",
    address: personalInfo.address || "",
    birthDate: personalInfo.dob || personalInfo.birthDate || "",
    highestEducation: applicationDetails.highestEducation || "",
    schoolGraduated: applicationDetails.schoolGraduated || "",
    course: applicationDetails.course || "",
    eligibility: applicationDetails.eligibility || "",
    workExperience: applicationDetails.workExperience || "",
    preferredPosition: applicationDetails.preferredPosition || "",
    uploads,
    profileComplete,
    applicationReady: profileComplete,
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
    jobDistrict: row.job_district || job.district || "",
    jobBarangay: row.job_barangay || job.barangay || "",
    jobDeadline: row.job_deadline || job.deadline || null,
    reviewNotes: row.review_notes || data.reviewNotes || "",
    raw: data,
  };
}
