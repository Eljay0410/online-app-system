import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirements,
} from "../config/applicationRequirements.js";

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getDatePart(value) {
  if (!value) return "";

  const rawValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const datePart = rawValue.match(/(\d{4}-\d{2}-\d{2})/);
  return datePart ? datePart[1] : rawValue.slice(0, 10);
}

function getTimePart(value) {
  if (!value) return "23:59";
  return String(value).slice(0, 5);
}

function getDeadlineAt(row) {
  if (row.deadline_at) return new Date(row.deadline_at);

  const datePart = getDatePart(row.deadline);
  const timePart = getTimePart(row.deadline_time);

  if (!datePart) return null;

  const deadlineAt = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(deadlineAt.getTime()) ? null : deadlineAt;
}

function normalizeRequirementList(requirements, category = "", positionTitle = "") {
  const fallback = getFixedApplicationRequirements(category, positionTitle);
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
      const field = String(requirement?.field || "").trim();
      const label = String(requirement?.label || "").trim();

      if (!field && !label) return null;

      return {
        field: field || `requirement_${index + 1}`,
        label: label || field || `Requirement ${index + 1}`,
        description: String(requirement?.description || "").trim(),
        required: requirement?.required !== false,
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

export function mapJobOpening(row) {
  const deadlineAt = getDeadlineAt(row);
  const storedStatus = row.status || "open";
  const status =
    storedStatus === "open" && deadlineAt && deadlineAt < new Date()
      ? "expired"
      : storedStatus;
  const vacancyItems = Array.isArray(row.vacancy_items)
    ? row.vacancy_items
    : Array.isArray(row.items)
      ? row.items
      : [];

  return {
    id: row.id,
    title: row.title,
    location: row.location,
    district: row.district || "",
    barangay: row.barangay || "",
    vacancy: row.vacancy,
    deadline: getDatePart(row.deadline),
    deadlineTime: getTimePart(row.deadline_time),
    deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
    expirationDate: getDatePart(row.deadline),
    positionId: row.position_id || null,
    positionCategory: row.position_category || "",
    salaryGrade: row.salary_grade || "",
    salaryAmount: row.salary_amount || "",
    education: row.education || "",
    training: row.training || "",
    experience: row.experience || "",
    eligibility: row.eligibility || "",
    status,
    description: row.description || "",
    requirements: normalizeRequirementList(
      row.requirements,
      row.position_category,
      row.title
    ),
    vacancyItems: vacancyItems.map((item) => ({
      id: item.id,
      jobOpeningId: item.job_opening_id || item.jobOpeningId || row.id,
      schoolStation: item.school_station || item.schoolStation || "",
      subjectArea: item.subject_area || item.subjectArea || "",
      vacancyCount: Number(item.vacancy_count ?? item.vacancyCount ?? 0),
      assignedCount: Number(item.assigned_count ?? item.assignedCount ?? 0),
      createdAt: item.created_at || item.createdAt || null,
      updatedAt: item.updated_at || item.updatedAt || null,
    })),
    postedAt: row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapJobPosition(row) {
  return {
    id: row.id,
    category: row.category || "",
    title: row.title || "",
    requirements: normalizeRequirementList(row.requirements, row.category, row.title),
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
  const submissionRule = getApplicationSubmissionRule(position);

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
    jobVacancy: row.job_vacancy ?? job.vacancy ?? "",
    jobDeadline: row.job_deadline || job.deadline || null,
    jobDeadlineTime: getTimePart(row.job_deadline_time || job.deadlineTime),
    jobPositionCategory:
      row.job_position_category || job.positionCategory || job.position_category || "",
    jobSalaryGrade: row.job_salary_grade || job.salaryGrade || job.salary_grade || "",
    jobSalaryAmount:
      row.job_salary_amount || job.salaryAmount || job.salary_amount || "",
    jobEducation: row.job_education || job.education || "",
    jobTraining: row.job_training || job.training || "",
    jobExperience: row.job_experience || job.experience || "",
    jobEligibility: row.job_eligibility || job.eligibility || "",
    jobDescription: row.job_description || job.description || "",
    jobRequirements: normalizeRequirementList(
      row.job_requirements || job.requirements || jobPosition.requirements,
      row.job_position_category ||
        job.positionCategory ||
        job.position_category ||
        jobPosition.positionCategory ||
        "",
      position
    ),
    personalSubmissionRequired:
      data.personalSubmissionRequired || submissionRule.requiresPersonalSubmission,
    requirementSubmissionMode:
      data.requirementSubmissionMode ||
      (submissionRule.requiresPersonalSubmission ? "personal" : "online"),
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    adminRemarks: row.admin_remarks || row.review_notes || data.adminRemarks || "",
    reviewNotes: row.review_notes || data.reviewNotes || "",
    assignment: row.assigned_item_id
      ? {
          jobOpeningItemId: row.assigned_item_id,
          schoolStation: row.assigned_school_station || "",
          subjectArea: row.assigned_subject_area || "",
          vacancyCount: Number(row.assigned_vacancy_count || 0),
          assignedCount: Number(row.assigned_count || 0),
          assignedBy: row.assigned_by || null,
          assignedAt: row.assigned_at || null,
        }
      : null,
    jobItems: Array.isArray(row.job_items)
      ? row.job_items.map((item) => ({
          id: item.id,
          jobOpeningId: item.job_opening_id || item.jobOpeningId || row.job_opening_id,
          schoolStation: item.school_station || item.schoolStation || "",
          subjectArea: item.subject_area || item.subjectArea || "",
          vacancyCount: Number(item.vacancy_count ?? item.vacancyCount ?? 0),
          assignedCount: Number(item.assigned_count ?? item.assignedCount ?? 0),
        }))
      : [],
    raw: data,
  };
}
