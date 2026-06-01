export const teachingApplicationRequirements = [
  {
    field: "letterOfIntent",
    label: "Letter of Intent",
    description:
      "Addressed to the SDS with statement of purpose/expression of interest and learning area or subject group, if applicable.",
    required: true,
  },
  {
    field: "pds",
    label: "Personal Data Sheet",
    description:
      "Duly accomplished PDS (CS Form 212, Revised 2025) with Work Experience Sheet.",
    required: true,
  },
  {
    field: "residency",
    label: "Proof of Residency",
    description: "Voter's ID and/or any proof of residency.",
    required: true,
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC License or ID.",
    required: true,
  },
  {
    field: "boardRating",
    label: "Certificate of Board Rating",
    description: "Certificate of Board Rating.",
    required: true,
  },
  {
    field: "academicRecord",
    label: "Scholastic / Academic Record",
    description:
      "Transcript of Records (TOR), diploma, and graduate or post-graduate units/degrees, if available.",
    required: true,
  },
  {
    field: "serviceRecord",
    label: "Service Record / Certificate of Employment",
    description:
      "Duly signed Service Record or Certificate of Employment, whichever is applicable.",
    required: false,
  },
  {
    field: "latestAppointment",
    label: "Latest Appointment",
    description: "Latest appointment for applicants applying for promotion.",
    required: false,
  },
  {
    field: "trainingCertificates",
    label: "Training Certificates",
    description:
      "Certificates of relevant specialized trainings or professional development programs, if any.",
    required: false,
  },
  {
    field: "tesdaCertificate",
    label: "TESDA NC II / TMC",
    description:
      "Valid TESDA National Certificate II or Trainers Methodology Certificate, if applicable.",
    required: false,
  },
  {
    field: "performanceRating",
    label: "Performance Ratings",
    description:
      "Required performance ratings with at least Very Satisfactory rating, up to three ratings depending on the position.",
    required: true,
  },
  {
    field: "cavDataPrivacy",
    label: "Checklist / Omnibus / Data Privacy Form",
    description:
      "Checklist of Requirements, Omnibus Sworn Statement on CAV, and Data Privacy Consent Form.",
    required: true,
  },
  {
    field: "otherDocuments",
    label: "Other HRMPSB Documents",
    description:
      "Other documents required by the HRMPSB, including portfolio for PPST non-classroom observable indicators.",
    required: false,
  },
];

export const nonTeachingApplicationRequirements = [
  {
    field: "letterOfIntent",
    label: "Letter of Intent",
    description: "Addressed to the Schools Division Superintendent.",
    required: true,
  },
  {
    field: "pds",
    label: "Personal Data Sheet",
    description:
      "Duly accomplished PDS (CS Form No. 212, Revised 2025) with Work Experience Sheet, if applicable.",
    required: true,
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC License or ID, if applicable.",
    required: false,
  },
  {
    field: "eligibilityRating",
    label: "Certificate of Eligibility / Rating",
    description: "Certificate of Eligibility or Rating, if applicable.",
    required: false,
  },
  {
    field: "academicRecord",
    label: "Scholastic / Academic Record",
    description:
      "Transcript of Records (TOR), diploma, and graduate or post-graduate units/degrees, if available.",
    required: true,
  },
  {
    field: "trainingCertificates",
    label: "Training Certificates",
    description: "Certificates of Training, if applicable.",
    required: false,
  },
  {
    field: "serviceRecord",
    label: "Employment / Service Record",
    description:
      "Certificate of Employment, Contract of Service, or duly signed Service Record, whichever is applicable.",
    required: false,
  },
  {
    field: "latestAppointment",
    label: "Latest Appointment",
    description: "Latest Appointment, if applicable.",
    required: false,
  },
  {
    field: "performanceRating",
    label: "Performance Rating",
    description:
      "Performance Rating in the last rating period(s) covering three years in the current/latest position, if applicable.",
    required: false,
  },
  {
    field: "cavDataPrivacy",
    label: "Checklist / Omnibus / Data Privacy Form",
    description:
      "Checklist of Requirements, Omnibus Sworn Statement on CAV, and notarized Data Privacy Consent Form.",
    required: true,
  },
  {
    field: "outstandingAccomplishments",
    label: "Outstanding Accomplishments",
    description: "Outstanding accomplishments, as applicable under DO 7, s. 2023.",
    required: false,
  },
];

