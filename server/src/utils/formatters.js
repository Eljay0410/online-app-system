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

export function mapApplication(row) {
  const data = row.data || {};
  const personalInfo = data.personalInfo || {};
  const jobPosition = data.jobPosition || {};

  return {
    id: row.id,
    uan: String(row.uan || "").toUpperCase(),
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
    position:
      jobPosition.positionType ||
      jobPosition.positionCategory ||
      data.position ||
      "Not specified",
    raw: data,
  };
}
