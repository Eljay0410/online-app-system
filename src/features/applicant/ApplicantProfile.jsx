"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import { useToast } from "../../components/ui/toastContext";
import { getStoredUser, storeUser, useAuth } from "../auth/auth";
import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirements,
} from "../../lib/applicationRequirements";

const defaultFiles = {};

const defaultProfile = {
  personalInfo: {
    firstName: "",
    noMiddleName: false,
    middleName: "",
    lastName: "",
    suffix: "",
    address: "",
    contactNumber: "",
    emailAddress: "",
    dob: "",
    age: "",
    sex: "",
    civilStatus: "",
    nationality: "",
    nationalityInput: "",
    religion: "",
    religionInput: "",
    hasEthnicGroup: false,
    ethnicGroup: "",
    hasDisability: false,
    disability: "",
    isSoloParent: false,
    soloParentIdNumber: "",
    isPwd: false,
    pwdIdNumber: "",
  },
  educationalBackground: {
    bachelors: [{ school: "", course: "", year: "", award: "" }],
    postGraduate: [{ school: "", course: "", year: "", award: "" }],
  },
  eligibility: {
    eligibilities: [
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ],
    workExperiences: [
      {
        position: "",
        agency: "",
        status: "",
        from: "",
        fromYear: "",
        toYear: "",
      },
    ],
  },
  learningDevelopment: {
    trainings: [
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ],
  },
  jobPosition: {
    positionCategory: "",
    positionType: "",
    jobOpeningId: "",
    files: defaultFiles,
  },
  accountDetails: {
    applicantNumber: "CSJDM-2026-0001",
    accountStatus: "Active",
  },
};

const steps = [
  { id: 1, title: "PERSONAL INFORMATION", key: "personalInfo" },
  { id: 2, title: "EDUCATIONAL BACKGROUND", key: "educationalBackground" },
  { id: 3, title: "ELIGIBILITY", key: "eligibility" },
  { id: 4, title: "LEARNING DEVELOPMENT", key: "learningDevelopment" },
  { id: 5, title: "REQUIREMENTS", key: "jobPosition" },
];

const normalizeNationalityChoice = (value) =>
  value === "Others" ? "Foreigner" : value;

const requiresNationalityDetail = (value) =>
  value === "Dual Citizen" || value === "Foreigner";

const trimValue = (value) => String(value || "").trim();

function normalizeRequirementList(requirements = []) {
  if (!Array.isArray(requirements)) return [];

  return requirements
    .map((requirement, index) => {
      const field = trimValue(requirement?.field);
      const label = trimValue(requirement?.label);

      if (!field && !label) return null;

      return {
        field: field || `requirement_${index + 1}`,
        label: label || field || `Requirement ${index + 1}`,
        description: trimValue(requirement?.description),
        required: requirement?.required !== false,
      };
    })
    .filter(Boolean);
}

function getPositionApplicationRequirements(positionCategory = "", positionType = "") {
  return normalizeRequirementList(
    getFixedApplicationRequirements(positionCategory, positionType)
  );
}

function getSavedOrPositionRequirements(
  savedRequirements,
  positionCategory = "",
  positionType = ""
) {
  const saved = normalizeRequirementList(savedRequirements);

  return saved.length
    ? saved
    : getPositionApplicationRequirements(positionCategory, positionType);
}

function inferPositionCategory(positionType = "") {
  const normalizedType = trimValue(positionType).toLowerCase();

  if (!normalizedType) return "";
  if (normalizedType.includes("teacher")) return "Teaching";
  return "Non-Teaching";
}