export const teacherIPersonalSubmissionNotice = {
  title: "Personal Submission Required",
  message:
    "Teacher I applicants are not allowed to upload application requirements online. You may still submit your online application for this job posting, but all documentary requirements must be submitted personally to the HR/Admin office.",
  confirmLabel: "Submit Application",
  cancelLabel: "Cancel",
};

export const fixedApplicationRequirements = getAllApplicationRequirements();

function normalizeRequirementCategory(category) {
  const value = String(category || "").trim().toLowerCase();

  if (!value) return "";
  if (value.includes("non") && value.includes("teaching")) return "nonTeaching";
  if (value === "nonteaching") return "nonTeaching";
  if (value.includes("teaching")) return "teaching";

  return "";
}

function normalizePositionTitle(positionTitle) {
  return String(positionTitle || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cloneRequirements(requirements) {
  return requirements.map((requirement) => ({
    ...requirement,
    required: false,
  }));
}

export function isTeacherIPersonalSubmissionRequired(positionTitle = "") {
  const normalizedTitle = normalizePositionTitle(positionTitle);

  if (!normalizedTitle) return false;

  const isMasterTeacher = /\bmaster\s+teacher\s+i\b/.test(normalizedTitle);
  const isSpecialEducationTeacher =
    /\bspecial\s+education\s+teacher\s+i\b/.test(normalizedTitle);
  const isSpecialScienceTeacher =
    /\bspecial\s+science\s+teacher\s+i\b/.test(normalizedTitle);
  const isTeacherI = /\bteacher\s+i\b/.test(normalizedTitle);

  return (
    isTeacherI &&
    !isMasterTeacher &&
    !isSpecialEducationTeacher &&
    !isSpecialScienceTeacher
  );
}

export function canUploadRequirementsForPosition(positionTitle = "") {
  return !isTeacherIPersonalSubmissionRequired(positionTitle);
}

export function shouldBlockRequirementUpload(positionTitle = "") {
  return isTeacherIPersonalSubmissionRequired(positionTitle);
}

export function shouldSkipOnlineRequirementCompletenessCheck(positionTitle = "") {
  return isTeacherIPersonalSubmissionRequired(positionTitle);
}

export function shouldCreateRequirementSnapshot(positionTitle = "") {
  return !isTeacherIPersonalSubmissionRequired(positionTitle);
}

export function getTeacherIPersonalSubmissionNotice(positionTitle = "") {
  if (!isTeacherIPersonalSubmissionRequired(positionTitle)) {
    return null;
  }

  return { ...teacherIPersonalSubmissionNotice };
}

export function getApplicationSubmissionRule(positionTitle = "") {
  const requiresPersonalSubmission =
    isTeacherIPersonalSubmissionRequired(positionTitle);

  return {
    allowOnlineApplication: true,
    canUploadRequirements: !requiresPersonalSubmission,
    requiresPersonalSubmission,
    skipOnlineRequirementCompletenessCheck: requiresPersonalSubmission,
    createRequirementSnapshot: !requiresPersonalSubmission,
    notice: requiresPersonalSubmission
      ? { ...teacherIPersonalSubmissionNotice }
      : null,
  };
}

export function getAllApplicationRequirements() {
  const byField = new Map();

  for (const requirement of [
    ...teachingApplicationRequirements,
    ...nonTeachingApplicationRequirements,
  ]) {
    if (!byField.has(requirement.field)) {
      byField.set(requirement.field, requirement);
    }
  }

  return cloneRequirements([...byField.values()]);
}

export function getFixedApplicationRequirements(category = "", positionTitle = "") {
  if (isTeacherIPersonalSubmissionRequired(positionTitle)) {
    return [];
  }

  const normalizedCategory = normalizeRequirementCategory(category);

  if (normalizedCategory === "teaching") {
    return cloneRequirements(teachingApplicationRequirements);
  }

  if (normalizedCategory === "nonTeaching") {
    return cloneRequirements(nonTeachingApplicationRequirements);
  }

  return getAllApplicationRequirements();
}

export function getFixedApplicationRequirement(field, category = "", positionTitle = "") {
  if (isTeacherIPersonalSubmissionRequired(positionTitle)) {
    return undefined;
  }

  const normalizedField = String(field || "");

  return getFixedApplicationRequirements(category, positionTitle).find(
    (requirement) => requirement.field === normalizedField
  );
}
