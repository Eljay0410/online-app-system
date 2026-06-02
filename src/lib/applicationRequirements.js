export const teachingApplicationRequirements = [
  {
    field: "letterOfIntent",
    label: "Letter of Intent",
    description:
      "Letter addressed to the SDS stating your purpose and subject/learning area.",
    required: true,
  },
  {
    field: "pds",
    label: "PDS with Work Experience Sheet",
    description:
      "CS Form 212 Revised 2025 and Work Experience Sheet.",
    required: true,
  },
  {
    field: "residency",
    label: "Proof of Residency",
    description: "Voter's ID, barangay certificate, or utility bill.",
    required: true,
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC ID.",
    required: true,
  },
  {
    field: "boardRating",
    label: "Board Rating",
    description: "Certificate of Board Rating.",
    required: true,
  },
  {
    field: "academicRecord",
    label: "Academic Records",
    description:
      "TOR and Diploma, including graduate/post-graduate records if available.",
    required: true,
  },
  {
    field: "serviceRecord",
    label: "Service Record / COE",
    description: "Service Record or Certificate of Employment.",
    required: false,
  },
  {
    field: "latestAppointment",
    label: "Latest Appointment",
    description: "Appointment paper for promotion applicants.",
    required: false,
  },
  {
    field: "trainingCertificates",
    label: "Training Certificates",
    description:
      "Certificates of relevant trainings, seminars, or CPD programs.",
    required: false,
  },
  {
    field: "tesdaCertificate",
    label: "TESDA Certificates",
    description:
      "NC II or Trainers Methodology Certificate, if applicable.",
    required: false,
  },
  {
    field: "performanceRating",
    label: "Performance Ratings",
    description:
      "IPCRF/OPCRF rating with Very Satisfactory or higher.",
    required: true,
  },
  {
    field: "cavDataPrivacy",
    label: "Checklist and Sworn Statement",
    description:
      "Checklist of Requirements, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form.",
    required: true,
  },
  {
    field: "otherDocuments",
    label: "Other Documents",
    description:
      "Portfolio, MOVs, teaching outputs, or other HRMPSB-required documents.",
    required: false,
  },
  {
    field: "outstandingAccomplishments",
    label: "Outstanding Accomplishments",
    description:
      "Documents showing awards, recognition, innovation, research, or other accomplishments based on DO 7 s. 2023.",
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
    label: "PDS with Work Experience Sheet",
    description:
      "CS Form No. 212 Revised 2025 and Work Experience Sheet, if applicable.",
    required: true,
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC ID, if applicable.",
    required: false,
  },
  {
    field: "eligibilityRating",
    label: "Eligibility / Rating",
    description: "Certificate of Eligibility or Rating, if applicable.",
    required: false,
  },
  {
    field: "academicRecord",
    label: "Academic Records",
    description:
      "TOR, Diploma, and graduate/post-graduate records, if available.",
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
    label: "Employment Documents",
    description:
      "Certificate of Employment, Contract of Service, or Service Record.",
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
    label: "Checklist and Sworn Statement",
    description:
      "Checklist of Requirements, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form, notarized.",
    required: true,
  },
  {
    field: "outstandingAccomplishments",
    label: "Outstanding Accomplishments",
    description:
      "Documents showing awards, recognition, innovation, research, or other accomplishments based on DO 7 s. 2023.",
    required: false,
  },
];

export const teacherIPersonalSubmissionNotice = {
  title: "Personal Submission Required",
  message:
    "Teacher I applicants are not allowed to upload application requirements online. You may still submit your online application for this vacancy posting. Applicants must submit the required documents in person to the Division Office.",
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
    required: requirement.required !== false,
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
  const normalizedCategory =
    normalizeRequirementCategory(category) ||
    (normalizePositionTitle(positionTitle).includes("teacher") ? "teaching" : "");

  if (normalizedCategory === "teaching") {
    return cloneRequirements(teachingApplicationRequirements);
  }

  if (normalizedCategory === "nonTeaching") {
    return cloneRequirements(nonTeachingApplicationRequirements);
  }

  return getAllApplicationRequirements();
}

export function getFixedApplicationRequirement(field, category = "", positionTitle = "") {
  const normalizedField = String(field || "");

  return getFixedApplicationRequirements(category, positionTitle).find(
    (requirement) => requirement.field === normalizedField
  );
}