function normalizeFileList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function mergeFileLists(...lists) {
  const seen = new Set();
  const merged = [];

  lists.flatMap(normalizeFileList).forEach((file) => {
    const key = String(file?.id || file?.name || file?.fileName || "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(file);
  });

  return merged;
}

function buildRequirementFiles(requirements = [], existingFiles = {}) {
  return Object.fromEntries(
    normalizeRequirementList(requirements).map((requirement) => [
      requirement.field,
      normalizeFileList(existingFiles?.[requirement.field]),
    ])
  );
}

function getRequirementFileIds(files = {}) {
  return Object.fromEntries(
    Object.entries(files || {})
      .map(([field, value]) => [
        field,
        normalizeFileList(value)
          .map((file) => file?.id)
          .filter(Boolean),
      ])
      .filter(([, ids]) => ids.length > 0)
  );
}

function getApplyJobContext(location) {
  const selectedJob = location?.state?.job || null;
  const params = new URLSearchParams(location?.search || "");
  const positionType = selectedJob?.title || params.get("position") || "";
  const positionCategory =
    selectedJob?.positionCategory ||
    params.get("category") ||
    inferPositionCategory(positionType);
  const jobOpeningId = selectedJob?.id || params.get("jobId") || "";

  return {
    selectedJob,
    jobOpeningId: jobOpeningId ? String(jobOpeningId) : "",
    positionCategory,
    positionType,
  };
}

function hasApplyJobContext(context = {}) {
  return Boolean(context.jobOpeningId || context.positionType);
}

function mergeApplyJobContext(profile = defaultProfile, context = {}) {
  if (!hasApplyJobContext(context)) return profile;

  const jobPosition = profile.jobPosition || {};
  const positionCategory =
    context.positionCategory || jobPosition.positionCategory || "";
  const positionType = context.positionType || jobPosition.positionType || "";
  const requirements = getSavedOrPositionRequirements(
    context.selectedJob?.requirements || jobPosition.requirements,
    positionCategory,
    positionType
  );
  const submissionRule = getApplicationSubmissionRule(positionType);

  return {
    ...profile,
    jobPosition: {
      ...jobPosition,
      selectedJob: context.selectedJob || jobPosition.selectedJob || null,
      jobOpeningId: context.jobOpeningId || jobPosition.jobOpeningId || "",
      positionCategory,
      positionType,
      requirements,
      files: submissionRule.requiresPersonalSubmission
        ? {}
        : buildRequirementFiles(requirements, jobPosition.files || {}),
      personalSubmissionRequired: submissionRule.requiresPersonalSubmission,
      requirementSubmissionMode: submissionRule.requiresPersonalSubmission
        ? "personal"
        : "online",
    },
  };
}

function getRequirementFileName(file) {
  return file?.name || file?.fileName || file?.filename || "Uploaded document";
}

function normalizePersonalInfo(personal = {}) {
  const noMiddleName = Boolean(personal.noMiddleName);
  const nationality = normalizeNationalityChoice(trimValue(personal.nationality));
  const religion = trimValue(personal.religion);
  const hasEthnicGroup = Boolean(personal.hasEthnicGroup);
  const hasDisability = Boolean(personal.hasDisability);
  const isSoloParent = Boolean(personal.isSoloParent);
  const isPwd = Boolean(personal.isPwd);

  return {
    ...personal,
    firstName: trimValue(personal.firstName),
    noMiddleName,
    middleName: noMiddleName ? "" : trimValue(personal.middleName),
    lastName: trimValue(personal.lastName),
    suffix: trimValue(personal.suffix),
    address: trimValue(personal.address),
    contactNumber: trimValue(personal.contactNumber),
    emailAddress: trimValue(personal.emailAddress),
    dob: trimValue(personal.dob),
    age: personal.age || "",
    sex: trimValue(personal.sex),
    civilStatus: trimValue(personal.civilStatus),
    nationality,
    nationalityInput: requiresNationalityDetail(nationality)
      ? trimValue(personal.nationalityInput)
      : "",
    religion,
    religionInput: religion === "Others" ? trimValue(personal.religionInput) : "",
    hasEthnicGroup,
    ethnicGroup: hasEthnicGroup ? trimValue(personal.ethnicGroup) : "",
    hasDisability,
    disability: hasDisability ? trimValue(personal.disability) : "",
    isSoloParent,
    soloParentIdNumber: isSoloParent ? trimValue(personal.soloParentIdNumber) : "",
    isPwd,
    pwdIdNumber: isPwd ? trimValue(personal.pwdIdNumber) : "",
  };
}

function validatePersonalInfoData(personal = {}) {
  const normalized = normalizePersonalInfo(personal);
  const newErrors = {};

  if (!normalized.firstName) newErrors.firstName = "First name required";
  if (!normalized.noMiddleName && !normalized.middleName) {
    newErrors.middleName = "Middle name required";
  }
  if (!normalized.lastName) newErrors.lastName = "Last name required";
  if (!normalized.address) newErrors.address = "Address required";

  if (!normalized.contactNumber) {
    newErrors.contactNumber = "Contact number is required.";
  } else if (!/^09\d{9}$/.test(normalized.contactNumber)) {
    newErrors.contactNumber =
      "Contact number must start with 09 and be 11 digits.";
  }

  if (!normalized.emailAddress) {
    newErrors.emailAddress = "Email required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.emailAddress)) {
    newErrors.emailAddress = "Invalid email";
  }

  if (!normalized.dob) newErrors.dob = "Date of birth required";
  if (!normalized.sex) newErrors.sex = "Sex required";
  if (!normalized.civilStatus) newErrors.civilStatus = "Civil status required";
  if (!normalized.nationality) newErrors.nationality = "Nationality required";
  if (requiresNationalityDetail(normalized.nationality) && !normalized.nationalityInput) {
    newErrors.nationalityInput = "Please specify nationality";
  }
  if (!normalized.religion) newErrors.religion = "Religion required";
  if (normalized.religion === "Others" && !normalized.religionInput) {
    newErrors.religionInput = "Please specify religion";
  }
  if (normalized.hasEthnicGroup && !normalized.ethnicGroup) {
    newErrors.ethnicGroup = "Ethnic group required";
  }
  if (normalized.hasDisability && !normalized.disability) {
    newErrors.disability = "Disability details required";
  }
  if (normalized.isSoloParent && !normalized.soloParentIdNumber) {
    newErrors.soloParentIdNumber = "Solo Parent ID number required";
  }
  if (normalized.isPwd && !normalized.pwdIdNumber) {
    newErrors.pwdIdNumber = "PWD ID number required";
  }

  return newErrors;
}

function getPersonalMissingFields(personal = {}) {
  return Object.values(validatePersonalInfoData(personal));
}

function getEducationMissingFields(education = {}) {
  const firstBachelor = normalizeFileList(education.bachelors)[0] || {};
  const missing = [];

  if (!trimValue(firstBachelor.school)) {
    missing.push("Bachelor's Degree: School");
  }

  if (!trimValue(firstBachelor.course)) {
    missing.push("Bachelor's Degree: Course");
  }

  if (!trimValue(firstBachelor.year)) {
    missing.push("Bachelor's Degree: Year");
  }

  return missing;
}

function getEligibilityMissingFields(eligibility = {}) {
  const firstEligibility = normalizeFileList(eligibility.eligibilities)[0] || {};
  const missing = [];

  if (!trimValue(firstEligibility.type)) {
    missing.push("Eligibility: Type");
  }

  if (!trimValue(firstEligibility.rating)) {
    missing.push("Eligibility: Rating");
  }

  if (!trimValue(firstEligibility.examDate)) {
    missing.push("Eligibility: Exam date");
  }

  return missing;
}

function getMissingFieldsForSection(section, data = {}) {
  if (section === "personalInfo") return getPersonalMissingFields(data);
  if (section === "educationalBackground") return getEducationMissingFields(data);
  if (section === "eligibility") return getEligibilityMissingFields(data);

  return [];
}

function normalizeProfileForSave(profile = {}) {
  const merged = mergeProfile(defaultProfile, profile || {});
  const applicationDetails = {
    ...(merged.applicationDetails || {}),
  };
  delete applicationDetails.completedAt;
  const submissionRule = getApplicationSubmissionRule(
    merged.jobPosition?.positionType
  );
  const jobRequirements = getSavedOrPositionRequirements(
    merged.jobPosition?.requirements,
    merged.jobPosition?.positionCategory,
    merged.jobPosition?.positionType
  );

  return {
    ...merged,
    applicationDetails,
    personalInfo: normalizePersonalInfo(merged.personalInfo),
    jobPosition: {
      ...merged.jobPosition,
      requirements: jobRequirements,
      files: submissionRule.requiresPersonalSubmission
        ? {}
        : buildRequirementFiles(jobRequirements, merged.jobPosition?.files || {}),
      personalSubmissionRequired: submissionRule.requiresPersonalSubmission,
      requirementSubmissionMode: submissionRule.requiresPersonalSubmission
        ? "personal"
        : "online",
    },
  };
}

function hasProfileChanges(nextProfile, currentProfile) {
  return (
    JSON.stringify(normalizeProfileForSave(nextProfile)) !==
    JSON.stringify(normalizeProfileForSave(currentProfile))
  );
}

const primaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200";

const uploadMaxFileSize = 15 * 1024 * 1024;
const maxRequirementFilesPerField = 5;
const maxRequirementUploadBatch = 3;
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const acceptedRequirementFileTypesText = acceptedRequirementFileTypes.join(",");

const teachingPositionOptions = [
  "Teacher I",
  "Teacher II",
  "Teacher III",
  "Teacher IV",
  "Teacher V",
  "Teacher VI",
  "Teacher VII",
  "Master Teacher I",
  "Master Teacher II",
  "Master Teacher III",
  "Master Teacher IV",
  "Master Teacher V",
];

const nonTeachingPositionOptions = [
  "Administrative Officer",
  "Administrative Assistant",
  "Administrative Aide",
  "Accounting Clerk",
  "Bookkeeper",
  "Disbursing Officer",
  "Guidance Counselor",
  "Librarian",
  "Nurse",
  "Registrar",
  "School Clerk",
  "Security Guard",
  "Utility Worker",
];

function getHardcodedPositionOptions(category) {
  if (category === "Teaching") return teachingPositionOptions;
  if (category === "Non-Teaching") return nonTeachingPositionOptions;
  return [];
}

export default function ApplicantProfile({
  embedded = false,
  mode = "full",
  autoEdit = false,
}) {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const applyJobContext = useMemo(
    () => getApplyJobContext(location),
    [location]
  );
  const isApplyFlow = mode === "information" && hasApplyJobContext(applyJobContext);
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [currentStep, setCurrentStep] = useState(mode === "documents" ? 5 : 1);
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [personalErrors, setPersonalErrors] = useState({});
  const flatInformationLayout = embedded && mode === "information";
  const visibleSteps =
    mode === "information"
      ? steps
      : mode === "documents"
      ? steps.filter((step) => step.id === 5)
      : steps;

  useEffect(() => {
    let isMounted = true;
    const storedUser = getStoredUser?.();

    const accountPrefill = {
      ...defaultProfile,
      personalInfo: {
        ...defaultProfile.personalInfo,
        firstName: storedUser?.firstName || "",
        lastName: storedUser?.lastName || "",
        emailAddress: storedUser?.email || "",
      },
    };

    const hydrateFromStorage = () => {
      try {
        const savedFullProfile = localStorage.getItem("applicantFullProfile");
        const savedProfile = localStorage.getItem("applicantProfile");

        if (savedFullProfile) {
          const parsed = JSON.parse(savedFullProfile);
          const merged = mergeApplyJobContext(
            mergeProfile(accountPrefill, parsed),
            applyJobContext
          );
          if (isMounted) {
            setProfile(merged);
            setFormData(merged);
          }
          return;
        }

        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);

          const merged = mergeApplyJobContext(
            {
              ...accountPrefill,
              personalInfo: {
                ...accountPrefill.personalInfo,
                ...parsed,
                contactNumber: parsed.contactNumber || parsed.phone || "",
                emailAddress: parsed.emailAddress || parsed.email || "",
                dob: parsed.dob || parsed.birthDate || "",
                isSoloParent: parsed.isSoloParent || false,
                soloParentIdNumber: parsed.soloParentIdNumber || "",
                isPwd: parsed.isPwd || false,
                pwdIdNumber: parsed.pwdIdNumber || "",
              },
              accountDetails: {
                ...accountPrefill.accountDetails,
                applicantNumber:
                  parsed.applicantNumber ||
                  accountPrefill.accountDetails.applicantNumber,
                accountStatus:
                  parsed.accountStatus ||
                  accountPrefill.accountDetails.accountStatus,
              },
            },
            applyJobContext
          );

          if (isMounted) {
            setProfile(merged);
            setFormData(merged);
          }
          return;
        }
      } catch (error) {
        console.error("Failed to load applicant profile:", error);
      }

      if (isMounted) {
        const merged = mergeApplyJobContext(accountPrefill, applyJobContext);
        setProfile(merged);
        setFormData(merged);
      }
    };

    const loadProfile = async () => {
      try {
        const result = await apiRequest("/api/applicant/profile");
        if (!isMounted) return;

        const profilePayload = result.profile || {};
        const serverData = profilePayload.data || {};
        const merged = mergeApplyJobContext(
          mergeProfile(accountPrefill, {
            ...serverData,
            uan: profilePayload.uan,
          }),
          applyJobContext
        );
        setProfile(merged);
        setFormData(merged);

        localStorage.setItem("applicantFullProfile", JSON.stringify(merged));

        if (result.user) {
          updateUser?.(result.user);
        }
      } catch {
        hydrateFromStorage();
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [applyJobContext, updateUser]);


  const fullName = useMemo(() => {
    return [
      profile.personalInfo.firstName,
      profile.personalInfo.middleName,
      profile.personalInfo.lastName,
      profile.personalInfo.suffix,
    ]
      .filter(Boolean)
      .join(" ");
  }, [profile]);

  const initials = useMemo(() => {
    const first = profile.personalInfo.firstName?.charAt(0) || "R";
    const last = profile.personalInfo.lastName?.charAt(0) || "B";
    return `${first}${last}`.toUpperCase();
  }, [profile]);

  const headerEmail = useMemo(() => {
    return profile.personalInfo.emailAddress || user?.email || "";
  }, [profile, user]);

  const roleLabel = useMemo(() => {
    const roleValue = user?.role || "applicant";
    if (roleValue === "superadmin") return "Super Admin";
    return `${roleValue.charAt(0).toUpperCase()}${roleValue.slice(1)}`;
  }, [user]);

  const uanDisplay = useMemo(() => {
    const raw = user?.uan || profile?.uan || "";
    const cleaned = String(raw || "").trim();
    return cleaned ? cleaned.toUpperCase() : "Not assigned";
  }, [user, profile]);

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleEdit = () => {
    setFormData(profile);
    setPersonalErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setPersonalErrors({});
    setIsEditing(false);
  };

  const handleSave = async (profileOverride) => {
    if (isSaving) return false;

    const sourceProfile = profileOverride || formData;
    const nextPersonalErrors = validatePersonalInfoData(
      sourceProfile.personalInfo
    );

    if (Object.keys(nextPersonalErrors).length > 0) {
      setPersonalErrors(nextPersonalErrors);
      setCurrentStep(1);
      showToast({
        type: "error",
        message: "Please fix the Personal Information fields before saving.",
      });
      return false;
    }

    setPersonalErrors({});

    if (!hasProfileChanges(sourceProfile, profile)) {
      showToast({
        type: "info",
        message: "No changes to save.",
      });
      return false;
    }

    setIsSaving(true);
    const normalizedProfile = normalizeProfileForSave(sourceProfile);

    const completedAt = new Date().toISOString();
    const finalProfile = {
      ...normalizedProfile,
      applicationDetails: {
        ...(normalizedProfile.applicationDetails || {}),
        completedAt,
      },
    };

    try {
      const result = await apiRequest("/api/applicant/profile", {
        method: "PUT",
        body: JSON.stringify(finalProfile),
      });

      const savedData = result.profile?.data || finalProfile;
      const merged = mergeProfile(defaultProfile, savedData);
      const mergedWithUan = {
        ...merged,
        uan: result.uan || merged.uan,
      };

      setProfile(mergedWithUan);
      setFormData(mergedWithUan);

      localStorage.setItem(
        "applicantFullProfile",
        JSON.stringify(mergedWithUan)
      );
      localStorage.setItem(
        "applicantProfile",
        JSON.stringify({
          ...mergedWithUan.personalInfo,
          email: mergedWithUan.personalInfo.emailAddress,
          phone: mergedWithUan.personalInfo.contactNumber,
          birthDate: mergedWithUan.personalInfo.dob,
          applicantNumber: mergedWithUan.accountDetails.applicantNumber,
          accountStatus: mergedWithUan.accountDetails.accountStatus,
        })
      );

      const storedUser = getStoredUser?.();
      const userPatch = {
        firstName: merged.personalInfo.firstName,
        middleName: merged.personalInfo.middleName,
        noMiddleName: Boolean(merged.personalInfo.noMiddleName),
        lastName: merged.personalInfo.lastName,
        email: merged.personalInfo.emailAddress,
        contactNumber: merged.personalInfo.contactNumber,
        profileComplete: Boolean(result.profileComplete),
        uan: result.uan || storedUser?.uan,
      };

      if (storedUser && storeUser) {
        storeUser({
          ...storedUser,
          ...userPatch,
        });
      }

      updateUser?.(userPatch);
      showToast({
        type: "success",
        message: "Profile changes saved.",
      });
      if (!autoEdit) {
        setIsEditing(false);
      }
      return true;
    } catch (error) {
      console.error("Failed to save applicant profile:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save applicant profile.",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const submitApplicationFromProfile = async (profileOverride) => {
    if (isSubmittingApplication) return false;

    const sourceProfile = mergeApplyJobContext(
      profileOverride || formData,
      applyJobContext
    );
    const jobOpeningId = sourceProfile.jobPosition?.jobOpeningId;

    if (!jobOpeningId) {
      showToast({
        type: "error",
        message: "Select a vacancy before submitting your application.",
      });
      return false;
    }

    const nextPersonalErrors = validatePersonalInfoData(sourceProfile.personalInfo);

    if (Object.keys(nextPersonalErrors).length > 0) {
      setPersonalErrors(nextPersonalErrors);
      setCurrentStep(1);
      showToast({
        type: "error",
        message: "Please fix the Personal Information fields before submitting.",
      });
      return false;
    }

    setIsSubmittingApplication(true);

    try {
      if (hasProfileChanges(sourceProfile, profile)) {
        const saved = await handleSave(sourceProfile);

        if (!saved) {
          return false;
        }
      }

      await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({
          jobOpeningId,
          requirementFiles: sourceProfile.jobPosition?.personalSubmissionRequired
            ? {}
            : getRequirementFileIds(sourceProfile.jobPosition?.files || {}),
        }),
      });

      showToast({
        type: "success",
        message: "Application submitted.",
      });
      navigate("/applications");
      return true;
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to submit application.",
      });
      return false;
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const activeStep = visibleSteps.some((step) => step.id === currentStep)
    ? currentStep
    : visibleSteps[0]?.id || 1;

  return (
    <div
      className={
        embedded
          ? "font-['Poppins']"
          : "min-h-screen bg-slate-50 px-4 pb-8 pt-28 font-['Poppins']"
      }
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #print-section,
            #print-section * {
              visibility: visible;
            }

            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              background: white;
              color: black;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="mx-auto max-w-6xl">
        {!embedded && (
          <ProfileHeader
            initials={initials}
            fullName={fullName || "Applicant"}
            applicantNumber={profile.accountDetails.applicantNumber}
            email={headerEmail}
            role={roleLabel}
            uan={uanDisplay}
          />
        )}

        <div
          className={
            flatInformationLayout
              ? "mt-0"
              : "mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6"
          }
        >
          {!autoEdit && (
            <div className="no-print mb-5 flex justify-end">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className={primaryButtonClass}
                >
                  Update
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={secondaryButtonClass}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className={primaryButtonClass}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>
          )}

          <div
            className={
              mode === "documents"
                ? "grid grid-cols-1"
                : "grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]"
            }
          >
            {mode !== "documents" && (
              <VerticalStepper
                steps={visibleSteps}
                currentStep={activeStep}
                setCurrentStep={setCurrentStep}
                lockFutureSteps={isApplyFlow}
              />
            )}

            <div
              className={
                flatInformationLayout
                  ? "min-h-[540px] rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-8"
                  : "min-h-[540px] rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 md:p-10"
              }
            >
              <h2 className="oas-page-title mb-8 uppercase text-[#003a78]">
                {visibleSteps.find((s) => s.id === activeStep)?.title}
              </h2>

              <RenderStepContent
                currentStep={activeStep}
                setCurrentStep={setCurrentStep}
                formData={formData}
                updateFormData={updateFormData}
                isEditing={isEditing}
                onSave={handleSave}
                onFinalSave={isApplyFlow ? submitApplicationFromProfile : null}
                isSaving={isSaving}
                isSubmittingApplication={isSubmittingApplication}
                steps={visibleSteps}
                finalSubmitLabel={isApplyFlow ? "Submit Application" : "Save Changes"}
                flatSections={flatInformationLayout}
                personalErrors={personalErrors}
                setPersonalErrors={setPersonalErrors}
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function RenderStepContent({
  currentStep,
  setCurrentStep,
  formData,
  updateFormData,
  isEditing,
  onSave,
  onFinalSave,
  isSaving,
  isSubmittingApplication = false,
  steps,
  finalSubmitLabel = "Save Changes",
  flatSections = false,
  personalErrors = {},
  setPersonalErrors,
}) {
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const previousStep = steps[currentIndex - 1]?.id;
  const nextStep = steps[currentIndex + 1]?.id;
  const footerLabel = nextStep ? "Next Step" : finalSubmitLabel;
  const saveWithSection = (section, data) =>
    onSave?.({
      ...formData,
      [section]: data,
    });
  const finalSaveWithSection = (section, data) => {
    const nextProfile = {
      ...formData,
      [section]: data,
    };

    return onFinalSave ? onFinalSave(nextProfile) : onSave?.(nextProfile);
  };

  const requestStepNavigation = ({
    section,
    data,
    targetStep,
    direction = "next",
    action,
  }) => {
    updateFormData(section, data);

    if (section === "personalInfo") {
      setPersonalErrors?.(validatePersonalInfoData(data));
    }

    const missingFields = getMissingFieldsForSection(section, data);
    const continueAction = action || (() => setCurrentStep(targetStep));

    if (missingFields.length > 0) {
      setPendingNavigation({
        direction,
        missingFields,
        onConfirm: continueAction,
      });
      return;
    }

    continueAction();
  };

  const handleBack = (section, data) => {
    if (!previousStep) return;

    requestStepNavigation({
      section,
      data,
      targetStep: previousStep,
      direction: "back",
    });
  };

  const handleNext = (section, data) => {
    requestStepNavigation({
      section,
      data,
      targetStep: nextStep,
      direction: "next",
      action: nextStep
        ? () => setCurrentStep(nextStep)
        : () => saveWithSection(section, data),
    });
  };

  const content = (() => {
    switch (currentStep) {
    case 1:
      return (
        <PersonalInfo
          data={formData.personalInfo}
          disabled={!isEditing}
          isSaving={isSaving}
          validationErrors={personalErrors}
          onValidationErrorsChange={setPersonalErrors}
          onChange={(data) => updateFormData("personalInfo", data)}
          onNext={(data) => {
            handleNext("personalInfo", data);
          }}
          onBack={(data) => handleBack("personalInfo", data)}
          showBack={Boolean(previousStep)}
          footerLabel={footerLabel}
        />
      );

    case 2:
      return (
        <EducationalBackground
          data={formData.educationalBackground}
          disabled={!isEditing}
          isSaving={isSaving}
          flatSections={flatSections}
          onChange={(data) => updateFormData("educationalBackground", data)}
          onNext={(data) => {
            handleNext("educationalBackground", data);
          }}
          onBack={(data) => handleBack("educationalBackground", data)}
          showBack={Boolean(previousStep)}
          footerLabel={footerLabel}
        />
      );

    case 3:
      return (
        <Eligibility
          data={formData.eligibility}
          disabled={!isEditing}
          isSaving={isSaving}
          flatSections={flatSections}
          onChange={(data) => updateFormData("eligibility", data)}
          onNext={(data) => {
            handleNext("eligibility", data);
          }}
          onBack={(data) => handleBack("eligibility", data)}
          showBack={Boolean(previousStep)}
          footerLabel={footerLabel}
        />
      );

    case 4:
      return (
        <LearningDevelopment
          data={formData.learningDevelopment}
          disabled={!isEditing}
          isSaving={isSaving}
          flatSections={flatSections}
          onChange={(data) => updateFormData("learningDevelopment", data)}
          onNext={(data) => {
            handleNext("learningDevelopment", data);
          }}
          onBack={(data) => handleBack("learningDevelopment", data)}
          showBack={Boolean(previousStep)}
          footerLabel={footerLabel}
        />
      );

    case 5:
      return (
        <Attachment
          data={formData.jobPosition}
          disabled={!isEditing || isSubmittingApplication}
          onChange={(data) => updateFormData("jobPosition", data)}
          onNext={(data) => updateFormData("jobPosition", data)}
          onSave={(data) => finalSaveWithSection("jobPosition", data)}
          onBack={(data) => handleBack("jobPosition", data)}
          showBack={Boolean(previousStep)}
          isSaving={isSaving || isSubmittingApplication}
          submitLabel={footerLabel}
        />
      );

    default:
      return null;
    }
  })();

  return (
    <>
      {content}
      {pendingNavigation && (
        <IncompleteFieldsModal
          direction={pendingNavigation.direction}
          missingFields={pendingNavigation.missingFields}
          onCancel={() => setPendingNavigation(null)}
          onConfirm={() => {
            const confirmAction = pendingNavigation.onConfirm;
            setPendingNavigation(null);
            confirmAction?.();
          }}
        />
      )}
    </>
  );
}

function ProfileHeader({
  initials,
  fullName,
  applicantNumber,
  email,
  role,
  uan,
}) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative min-h-[132px] bg-slate-900 px-6 py-5 md:px-10">
        <div className="relative flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[4px] border-white bg-slate-100 shadow-lg">
            <span className="text-lg font-extrabold text-slate-700">
              {initials}
            </span>
          </div>

          <div className="min-w-0 flex-1 text-white">
            <h1 className="mt-2 text-xl font-extrabold md:text-2xl">
              {fullName}
            </h1>

            {email && (
              <p className="mt-1 text-sm font-medium text-slate-200">
                {email}
              </p>
            )}

            {role && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                {role}
              </p>
            )}

            <div className="mt-3 rounded-xl bg-white/10 px-4 py-3 text-center md:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">
                UAN
              </p>
              <p className="mt-2 break-all text-2xl font-extrabold tracking-[0.22em] text-white md:text-3xl">
                {uan}
              </p>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-2 md:w-72">
            <div className="rounded-full bg-white/95 px-4 py-2 text-center text-xs font-bold text-slate-700 shadow-sm">
              {applicantNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerticalStepper({
  steps,
  currentStep,
  setCurrentStep,
  lockFutureSteps = false,
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeStep = steps[activeIndex] || steps[0];

  return (
    <>
    <div className="lg:hidden">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-blue-700">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold uppercase text-slate-950">
            {activeStep?.title}
          </p>
        </div>

        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isLocked = lockFutureSteps && step.id > currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (!isLocked) setCurrentStep(step.id);
                }}
                disabled={isLocked}
                aria-label={step.title}
                title={step.title}
                className={`h-2 rounded-full transition ${
                  isActive
                    ? "bg-[#0056b3]"
                    : isDone
                    ? "bg-green-500"
                    : "bg-slate-200"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              />
            );
          })}
        </div>
      </div>
    </div>

    <div className="hidden lg:block">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="relative">
          <div className="absolute bottom-8 left-[31px] top-8 w-[2px] rounded-full bg-slate-200" />

          <div className="space-y-4">
            {steps.map((step) => {
            const isDone = currentStep > step.id;
            const isActive = currentStep === step.id;
            const isLocked = lockFutureSteps && step.id > currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (!isLocked) setCurrentStep(step.id);
                }}
                disabled={isLocked}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                    isActive
                      ? "bg-slate-50 shadow-sm ring-1 ring-slate-200"
                      : "hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent`}
              >
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                      isDone
                        ? "border-green-500 bg-green-500 text-white"
                        : isActive
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {step.id}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-extrabold uppercase leading-snug ${
                        isActive
                          ? "text-slate-900"
                          : isDone
                          ? "text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>

                    <span
                      className={`mt-1 block text-xs ${
                        isActive ? "text-slate-600" : "text-slate-400"
                      }`}
                    >
                      Step {step.id} of {steps.length}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs font-medium leading-5 text-slate-700 ring-1 ring-slate-200">
        {lockFutureSteps
          ? "Complete each step to continue. You can return to earlier sections anytime."
          : "Click any step to preview or update that section."}
      </div>
    </div>
    </>
  );
}

function mergeProfile(baseProfile, parsedProfile) {
  const parsedJobPosition = parsedProfile.jobPosition || {};
  const parsedRequirements = getSavedOrPositionRequirements(
    parsedJobPosition.requirements,
    parsedJobPosition.positionCategory,
    parsedJobPosition.positionType
  );

  return {
    ...baseProfile,
    ...parsedProfile,
    personalInfo: {
      ...baseProfile.personalInfo,
      ...parsedProfile.personalInfo,
    },
    educationalBackground: {
      ...baseProfile.educationalBackground,
      ...parsedProfile.educationalBackground,
    },
    eligibility: {
      ...baseProfile.eligibility,
      ...parsedProfile.eligibility,
    },
    learningDevelopment: {
      ...baseProfile.learningDevelopment,
      ...parsedProfile.learningDevelopment,
    },
    jobPosition: {
      ...baseProfile.jobPosition,
      ...parsedJobPosition,
      requirements: parsedRequirements,
      files: buildRequirementFiles(parsedRequirements, parsedJobPosition.files || {}),
    },
    accountDetails: {
      ...baseProfile.accountDetails,
      ...parsedProfile.accountDetails,
    },
  };
}

/* ================= PERSONAL INFO ================= */

function PersonalInfo({
  data = {},
  onChange,
  onNext,
  onBack,
  disabled = false,
  isSaving = false,
  validationErrors = {},
  onValidationErrorsChange,
  showBack = false,
  footerLabel = "Next Step",
}) {
  const errors = validationErrors || {};
  const [personal, setPersonal] = useState({
    firstName: data.firstName || "",
    noMiddleName: data.noMiddleName ?? false,
    middleName: data.middleName || "",
    lastName: data.lastName || "",
    suffix: data.suffix || "",
    address: data.address || "",
    contactNumber: data.contactNumber || "",
    emailAddress: data.emailAddress || "",
    dob: data.dob || "",
    age: data.age || "",
    sex: data.sex || "",
    civilStatus: data.civilStatus || "",
    nationality: normalizeNationalityChoice(data.nationality || ""),
    nationalityInput: data.nationalityInput || "",
    religion: data.religion || "",
    religionInput: data.religionInput || "",
    hasEthnicGroup: data.hasEthnicGroup ?? false,
    ethnicGroup: data.ethnicGroup || "",
    hasDisability: data.hasDisability ?? false,
    disability: data.disability || "",
    isSoloParent: data.isSoloParent ?? false,
    soloParentIdNumber: data.soloParentIdNumber || "",
    isPwd: data.isPwd ?? false,
    pwdIdNumber: data.pwdIdNumber || "",
  });

  useEffect(() => {
    let isActive = true;
    const nextPersonal = {
      firstName: data.firstName || "",
      noMiddleName: data.noMiddleName ?? false,
      middleName: data.middleName || "",
      lastName: data.lastName || "",
      suffix: data.suffix || "",
      address: data.address || "",
      contactNumber: data.contactNumber || "",
      emailAddress: data.emailAddress || "",
      dob: data.dob || "",
      age: data.age || "",
      sex: data.sex || "",
      civilStatus: data.civilStatus || "",
      nationality: normalizeNationalityChoice(data.nationality || ""),
      nationalityInput: data.nationalityInput || "",
      religion: data.religion || "",
      religionInput: data.religionInput || "",
      hasEthnicGroup: data.hasEthnicGroup ?? false,
      ethnicGroup: data.ethnicGroup || "",
      hasDisability: data.hasDisability ?? false,
      disability: data.disability || "",
      isSoloParent: data.isSoloParent ?? false,
      soloParentIdNumber: data.soloParentIdNumber || "",
      isPwd: data.isPwd ?? false,
      pwdIdNumber: data.pwdIdNumber || "",
    };

    queueMicrotask(() => {
      if (isActive) setPersonal(nextPersonal);
    });

    return () => {
      isActive = false;
    };
  }, [data]);

  const suffixOptions = ["Jr.", "Sr.", "II", "III", "IV", "V", "VI"];
  const religionOptions = [
    "Roman Catholic",
    "Christian",
    "Islam",
    "Iglesia ni Cristo",
    "Protestant",
    "Born Again Christian",
    "Seventh-day Adventist",
    "Jehovah's Witness",
    "Buddhism",
    "Hinduism",
    "Aglipayan",
    "None",
    "Others",
  ];
  const ethnicGroupOptions = [
    "Aeta",
    "Agta",
    "Bajau",
    "Bicolano",
    "Bisaya",
    "Cebuano",
    "Chavacano",
    "Hiligaynon",
    "Ifugao",
    "Igorot",
    "Ilocano",
    "Ivatan",
    "Kapampangan",
    "Lumad",
    "Maguindanaon",
    "Maranao",
    "Pangasinense",
    "Sama",
    "Tagalog",
    "Tausug",
    "Waray",
    "Yakan",
  ];

  const calculateAge = (birthDate) => {
    if (!birthDate) return "";

    const today = new Date();
    const birth = new Date(birthDate);

    let computedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      computedAge--;
    }

    return computedAge;
  };

  const updateField = (field, value) => {
    const updated = {
      ...personal,
      [field]: value,
    };

    if (field === "dob") {
      updated.age = calculateAge(value);
    }

    if (field === "contactNumber") {
      updated.contactNumber = value.replace(/\D/g, "").slice(0, 11);
    }

    if (field === "noMiddleName") {
      updated.middleName = value ? "" : personal.middleName;
    }

    if (field === "hasEthnicGroup" && !value) {
      updated.ethnicGroup = "";
    }

    if (field === "hasDisability" && !value) {
      updated.disability = "";
    }

    if (field === "isSoloParent" && !value) {
      updated.soloParentIdNumber = "";
    }

    if (field === "isPwd" && !value) {
      updated.pwdIdNumber = "";
    }

    setPersonal(updated);
    onChange?.(updated);

    const clearFields = [field];

    if (field === "nationality") {
      clearFields.push("nationalityInput");
    }

    if (field === "religion") {
      clearFields.push("religionInput");
    }

    if (field === "hasEthnicGroup") {
      clearFields.push("ethnicGroup");
    }

    if (field === "hasDisability") {
      clearFields.push("disability");
    }

    if (field === "isSoloParent") {
      clearFields.push("soloParentIdNumber");
    }

    if (field === "isPwd") {
      clearFields.push("pwdIdNumber");
    }

    if (clearFields.some((key) => errors[key])) {
      const nextErrors = { ...errors };
      clearFields.forEach((key) => {
        delete nextErrors[key];
      });
      onValidationErrorsChange?.(nextErrors);
    }
  };

  const validateForm = () => {
    const newErrors = validatePersonalInfoData(personal);
    onValidationErrorsChange?.(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getNextPersonalData = () => normalizePersonalInfo(personal);

  const handleNext = (e) => {
    e.preventDefault();

    if (!disabled) {
      validateForm();
    }

    onNext?.(getNextPersonalData());
  };

  const handleBack = () => {
    if (!disabled) {
      validateForm();
    }

    onBack?.(getNextPersonalData());
  };

  return (
    <form onSubmit={handleNext} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-4">
        <InputBox
          label="First Name"
          required
          value={personal.firstName}
          disabled={disabled}
          error={errors.firstName}
          onChange={(value) => updateField("firstName", value)}
        />

        <InputBox
          label="Middle Name"
          required={!personal.noMiddleName}
          value={personal.middleName}
          disabled={disabled || personal.noMiddleName}
          error={errors.middleName}
          onChange={(value) => updateField("middleName", value)}
        />

        <InputBox
          label="Last Name"
          required
          value={personal.lastName}
          disabled={disabled}
          error={errors.lastName}
          onChange={(value) => updateField("lastName", value)}
        />

        <SelectBox
          label="Suffix"
          value={personal.suffix}
          disabled={disabled}
          options={["", ...suffixOptions]}
          onChange={(value) => updateField("suffix", value)}
        />

        <div className="-mt-4 md:col-span-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={disabled}
              checked={personal.noMiddleName}
              onChange={(e) => updateField("noMiddleName", e.target.checked)}
              className="h-4 w-4"
            />
            I don&apos;t have a middle name
          </label>
        </div>

        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-600 mb-1 flex text-center "> Address <span className="text-red-500">*</span>
            <p className="text-xs text-slate-500 my-auto ml-3">House No./Street/Barangay/City/Municipality/Zip Code</p>
          </label>
          <InputBox
            label=""
            required
            value={personal.address}
            disabled={disabled}
            error={errors.address}
            placeholder="Address"
            onChange={(value) => updateField("address", value)}
          />
        </div>

        <div className="md:col-span-2">
          <InputBox
            label="Contact Number"
            required
            value={personal.contactNumber}
            disabled={disabled}
            error={errors.contactNumber}
            type="tel"
            inputMode="numeric"
            maxLength={11}
            placeholder="09XXXXXXXXX"
            onChange={(value) => updateField("contactNumber", value)}
          />
        </div>

        <div className="md:col-span-2">
          <InputBox
            label="Email Address"
            required
            value={personal.emailAddress}
            disabled={disabled}
            error={errors.emailAddress}
            onChange={(value) => updateField("emailAddress", value)}
          />
        </div>

        <InputBox
          label="Date of Birth"
          type="date"
          required
          value={personal.dob}
          disabled={disabled}
          error={errors.dob}
          onChange={(value) => updateField("dob", value)}
        />

        <InputBox
          label="Age"
          value={personal.age}
          disabled
          onChange={() => {}}
        />

        <SelectBox
          label="Sex"
          required
          value={personal.sex}
          disabled={disabled}
          error={errors.sex}
          options={["", "male", "female"]}
          onChange={(value) => updateField("sex", value)}
        />

        <SelectBox
          label="Civil Status"
          required
          value={personal.civilStatus}
          disabled={disabled}
          error={errors.civilStatus}
          options={["", "single", "married", "widowed", "separated", "divorced"]}
          onChange={(value) => updateField("civilStatus", value)}
        />

        <div className="md:col-span-2">
          <SelectBox
            label="Nationality"
            required
            value={personal.nationality}
            disabled={disabled}
            error={errors.nationality}
            options={["", "Filipino", "Dual Citizen", "Foreigner"]}
            onChange={(value) => updateField("nationality", value)}
          />

          {requiresNationalityDetail(personal.nationality) && (
            <input
              value={personal.nationalityInput}
              disabled={disabled}
              onChange={(e) => updateField("nationalityInput", e.target.value)}
              placeholder="Specify nationality"
              className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                errors.nationalityInput ? "border-red-500" : "border-slate-300"
              }`}
            />
          )}
          {errors.nationalityInput && (
            <p className="mt-1 text-xs text-red-500">
              {errors.nationalityInput}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <SelectBox
            label="Religion"
            required
            value={personal.religion}
            disabled={disabled}
            error={errors.religion}
            options={["", ...religionOptions]}
            onChange={(value) => updateField("religion", value)}
          />

          {personal.religion === "Others" && (
            <input
              value={personal.religionInput}
              disabled={disabled}
              onChange={(e) => updateField("religionInput", e.target.value)}
              placeholder="Specify religion"
              className={`mt-2 h-11 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                errors.religionInput ? "border-red-500" : "border-slate-300"
              }`}
            />
          )}
          {errors.religionInput && (
            <p className="mt-1 text-xs text-red-500">
              {errors.religionInput}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={disabled}
              checked={personal.hasEthnicGroup}
              onChange={(e) => updateField("hasEthnicGroup", e.target.checked)}
              className="h-4 w-4"
            />
            Do you belong to an ethnic group?
          </label>

          {personal.hasEthnicGroup && (
            <SelectBox
              value={personal.ethnicGroup}
              disabled={disabled}
              error={errors.ethnicGroup}
              options={["", ...ethnicGroupOptions]}
              onChange={(value) => updateField("ethnicGroup", value)}
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={disabled}
              checked={personal.hasDisability}
              onChange={(e) => updateField("hasDisability", e.target.checked)}
              className="h-4 w-4"
            />
            Do you have a disability?
          </label>

          {personal.hasDisability && (
            <input
              value={personal.disability}
              disabled={disabled}
              onChange={(e) => updateField("disability", e.target.value)}
              placeholder="Specify disability"
              className={`h-11 w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                errors.disability ? "border-red-500" : "border-slate-300"
              }`}
            />
          )}
          {errors.disability && (
            <p className="mt-1 text-xs text-red-500">{errors.disability}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={disabled}
              checked={personal.isSoloParent}
              onChange={(e) => updateField("isSoloParent", e.target.checked)}
              className="h-4 w-4"
            />
            Solo Parent
          </label>

          {personal.isSoloParent && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Solo Parent ID Number <span className="text-red-500">*</span>
              </label>
              <input
                value={personal.soloParentIdNumber}
                disabled={disabled}
                onChange={(e) =>
                  updateField("soloParentIdNumber", e.target.value)
                }
                placeholder="Solo Parent ID Number"
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                  errors.soloParentIdNumber
                    ? "border-red-500"
                    : "border-slate-300"
                }`}
              />
              {errors.soloParentIdNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.soloParentIdNumber}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              disabled={disabled}
              checked={personal.isPwd}
              onChange={(e) => updateField("isPwd", e.target.checked)}
              className="h-4 w-4"
            />
            PWD
          </label>

          {personal.isPwd && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                PWD ID Number <span className="text-red-500">*</span>
              </label>
              <input
                value={personal.pwdIdNumber}
                disabled={disabled}
                onChange={(e) => updateField("pwdIdNumber", e.target.value)}
                placeholder="PWD ID Number"
                className={`h-11 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
                  errors.pwdIdNumber ? "border-red-500" : "border-slate-300"
                }`}
              />
              {errors.pwdIdNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.pwdIdNumber}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <StepFooter
        onBack={showBack ? handleBack : null}
        onNextSubmit
        label={footerLabel}
        disabled={isSaving}
      />
    </form>
  );
}

/* ================= EDUCATION ================= */

function EducationalBackground({
  data,
  onChange,
  onNext,
  onBack,
  disabled = false,
  isSaving = false,
  flatSections = false,
  showBack = false,
  footerLabel = "Next Step",
}) {
  const [education, setEducation] = useState({
    bachelors: data?.bachelors || [
      { school: "", course: "", year: "", award: "" },
    ],
    postGraduate: data?.postGraduate || [
      { school: "", course: "", year: "", award: "" },
    ],
  });

  useEffect(() => {
    let isActive = true;
    const nextEducation = {
      bachelors: data?.bachelors || [
        { school: "", course: "", year: "", award: "" },
      ],
      postGraduate: data?.postGraduate || [
        { school: "", course: "", year: "", award: "" },
      ],
    };

    queueMicrotask(() => {
      if (isActive) setEducation(nextEducation);
    });

    return () => {
      isActive = false;
    };
  }, [data]);

  const sync = (updated) => {
    setEducation(updated);
    onChange?.(updated);
  };

  const handleChange = (listName, index, field, value) => {
    const updated = {
      ...education,
      [listName]: education[listName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    };

    sync(updated);
  };

  const addItem = (listName) => {
    sync({
      ...education,
      [listName]: [
        ...education[listName],
        { school: "", course: "", year: "", award: "" },
      ],
    });
  };

  const removeItem = (listName) => {
    if (education[listName].length <= 1) return;

    sync({
      ...education,
      [listName]: education[listName].slice(0, -1),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(education);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <EducationGroup
        title="Bachelor's Degree"
        rows={education.bachelors}
        listName="bachelors"
        disabled={disabled}
        flat={flatSections}
        onChange={handleChange}
        onAdd={() => addItem("bachelors")}
        onRemove={() => removeItem("bachelors")}
      />

      <EducationGroup
        title="Post Graduate Degree"
        rows={education.postGraduate}
        listName="postGraduate"
        disabled={disabled}
        flat={flatSections}
        onChange={handleChange}
        onAdd={() => addItem("postGraduate")}
        onRemove={() => removeItem("postGraduate")}
      />

      <StepFooter
        onBack={showBack ? () => onBack?.(education) : null}
        onNextSubmit
        label={footerLabel}
        disabled={isSaving}
      />
    </form>
  );
}

function EducationGroup({
  title,
  rows,
  listName,
  disabled,
  flat = false,
  onChange,
  onAdd,
  onRemove,
}) {
  return (
    <div
      className={
        flat
          ? "space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0"
          : "oas-panel space-y-4 p-5"
      }
    >
      <h2 className="oas-panel-title">{title}</h2>

      <div className="space-y-3">
        {rows.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SmallInput
              label={index === 0 ? "School" : ""}
              placeholder="School"
              value={item.school}
              disabled={disabled}
              onChange={(e) =>
                onChange(listName, index, "school", e.target.value)
              }
            />

            <SmallInput
              label={index === 0 ? "Course" : ""}
              placeholder="Course"
              value={item.course}
              disabled={disabled}
              onChange={(e) =>
                onChange(listName, index, "course", e.target.value)
              }
            />

            <SmallInput
              label={index === 0 ? "Year" : ""}
              placeholder="Year"
              value={item.year}
              disabled={disabled}
              onChange={(e) =>
                onChange(listName, index, "year", e.target.value)
              }
            />

            <SmallInput
              label={index === 0 ? "Award" : ""}
              placeholder="Award"
              value={item.award}
              disabled={disabled}
              onChange={(e) =>
                onChange(listName, index, "award", e.target.value)
              }
            />
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-4 pt-1">
          <button
            type="button"
            onClick={onAdd}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {rows.length > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= ELIGIBILITY ================= */

function Eligibility({
  data,
  onChange,
  onNext,
  onBack,
  disabled = false,
  isSaving = false,
  flatSections = false,
  showBack = false,
  footerLabel = "Next Step",
}) {
  const [eligibility, setEligibility] = useState({
    eligibilities: data?.eligibilities || [
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ],
    workExperiences: data?.workExperiences || [
      {
        position: "",
        agency: "",
        status: "",
        from: "",
        fromYear: "",
        toYear: "",
      },
    ],
  });

  useEffect(() => {
    let isActive = true;
    const nextEligibility = {
      eligibilities: data?.eligibilities || [
        {
          type: "",
          rating: "",
          examDate: "",
          licenseNumber: "",
          validUntil: "",
        },
      ],
      workExperiences: data?.workExperiences || [
        {
          position: "",
          agency: "",
          status: "",
          from: "",
          fromYear: "",
          toYear: "",
        },
      ],
    };

    queueMicrotask(() => {
      if (isActive) setEligibility(nextEligibility);
    });

    return () => {
      isActive = false;
    };
  }, [data]);

  const sync = (updated) => {
    setEligibility(updated);
    onChange?.(updated);
  };

  const updateList = (listName, index, field, value) => {
    sync({
      ...eligibility,
      [listName]: eligibility[listName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const addRow = (listName, emptyRow) => {
    sync({
      ...eligibility,
      [listName]: [...eligibility[listName], emptyRow],
    });
  };

  const removeRow = (listName) => {
    if (eligibility[listName].length <= 1) return;

    sync({
      ...eligibility,
      [listName]: eligibility[listName].slice(0, -1),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(eligibility);
  };

  const sectionClassName = flatSections
    ? "space-y-4 border-t border-slate-200 pt-6 first:border-t-0 first:pt-0"
    : "oas-panel space-y-4 p-5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className={sectionClassName}>
        <h2 className="oas-panel-title">
          Eligibility Records
        </h2>

        <div className="space-y-3">
          {eligibility.eligibilities.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <SmallInput
                label={index === 0 ? "Type" : ""}
                placeholder="Type"
                value={item.type}
                disabled={disabled}
                onChange={(e) =>
                  updateList("eligibilities", index, "type", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "Rating" : ""}
                placeholder="Rating"
                value={item.rating}
                disabled={disabled}
                onChange={(e) =>
                  updateList("eligibilities", index, "rating", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "Exam Date" : ""}
                type="date"
                value={item.examDate}
                disabled={disabled}
                onChange={(e) =>
                  updateList("eligibilities", index, "examDate", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "License Number" : ""}
                placeholder="License Number"
                value={item.licenseNumber}
                disabled={disabled}
                onChange={(e) =>
                  updateList(
                    "eligibilities",
                    index,
                    "licenseNumber",
                    e.target.value
                  )
                }
              />

              <SmallInput
                label={index === 0 ? "Valid Until" : ""}
                type="date"
                value={item.validUntil}
                disabled={disabled}
                onChange={(e) =>
                  updateList(
                    "eligibilities",
                    index,
                    "validUntil",
                    e.target.value
                  )
                }
              />
            </div>
          ))}
        </div>

        {!disabled && (
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                addRow("eligibilities", {
                  type: "",
                  rating: "",
                  examDate: "",
                  licenseNumber: "",
                  validUntil: "",
                })
              }
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              + Add Row
            </button>

            {eligibility.eligibilities.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow("eligibilities")}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                - Remove Last
              </button>
            )}
          </div>
        )}
      </div>

      <div className={sectionClassName}>
        <h2 className="oas-panel-title">Work Experience</h2>

        <div className="space-y-3">
          {eligibility.workExperiences.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <SmallInput
                label={index === 0 ? "Position" : ""}
                placeholder="Position"
                value={item.position}
                disabled={disabled}
                onChange={(e) =>
                  updateList(
                    "workExperiences",
                    index,
                    "position",
                    e.target.value
                  )
                }
              />

              <SmallInput
                label={index === 0 ? "Agency" : ""}
                placeholder="Agency"
                value={item.agency}
                disabled={disabled}
                onChange={(e) =>
                  updateList("workExperiences", index, "agency", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "Status" : ""}
                placeholder="Status"
                value={item.status}
                disabled={disabled}
                onChange={(e) =>
                  updateList("workExperiences", index, "status", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "From" : ""}
                type="month"
                value={item.from || item.fromYear}
                disabled={disabled}
                onChange={(e) =>
                  updateList("workExperiences", index, "from", e.target.value)
                }
              />

              <SmallInput
                label={index === 0 ? "To / Present" : ""}
                placeholder="To / Present"
                value={item.toYear}
                disabled={disabled}
                onChange={(e) =>
                  updateList("workExperiences", index, "toYear", e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {!disabled && (
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                addRow("workExperiences", {
                  position: "",
                  agency: "",
                  status: "",
                  from: "",
                  toYear: "",
                })
              }
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              + Add Row
            </button>

            {eligibility.workExperiences.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow("workExperiences")}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                - Remove Last
              </button>
            )}
          </div>
        )}
      </div>

      <StepFooter
        onBack={showBack ? () => onBack?.(eligibility) : null}
        onNextSubmit
        label={footerLabel}
        disabled={isSaving}
      />
    </form>
  );
}

/* ================= LEARNING DEVELOPMENT ================= */

function LearningDevelopment({
  data,
  onChange,
  onNext,
  onBack,
  disabled = false,
  isSaving = false,
  flatSections = false,
  showBack = false,
  footerLabel = "Next Step",
}) {
  const [learning, setLearning] = useState({
    trainings: data?.trainings || [
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ],
  });

  useEffect(() => {
    let isActive = true;
    const nextLearning = {
      trainings: data?.trainings || [
        {
          title: "",
          fromDate: "",
          toDate: "",
          hours: "",
          conductedBy: "",
        },
      ],
    };

    queueMicrotask(() => {
      if (isActive) setLearning(nextLearning);
    });

    return () => {
      isActive = false;
    };
  }, [data]);

  const sync = (updated) => {
    setLearning(updated);
    onChange?.(updated);
  };

  const updateTraining = (index, field, value) => {
    sync({
      trainings: learning.trainings.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    });
  };

  const addTraining = () => {
    sync({
      trainings: [
        ...learning.trainings,
        {
          title: "",
          fromDate: "",
          toDate: "",
          hours: "",
          conductedBy: "",
        },
      ],
    });
  };

  const removeTraining = () => {
    if (learning.trainings.length <= 1) return;

    sync({
      trainings: learning.trainings.slice(0, -1),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(learning);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div
        className={
          flatSections ? "space-y-4" : "oas-panel space-y-4 p-5"
        }
      >
        <h2 className="oas-panel-title">
          Trainings / Seminars
        </h2>

        <div className="space-y-3">
          {learning.trainings.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_2fr_0.7fr_1.4fr]"
            >
              <SmallInput
                label={index === 0 ? "Title" : ""}
                placeholder="Title"
                value={item.title}
                disabled={disabled}
                onChange={(e) => updateTraining(index, "title", e.target.value)}
              />

              <div>
                {index === 0 && (
                  <label className="mb-1 block text-sm font-medium text-slate-600">
                    Inclusive Dates
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <SmallInput
                    type="date"
                    value={item.fromDate}
                    disabled={disabled}
                    onChange={(e) =>
                      updateTraining(index, "fromDate", e.target.value)
                    }
                  />

                  <SmallInput
                    type="date"
                    value={item.toDate}
                    disabled={disabled}
                    onChange={(e) =>
                      updateTraining(index, "toDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <SmallInput
                label={index === 0 ? "Hours" : ""}
                type="number"
                placeholder="Hours"
                value={item.hours}
                disabled={disabled}
                onChange={(e) => updateTraining(index, "hours", e.target.value)}
              />

              <SmallInput
                label={index === 0 ? "Conducted / Sponsored By" : ""}
                placeholder="Conducted / Sponsored By"
                value={item.conductedBy}
                disabled={disabled}
                onChange={(e) =>
                  updateTraining(index, "conductedBy", e.target.value)
                }
              />
            </div>
          ))}
        </div>

        {!disabled && (
          <div className="flex gap-4 pt-1">
            <button
              type="button"
              onClick={addTraining}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              + Add Row
            </button>

            {learning.trainings.length > 1 && (
              <button
                type="button"
                onClick={removeTraining}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                - Remove Last
              </button>
            )}
          </div>
        )}
      </div>

      <StepFooter
        onBack={showBack ? () => onBack?.(learning) : null}
        onNextSubmit
        label={footerLabel}
        disabled={isSaving}
      />
    </form>
  );
}

/* ================= ATTACHMENT ================= */

function Attachment({
  data,
  onChange,
  onNext,
  onSave,
  onBack,
  isSaving,
  disabled = false,
  showBack = false,
  submitLabel = "Save Profile",
}) {
  const { showToast } = useToast();
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const positionCategory = data?.positionCategory || "";
  const positionType = data?.positionType || "";
  const submissionRule = getApplicationSubmissionRule(positionType);
  const requiresPersonalSubmission = submissionRule.requiresPersonalSubmission;
  const isVacancyLocked = Boolean(data?.jobOpeningId && positionType);

  const requirements = useMemo(
    () =>
      isVacancyLocked
        ? getSavedOrPositionRequirements(
            data?.requirements,
            positionCategory,
            positionType
          )
        : getPositionApplicationRequirements(positionCategory, positionType),
    [data?.requirements, isVacancyLocked, positionCategory, positionType]
  );
  const positionOptions = useMemo(
    () => getHardcodedPositionOptions(positionCategory),
    [positionCategory]
  );

  const [selectedRequirementField, setSelectedRequirementField] = useState(
    () => requirements[0]?.field || ""
  );

  const selectedRequirement = useMemo(
    () =>
      requirements.find((req) => req.field === selectedRequirementField) ||
      requirements[0] ||
      null,
    [requirements, selectedRequirementField]
  );

  const filesByField = useMemo(
    () => buildRequirementFiles(requirements, data?.files || {}),
    [data, requirements]
  );
  const [uploadingFields, setUploadingFields] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [submitConfirmation, setSubmitConfirmation] = useState(null);

  useEffect(() => {
    let isMounted = true;

    apiRequest("/api/applicant/requirement-files")
      .then((fileResult) => {
        if (!isMounted) return;
        setLibraryFiles(fileResult.files || []);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingLibrary(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const syncAttachmentData = (updates = {}) => {
    onChange?.({
      ...(data || {}),
      positionCategory,
      positionType,
      jobOpeningId: data?.jobOpeningId || "",
      selectedJob: data?.selectedJob || null,
      requirements,
      files: filesByField,
      ...updates,
    });
  };

  const syncFiles = (nextFiles) => {
    syncAttachmentData({ files: nextFiles });
  };
  const libraryFileByField = useMemo(
    () =>
      libraryFiles.reduce((groups, file) => {
        const key = file.requirementField || "other";
        return {
          ...groups,
          [key]: [...(groups[key] || []), file],
        };
      }, {}),
    [libraryFiles]
  );
  const requirementProgress = useMemo(
    () =>
      requirements.map((requirement) => {
        const files = mergeFileLists(
          filesByField?.[requirement.field],
          libraryFileByField[requirement.field]
        );

        return {
          ...requirement,
          files,
          count: files.length,
          isUploaded: files.length > 0,
        };
      }),
    [filesByField, libraryFileByField, requirements]
  );
  const completedRequirementCount = requirementProgress.filter(
    (requirement) => requirement.isUploaded
  ).length;
  const requiredRequirementProgress = requirementProgress.filter(
    (requirement) => requirement.required !== false
  );
  const missingRequiredRequirementProgress = requiredRequirementProgress.filter(
    (requirement) => !requirement.isUploaded
  );
  const missingRequiredRequirementCount =
    missingRequiredRequirementProgress.length;
  const requirementProgressPercent = requirements.length
    ? Math.round((completedRequirementCount / requirements.length) * 100)
    : 0;
  const selectedRequirementProgress =
    requirementProgress.find(
      (requirement) => requirement.field === selectedRequirement?.field
    ) || null;
  const requirementFields = useMemo(
    () => new Set(requirements.map((requirement) => requirement.field)),
    [requirements]
  );
  const otherLibraryFiles = useMemo(
    () =>
      libraryFiles.filter((file) => {
        const field = file.requirementField || "";
        return field && !requirementFields.has(field);
      }),
    [libraryFiles, requirementFields]
  );

  const handleFileChange = async (field, incomingFiles) => {
    const files = Array.from(incomingFiles || []).filter(Boolean);
    if (files.length === 0) return;

    const requirement = requirements.find(
      (item) => item.field === field
    );

    if (!requirement) {
      showToast({
        type: "warning",
        message: "Select a valid requirement before uploading.",
      });
      return;
    }

    if (files.length > maxRequirementUploadBatch) {
      showToast({
        type: "warning",
        message: `Upload up to ${maxRequirementUploadBatch} files at a time for one requirement.`,
      });
      return;
    }

    const existingFiles = mergeFileLists(
      filesByField[field],
      libraryFileByField[field]
    );

    if (existingFiles.length + files.length > maxRequirementFilesPerField) {
      showToast({
        type: "warning",
        message: `Each requirement can keep up to ${maxRequirementFilesPerField} files.`,
      });
      return;
    }

    const invalidSize = files.find((file) => file.size > uploadMaxFileSize);
    if (invalidSize) {
      showToast({
        type: "warning",
        message: "Please upload files smaller than 15 MB.",
      });
      return;
    }

    const invalidType = files.find(
      (file) => !acceptedRequirementFileTypes.includes(file.type)
    );
    if (invalidType) {
      showToast({
        type: "warning",
        message: "Upload images, PDFs, TXT, DOC, or DOCX files only.",
      });
      return;
    }

    setUploadingFields((current) => ({ ...current, [field]: true }));

    try {
      const uploadedFiles = [];

      for (const file of files) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("requirementLabel", requirement?.label || field);
        payload.append("positionCategory", positionCategory);
        payload.append("positionTitle", positionType);
        payload.append("positionType", positionType);

        const result = await apiRequest(
          `/api/applicant/requirement-files/${encodeURIComponent(field)}`,
          {
            method: "POST",
            body: payload,
          }
        );

        uploadedFiles.push(result.file);
      }

      setLibraryFiles((current) => [
        ...uploadedFiles,
        ...current,
      ]);
      syncFiles({
        ...filesByField,
        [field]: mergeFileLists(filesByField?.[field], uploadedFiles),
      });

      showToast({
        type: "success",
        message:
          uploadedFiles.length === 1
            ? "Requirement uploaded."
            : "Requirement files uploaded.",
      });
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Failed to upload requirement.",
      });
    } finally {
      setUploadingFields((current) => ({ ...current, [field]: false }));
    }
  };

  const handleRemoveFile = async (field, fileOverride = null) => {
    const currentFile = fileOverride || filesByField?.[field];

    if (currentFile?.id) {
      try {
        await apiRequest(
          `/api/applicant/requirement-files/${encodeURIComponent(field)}`,
          {
            method: "DELETE",
            body: JSON.stringify({
              fileId: currentFile.id,
            }),
          }
        );
      } catch (error) {
        showToast({
          type: "error",
          message: error.message || "Failed to remove requirement.",
        });
        return;
      }
    }

    setLibraryFiles((current) =>
      current.filter((file) => String(file.id) !== String(currentFile?.id))
    );
    const remainingFiles = normalizeFileList(filesByField?.[field]).filter(
      (file) => String(file.id) !== String(currentFile?.id)
    );
    syncFiles({
      ...filesByField,
      [field]: remainingFiles,
    });
    showToast({ type: "success", message: "Requirement removed." });
  };

  const showPositionList =
    positionCategory === "Teaching" || positionCategory === "Non-Teaching";
  const showAttachments =
    showPositionList &&
    Boolean(positionType) &&
    requirements.length > 0 &&
    !requiresPersonalSubmission;

  const handleCategoryChange = (value) => {
    const nextRequirements = getPositionApplicationRequirements(value);
    setSelectedRequirementField(nextRequirements[0]?.field || "");
    syncAttachmentData({
      positionCategory: value,
      positionType: "",
      requirements: nextRequirements,
      files: filesByField,
    });
  };

  const handlePositionChange = (value) => {
    const nextSubmissionRule = getApplicationSubmissionRule(value);
    const nextRequiresPersonalSubmission =
      nextSubmissionRule.requiresPersonalSubmission;
    const nextRequirements = getPositionApplicationRequirements(
      positionCategory,
      value
    );

    setSelectedRequirementField(nextRequirements[0]?.field || "");

    syncAttachmentData({
      positionCategory,
      positionType: value,
      requirements: nextRequirements,
      files: nextRequiresPersonalSubmission ? {} : filesByField,
      personalSubmissionRequired: nextRequiresPersonalSubmission,
      requirementSubmissionMode: nextRequiresPersonalSubmission
        ? "personal"
        : "online",
    });
  };

  const getNextAttachmentData = () => ({
      ...(data || {}),
      jobOpeningId: data?.jobOpeningId || "",
      selectedJob: data?.selectedJob || null,
      positionCategory,
      positionType,
      requirements,
      files: requiresPersonalSubmission ? {} : filesByField,
      personalSubmissionRequired: requiresPersonalSubmission,
      requirementSubmissionMode: requiresPersonalSubmission
        ? "personal"
        : "online",
    });

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextData = getNextAttachmentData();
    const hasIncompleteOnlineRequirements =
      showAttachments && missingRequiredRequirementCount > 0;

    setSubmitConfirmation({
      kind: hasIncompleteOnlineRequirements ? "incomplete" : "complete",
      completedCount: completedRequirementCount,
      totalCount: requirements.length,
      missingCount: missingRequiredRequirementCount,
      nextData,
      showUploadSummary: showAttachments,
    });
  };

  const handleConfirmSubmit = () => {
    const nextData = submitConfirmation?.nextData || getNextAttachmentData();
    setSubmitConfirmation(null);
    onNext?.(nextData);
    onSave?.(nextData);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h2 className="oas-panel-title">
          Required Documents
        </h2>
        <p className="text-sm text-slate-500">
          {isVacancyLocked
            ? "Upload the documents needed for your selected vacancy."
            : "Select a position to show the required documents."}
        </p>

        {isVacancyLocked ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Selected Vacancy
                </p>
                <h3 className="mt-1 break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
                  {positionType}
                </h3>
              </div>

              <span className="w-fit rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-800">
                {positionCategory || "Position category unavailable"}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="applicant-position-category"
              className="mb-1 block text-sm font-medium text-slate-600"
            >
              Position Applied For
            </label>
            <select
              id="applicant-position-category"
              value={positionCategory}
              disabled={disabled}
              onChange={(event) => handleCategoryChange(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">Select position type</option>
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
            </select>
          </div>

          {showPositionList && (
            <div>
              <label
                htmlFor="applicant-position-type"
                className="mb-1 block text-sm font-medium text-slate-600"
              >
                {positionCategory === "Teaching"
                  ? "Teaching Position"
                  : "Non-Teaching Position"}
              </label>
              <select
                id="applicant-position-type"
                value={positionType}
                disabled={disabled}
                onChange={(event) => handlePositionChange(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">
                  {positionCategory === "Teaching"
                    ? "Select teaching position"
                    : "Select non-teaching position"}
                </option>
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
          )}
          </div>
        )}

        {requiresPersonalSubmission && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-bold">{submissionRule.notice?.title}</p>
              <p className="mt-1">
                Applicants must submit the required documents in person to the Division Office.
              </p>
            </div>
            {requirements.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Required Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These documents must be submitted in person to the Division Office.
                </p>
                <ul className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
                  {requirements.map((requirement) => (
                    <li
                      key={requirement.field || requirement.label}
                      className="border-b border-slate-200 pb-2.5 last:border-b-0 last:pb-0"
                    >
                      <p className="min-w-0 break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                        {requirement.label}
                      </p>
                      {requirement.description && (
                        <p className="mt-1 break-words text-xs leading-5 text-slate-500 [overflow-wrap:anywhere]">
                          {requirement.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No physical requirements are configured for this vacancy.
              </p>
            )}
          </div>
        )}

      {showAttachments && (
        <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Upload Progress
              </p>
              <p className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">
                {completedRequirementCount} of {requirements.length}
              </p>
              <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                document types have files
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 sm:mt-3">
                <div
                  className="h-full rounded-full bg-[#0056b3]"
                  style={{ width: `${requirementProgressPercent}%` }}
                />
              </div>
            </div>

            <label
              htmlFor="requirement-category-select"
              className="mt-4 block text-sm font-semibold text-slate-700"
            >
              Choose document type
            </label>
            <select
              id="requirement-category-select"
              value={selectedRequirement?.field || ""}
              onChange={(event) =>
                setSelectedRequirementField(event.target.value)
              }
              disabled={disabled}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {requirementProgress.map((requirement) => (
                <option key={requirement.field} value={requirement.field}>
                  {requirement.label} ({requirement.count}/
                  {maxRequirementFilesPerField})
                </option>
              ))}
            </select>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-900">
                  Still needed
                </p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {missingRequiredRequirementCount}
                </span>
              </div>

              {missingRequiredRequirementProgress.length > 0 ? (
                <>
                <p className="mt-2 text-xs font-medium text-slate-500 sm:hidden">
                  Required document types without files.
                </p>
                <div className="mt-3 hidden max-h-40 space-y-2 overflow-y-auto pr-1 sm:block">
                  {missingRequiredRequirementProgress.map((requirement) => (
                    <button
                      key={requirement.field}
                      type="button"
                      onClick={() =>
                        setSelectedRequirementField(requirement.field)
                      }
                      className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="min-w-0 break-words font-semibold [overflow-wrap:anywhere]">
                        {requirement.label}
                      </span>
                    </button>
                  ))}
                </div>
                </>
              ) : (
                <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  All required document types have files.
                </p>
              )}
            </div>
          </div>

          {selectedRequirement && (
            <FileUpload
              key={selectedRequirement.field}
              label={selectedRequirement.label}
              description={selectedRequirement.description}
              field={selectedRequirement.field}
              files={selectedRequirementProgress?.files || []}
              disabled={disabled}
              uploading={Boolean(uploadingFields[selectedRequirement.field])}
              onFileChange={handleFileChange}
              onRemoveFile={handleRemoveFile}
              onPreviewFile={setPreviewFile}
            />
          )}
        </div>
      )}
      </div>

      {!requiresPersonalSubmission &&
        !isLoadingLibrary &&
        otherLibraryFiles.length > 0 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Other Saved Documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These files are still saved in your library, but their requirement
              field is not part of the fixed application requirement set.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {otherLibraryFiles.map((file) => (
              <div
                key={file.id}
                className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
                  {file.requirementLabel || file.requirementField || "Document"}
                </p>
                <p className="mt-1 break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                  {getRequirementFileName(file)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {file.previewUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewFile(file)}
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      View
                    </button>
                  )}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveFile(file.requirementField, file)
                      }
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoadingLibrary && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Loading application requirements...
        </div>
      )}

      {!isLoadingLibrary && !showAttachments && !requiresPersonalSubmission && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {isVacancyLocked
            ? "No online upload requirements are configured for this vacancy."
            : "Select a position above to show the required documents."}
        </div>
      )}

      {!disabled && (
        <StepFooter
          onBack={showBack ? () => onBack?.(getNextAttachmentData()) : null}
          onNextSubmit
          label={isSaving ? "Saving..." : submitLabel}
          disabled={isSaving}
        />
      )}
    </form>
    {previewFile && (
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    )}
    {submitConfirmation && (
      <RequirementSubmitConfirmationModal
        confirmation={submitConfirmation}
        isSaving={isSaving}
        onCancel={() => setSubmitConfirmation(null)}
        onConfirm={handleConfirmSubmit}
      />
    )}
    </>
  );
}

function FileUpload({
  label,
  description,
  field,
  files = [],
  disabled,
  uploading,
  onFileChange,
  onRemoveFile,
  onPreviewFile,
}) {
  const fileList = normalizeFileList(files);
  const hasFiles = fileList.length > 0;
  const fileCountText = `${fileList.length} ${
    fileList.length === 1 ? "file" : "files"
  } uploaded`;

  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 sm:block">
            Selected Document
          </p>
          <h3 className="break-words text-base font-bold text-slate-950 [overflow-wrap:anywhere] sm:mt-1 sm:text-xl">
            {label}
          </h3>
        </div>
        <span
          className={`w-fit shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs ${
            hasFiles
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {hasFiles ? fileCountText : "Needs files"}
        </span>
      </div>

      {description && (
        <div className="mt-3 max-h-20 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 sm:mt-4 sm:max-h-none sm:overflow-visible">
          <p className="break-words text-xs leading-5 text-slate-600 [overflow-wrap:anywhere] sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>
      )}

      {disabled ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {hasFiles ? (
            <ul className="space-y-2">
              {fileList.map((file) => (
                <li key={file.id || file.name}>
                  <p className="break-words font-medium [overflow-wrap:anywhere]">
                    {file.name || "Uploaded document"}
                  </p>
                  {(file.previewUrl || file.dataUrl) && (
                    <button
                      type="button"
                      onClick={() => onPreviewFile(file)}
                      className="mt-1 font-semibold text-blue-700 hover:underline"
                    >
                      View document
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="break-words [overflow-wrap:anywhere]">Not uploaded</p>
          )}
        </div>
      ) : (
        <>
          <input
            type="file"
            id={`profile-${field}`}
            accept={acceptedRequirementFileTypesText}
            className="hidden"
            disabled={uploading}
            multiple
            onChange={(e) => {
              onFileChange(field, e.target.files);
              e.target.value = "";
            }}
          />

          <label
            htmlFor={`profile-${field}`}
            className={`mt-3 flex min-h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-3 py-4 text-center transition hover:border-blue-300 hover:bg-blue-50/80 sm:mt-4 sm:min-h-28 sm:px-4 sm:py-5 ${
              uploading ? "cursor-wait opacity-70" : "cursor-pointer"
            }`}
          >
            {uploading ? (
              <span className="text-sm font-semibold text-blue-700">
                Uploading...
              </span>
            ) : !hasFiles ? (
              <>
                <span className="text-sm font-bold text-blue-900 sm:text-base">
                  Choose files
                </span>
                <span className="mt-1 text-xs text-blue-700 sm:text-sm">
                  Select documents from your device
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-blue-900 sm:text-base">
                  Add more files
                </span>
                <span className="mt-1 text-xs text-blue-700 sm:text-sm">
                  {fileCountText}
                </span>
              </>
            )}
          </label>

          <p className="mt-2 text-xs leading-5 text-slate-500 sm:mt-3 sm:text-sm sm:leading-6">
            Accepted: images, PDF, TXT, DOC, or DOCX. Max{" "}
            {maxRequirementUploadBatch} per upload, {maxRequirementFilesPerField} total.
          </p>

          {hasFiles && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:mt-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-900">
                Uploaded files
              </h4>
              <span className="text-xs font-semibold text-slate-500">
                {fileList.length}/{maxRequirementFilesPerField}
              </span>
            </div>

              <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1 text-sm sm:max-h-56">
                {fileList.map((file) => (
                  <li
                    key={file.id || file.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 sm:py-3"
                  >
                    <p className="break-words font-semibold text-slate-700 [overflow-wrap:anywhere]">
                      {file.name || "Uploaded document"}
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:mt-3 sm:flex-row sm:flex-wrap">
                      {(file.previewUrl || file.dataUrl) && (
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:w-auto"
                        >
                          View document
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onRemoveFile(field, file)}
                        disabled={uploading}
                        className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
          </div>
          )}
        </>
      )}
    </section>
  );
}

function RequirementSubmitConfirmationModal({
  confirmation,
  isSaving = false,
  onCancel,
  onConfirm,
}) {
  const isIncomplete = confirmation?.kind === "incomplete";
  const title = isIncomplete
    ? "Submit with incomplete documents?"
    : "Ready to submit?";
  const body = isIncomplete
    ? `You still have ${confirmation.missingCount} required document ${
        confirmation.missingCount === 1 ? "type" : "types"
      } without files. You can submit now, but please be sure this is what you want to send.`
    : "Please double-check your information and uploaded documents before submitting.";
  const confirmLabel = isIncomplete ? "Submit Anyway" : "Submit Application";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
        </div>

        {confirmation.showUploadSummary && (
          <div
            className={`mt-4 rounded-xl border p-3 ${
              isIncomplete
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold">Upload Progress</span>
              <span className="text-sm font-bold">
                {confirmation.completedCount}/{confirmation.totalCount}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/70">
              <div
                className={`h-full rounded-full ${
                  isIncomplete ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{
                  width: `${
                    confirmation.totalCount
                      ? Math.round(
                          (confirmation.completedCount /
                            confirmation.totalCount) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className={`${secondaryButtonClass} w-full sm:w-auto`}
          >
            Review Again
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            {isSaving ? "Submitting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function IncompleteFieldsModal({
  direction = "next",
  missingFields = [],
  onCancel,
  onConfirm,
}) {
  const isBack = direction === "back";
  const title = isBack ? "Go back with incomplete fields?" : "Continue with incomplete fields?";
  const confirmLabel = isBack ? "Go Back" : "Continue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The form can move on, but these required fields are still missing.
          </p>
        </div>

        <div className="mt-4 max-h-56 overflow-y-auto rounded-xl border border-amber-200 bg-amber-50 p-3">
          <ul className="space-y-2 text-sm font-medium text-amber-950">
            {missingFields.map((field) => (
              <li key={field} className="break-words [overflow-wrap:anywhere]">
                {field}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={`${secondaryButtonClass} w-full sm:w-auto`}
          >
            Stay
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`${primaryButtonClass} w-full sm:w-auto`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepFooter({
  onNextSubmit = false,
  onBack = null,
  label = "Next Step",
  disabled = false,
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-6 sm:flex-row sm:items-center sm:justify-end">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className={`${secondaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto`}
        >
          Back
        </button>
      )}
      <button
        type={onNextSubmit ? "submit" : "button"}
        disabled={disabled}
        className={`${primaryButtonClass} w-full sm:w-auto`}
      >
        {disabled && label === "Save Changes" ? "Saving..." : label}
      </button>
    </div>
  );
}

function InputBox({
  label,
  value,
  onChange,
  disabled,
  required = false,
  type = "text",
  inputMode,
  maxLength,
  placeholder,
  error,
}) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder || label}
        max={
          type === "date" ? new Date().toISOString().split("T")[0] : undefined
        }
        className={`h-11 w-full rounded-xl border bg-white px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      />

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  disabled,
  required = false,
  options = [],
  error,
}) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <select
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SmallInput({
  label = "",
  value,
  disabled,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}

      <input
        type={type}
        value={value || ""}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 placeholder-slate-400 outline-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
      />
    </div>
  );
}
