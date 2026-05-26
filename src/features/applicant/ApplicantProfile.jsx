"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../../components/ui/BackButton";
import { apiRequest } from "../../lib/api";
import FilePreviewModal from "../../components/ui/FilePreviewModal";
import { useToast } from "../../components/ui/toastContext";
import { getStoredUser, storeUser, useAuth } from "../auth/auth";

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
    requirements: [],
    requirementSignature: "",
    requirementsUpdatedAt: "",
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
  { id: 5, title: "ATTACHMENT", key: "jobPosition" },
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

function getRequirementSignature(requirements = []) {
  return JSON.stringify(
    normalizeRequirementList(requirements).map((requirement) => ({
      field: requirement.field,
      label: requirement.label,
      description: requirement.description,
      required: requirement.required !== false,
    }))
  );
}

function hasAnyRequirementFile(files = {}) {
  return Object.values(files || {}).some(Boolean);
}

function getActiveRequirementFields(job = {}) {
  if (!Array.isArray(job.activeRequirementFields)) return null;
  return new Set(job.activeRequirementFields.map((field) => String(field)));
}

function buildRequirementFiles(requirements = [], existingFiles = {}, activeFields = null) {
  return Object.fromEntries(
    normalizeRequirementList(requirements).map((requirement) => [
      requirement.field,
      activeFields && !activeFields.has(requirement.field)
        ? null
        : existingFiles?.[requirement.field] || null,
    ])
  );
}

function getMissingRequiredLabels(requirements = [], files = {}) {
  return normalizeRequirementList(requirements)
    .filter(
      (requirement) =>
        requirement.required !== false && !files?.[requirement.field]
    )
    .map((requirement) => requirement.label);
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

function normalizeProfileForSave(profile = {}) {
  const merged = mergeProfile(defaultProfile, profile || {});
  const applicationDetails = {
    ...(merged.applicationDetails || {}),
  };
  delete applicationDetails.completedAt;
  const jobRequirements = normalizeRequirementList(
    merged.jobPosition?.requirements || []
  );
  const hasJobOpening = Boolean(merged.jobPosition?.jobOpeningId);

  return {
    ...merged,
    applicationDetails,
    personalInfo: normalizePersonalInfo(merged.personalInfo),
    jobPosition: {
      ...merged.jobPosition,
      requirements: jobRequirements,
      requirementSignature: getRequirementSignature(jobRequirements),
      files: hasJobOpening
        ? buildRequirementFiles(jobRequirements, merged.jobPosition?.files || {})
        : {
            ...defaultFiles,
            ...(merged.jobPosition?.files || {}),
          },
    },
  };
}

function prepareJobPositionFromOpening(job = {}, existingJobPosition = {}) {
  const requirements = normalizeRequirementList(job.requirements || []);
  const activeFields = getActiveRequirementFields(job);
  const existingFiles = existingJobPosition?.files || {};
  const nextSignature = getRequirementSignature(requirements);
  const previousSignature = existingJobPosition?.requirementSignature || "";
  const isSamePosting =
    String(existingJobPosition?.jobOpeningId || "") === String(job.id || "");
  const signatureChanged =
    isSamePosting && previousSignature && previousSignature !== nextSignature;
  const archivedLabels =
    activeFields && isSamePosting
      ? requirements
          .filter(
            (requirement) =>
              existingFiles?.[requirement.field] &&
              !activeFields.has(requirement.field)
          )
          .map((requirement) => requirement.label)
      : [];
  const shouldClearExistingFiles = signatureChanged || archivedLabels.length > 0;
  const files = buildRequirementFiles(
    requirements,
    shouldClearExistingFiles ? {} : existingFiles,
    activeFields
  );

  return {
    jobPosition: {
      positionCategory: job.positionCategory || "",
      positionType: job.title || "",
      positionId: job.positionId || "",
      jobOpeningId: job.id || "",
      requirements,
      requirementSignature: nextSignature,
      requirementsUpdatedAt: job.updatedAt || job.createdAt || "",
      files,
    },
    requirementsChanged: shouldClearExistingFiles,
    archivedLabels,
    missingRequiredLabels: getMissingRequiredLabels(requirements, files),
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
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
const acceptedRequirementFileTypesText = acceptedRequirementFileTypes.join(",");

export default function ApplicantProfile({
  embedded = false,
  mode = "full",
  autoEdit = false,
}) {
  const { updateUser, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [currentStep, setCurrentStep] = useState(mode === "documents" ? 5 : 1);
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [personalErrors, setPersonalErrors] = useState({});
  const [requirementNotice, setRequirementNotice] = useState(null);
  const flatInformationLayout = embedded && mode === "information";
  const visibleSteps =
    mode === "information"
      ? steps.filter((step) => step.id < 5)
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
          const merged = mergeProfile(accountPrefill, parsed);
          if (isMounted) {
            setProfile(merged);
            setFormData(merged);
          }
          return;
        }

        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);

          const merged = {
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
          };

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
        setProfile(accountPrefill);
        setFormData(accountPrefill);
      }
    };

    const loadProfile = async () => {
      try {
        const result = await apiRequest("/api/applicant/profile");
        if (!isMounted) return;

        const profilePayload = result.profile || {};
        const serverData = profilePayload.data || {};
        const merged = mergeProfile(accountPrefill, {
          ...serverData,
          uan: profilePayload.uan,
        });
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
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const routeJobId = params.get("jobId");

    if (!routeJobId) return;

    let isMounted = true;

    apiRequest(`/api/job-openings/${routeJobId}`)
      .then((result) => {
        if (!isMounted || !result.job) return;

        setFormData((current) => {
          const previousJobPosition = current.jobPosition || {};
          const prepared = prepareJobPositionFromOpening(
            result.job,
            previousJobPosition
          );

          if (
            prepared.requirementsChanged &&
            hasAnyRequirementFile(previousJobPosition.files)
          ) {
            setRequirementNotice({
              jobTitle: result.job.title,
              archivedLabels: prepared.archivedLabels,
              missingRequiredLabels: prepared.missingRequiredLabels,
            });
          }

          return {
            ...current,
            jobPosition: prepared.jobPosition,
          };
        });
      })
      .catch((error) => {
        console.error("Failed to load selected job opening:", error);
      });

    return () => {
      isMounted = false;
    };
  }, [location.search]);

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

  const handleStepBack = () => {
    const activeStep = visibleSteps.some((step) => step.id === currentStep)
      ? currentStep
      : visibleSteps[0]?.id || 1;
    const currentIndex = visibleSteps.findIndex((step) => step.id === activeStep);

    if (currentIndex > 0) {
      setCurrentStep(visibleSteps[currentIndex - 1].id);
      return;
    }

    if (!embedded) {
      navigate(-1);
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
              />
            )}

            <div
              className={
                flatInformationLayout
                  ? "min-h-[540px] rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-8"
                  : "min-h-[540px] rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 md:p-10"
              }
            >
              {visibleSteps.findIndex((step) => step.id === activeStep) > 0 && (
                <BackButton
                  onClick={handleStepBack}
                  className="mb-4"
                  ariaLabel="Go back"
                />
              )}

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
                isSaving={isSaving}
                steps={visibleSteps}
                flatSections={flatInformationLayout}
                personalErrors={personalErrors}
                setPersonalErrors={setPersonalErrors}
              />
            </div>
          </div>
        </div>
      </div>

      {requirementNotice && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="break-words text-lg font-bold text-slate-950 [overflow-wrap:anywhere]">
              Upload requirements updated
            </h3>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
              HR/Admin updated the upload requirements for{" "}
              <span className="font-semibold text-slate-900">
                {requirementNotice.jobTitle}
              </span>
              . Previously uploaded files for this posting were archived. Please upload the current requirements before applying.
            </p>

            {requirementNotice.missingRequiredLabels?.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold uppercase text-amber-700">
                  Required now
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                  {requirementNotice.missingRequiredLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            )}

            {requirementNotice.archivedLabels?.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Archived uploads
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {requirementNotice.archivedLabels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setRequirementNotice(null)}
                className={primaryButtonClass}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
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
  isSaving,
  steps,
  flatSections = false,
  personalErrors = {},
  setPersonalErrors,
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  const nextStep = steps[currentIndex + 1]?.id;
  const footerLabel = nextStep ? "Next Step" : "Save Changes";
  const saveWithSection = (section, data) =>
    onSave?.({
      ...formData,
      [section]: data,
    });

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
            updateFormData("personalInfo", data);
            if (nextStep) {
              setCurrentStep(nextStep);
            } else {
              saveWithSection("personalInfo", data);
            }
          }}
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
            updateFormData("educationalBackground", data);
            if (nextStep) {
              setCurrentStep(nextStep);
            } else {
              saveWithSection("educationalBackground", data);
            }
          }}
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
            updateFormData("eligibility", data);
            if (nextStep) {
              setCurrentStep(nextStep);
            } else {
              saveWithSection("eligibility", data);
            }
          }}
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
            updateFormData("learningDevelopment", data);
            if (nextStep) {
              setCurrentStep(nextStep);
            } else {
              saveWithSection("learningDevelopment", data);
            }
          }}
          footerLabel={footerLabel}
        />
      );

    case 5:
      return (
        <Attachment
          data={formData.jobPosition}
          disabled={!isEditing}
          onChange={(data) => updateFormData("jobPosition", data)}
          onNext={(data) => updateFormData("jobPosition", data)}
          onSave={(data) => saveWithSection("jobPosition", data)}
          isSaving={isSaving}
        />
      );

    default:
      return null;
  }
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

function VerticalStepper({ steps, currentStep, setCurrentStep }) {
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

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                aria-label={step.title}
                title={step.title}
                className={`h-2 rounded-full transition ${
                  isActive
                    ? "bg-[#0056b3]"
                    : isDone
                    ? "bg-green-500"
                    : "bg-slate-200"
                }`}
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

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                    isActive
                      ? "bg-slate-50 shadow-sm ring-1 ring-slate-200"
                      : "hover:bg-slate-50"
                  }`}
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
        Click any step to preview or update that section.
      </div>
    </div>
    </>
  );
}

function mergeProfile(baseProfile, parsedProfile) {
  const parsedJobPosition = parsedProfile.jobPosition || {};
  const parsedRequirements = normalizeRequirementList(
    parsedJobPosition.requirements || []
  );
  const hasJobOpening = Boolean(parsedJobPosition.jobOpeningId);
  const requirementSignature =
    parsedJobPosition.requirementSignature ||
    getRequirementSignature(parsedRequirements);

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
      requirementSignature,
      files: hasJobOpening
        ? buildRequirementFiles(parsedRequirements, parsedJobPosition.files || {})
        : {
            ...defaultFiles,
            ...(parsedJobPosition.files || {}),
          },
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
  disabled = false,
  isSaving = false,
  validationErrors = {},
  onValidationErrorsChange,
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
    setPersonal({
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

  const handleNext = (e) => {
    e.preventDefault();

    if (!disabled && !validateForm()) return;

    onNext?.({
      ...personal,
      middleName: personal.noMiddleName ? "" : personal.middleName,
      nationalityInput: requiresNationalityDetail(personal.nationality)
        ? personal.nationalityInput
        : "",
      religionInput: personal.religion === "Others" ? personal.religionInput : "",
      ethnicGroup: personal.hasEthnicGroup ? personal.ethnicGroup : "",
      disability: personal.hasDisability ? personal.disability : "",
      soloParentIdNumber: personal.isSoloParent
        ? personal.soloParentIdNumber
        : "",
      pwdIdNumber: personal.isPwd ? personal.pwdIdNumber : "",
    });
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
          <InputBox
            label="Address"
            required
            value={personal.address}
            disabled={disabled}
            error={errors.address}
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

      <StepFooter onNextSubmit label={footerLabel} disabled={isSaving} />
    </form>
  );
}

/* ================= EDUCATION ================= */

function EducationalBackground({
  data,
  onChange,
  onNext,
  disabled = false,
  isSaving = false,
  flatSections = false,
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
    setEducation({
      bachelors: data?.bachelors || [
        { school: "", course: "", year: "", award: "" },
      ],
      postGraduate: data?.postGraduate || [
        { school: "", course: "", year: "", award: "" },
      ],
    });
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

      <StepFooter onNextSubmit label={footerLabel} disabled={isSaving} />
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
  disabled = false,
  isSaving = false,
  flatSections = false,
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
    setEligibility({
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

      <StepFooter onNextSubmit label={footerLabel} disabled={isSaving} />
    </form>
  );
}

/* ================= LEARNING DEVELOPMENT ================= */

function LearningDevelopment({
  data,
  onChange,
  onNext,
  disabled = false,
  isSaving = false,
  flatSections = false,
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
    setLearning({
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

      <StepFooter onNextSubmit label={footerLabel} disabled={isSaving} />
    </form>
  );
}

/* ================= ATTACHMENT ================= */

function Attachment({ data, onChange, onNext, onSave, isSaving, disabled = false }) {
  const { showToast } = useToast();
  const [adminPositions, setAdminPositions] = useState([]);
  const [libraryFiles, setLibraryFiles] = useState([]);
  const [isLoadingRequirementConfig, setIsLoadingRequirementConfig] =
    useState(true);

  const job = useMemo(() => {
    const requirements = normalizeRequirementList(data?.requirements || []);
    const hasJobOpening = Boolean(data?.jobOpeningId);

    return {
      positionCategory: data?.positionCategory || "",
      positionType: data?.positionType || "",
      positionId: data?.positionId || "",
      jobOpeningId: data?.jobOpeningId || "",
      requirements,
      requirementSignature:
        data?.requirementSignature || getRequirementSignature(requirements),
      requirementsUpdatedAt: data?.requirementsUpdatedAt || "",
      files: hasJobOpening
        ? buildRequirementFiles(requirements, data?.files || {})
        : {
            ...defaultFiles,
            ...(data?.files || {}),
          },
    };
  }, [data]);
  const [uploadingFields, setUploadingFields] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      apiRequest("/api/job-positions").catch(() => ({ positions: [] })),
      apiRequest("/api/applicant/requirement-files").catch(() => ({
        files: [],
      })),
    ])
      .then(([positionResult, fileResult]) => {
        if (!isMounted) return;

        setAdminPositions(positionResult.positions || []);
        setLibraryFiles(fileResult.files || []);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRequirementConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const sync = (updated) => {
    onChange?.(updated);
  };

  const positionCategories = useMemo(
    () =>
      Array.from(
        new Set(adminPositions.map((position) => position.category).filter(Boolean))
      ),
    [adminPositions]
  );
  const positionsForCategory = useMemo(
    () =>
      adminPositions.filter(
        (position) => position.category === job.positionCategory
      ),
    [adminPositions, job.positionCategory]
  );
  const selectedAdminPosition = useMemo(
    () =>
      adminPositions.find(
        (position) =>
          String(position.id) === String(job.positionId) ||
          (position.category === job.positionCategory &&
            position.title === job.positionType)
      ) || null,
    [adminPositions, job.positionCategory, job.positionId, job.positionType]
  );
  const libraryFileByField = useMemo(
    () =>
      Object.fromEntries(
        libraryFiles.map((file) => [file.requirementField, file])
      ),
    [libraryFiles]
  );

  const handleCategoryChange = (value) => {
    sync({
      ...job,
      positionCategory: value,
      positionType: "",
      positionId: "",
      jobOpeningId: "",
      requirements: [],
      requirementSignature: "",
      requirementsUpdatedAt: "",
      files: { ...defaultFiles },
    });
  };

  const handlePositionChange = (positionId) => {
    const position = adminPositions.find(
      (item) => String(item.id) === String(positionId)
    );
    const requirements = normalizeRequirementList(position?.requirements || []);

    sync({
      ...job,
      positionId: position?.id || "",
      positionType: position?.title || "",
      positionCategory: position?.category || job.positionCategory,
      jobOpeningId: "",
      requirements,
      requirementSignature: getRequirementSignature(requirements),
      requirementsUpdatedAt: "",
      files: buildRequirementFiles(requirements, job.files || {}),
    });
  };

  const handleFileChange = async (field, file) => {
    if (!file) return;
    if (file.size > uploadMaxFileSize) {
      showToast({
        type: "warning",
        message: "Please upload a file smaller than 15 MB.",
      });
      return;
    }

    if (!acceptedRequirementFileTypes.includes(file.type)) {
      showToast({
        type: "warning",
        message: "Upload images, PDFs, or common Office documents only.",
      });
      return;
    }

    const requirement = currentUploadRequirements.find(
      (item) => item.field === field
    );

    if (!requirement) {
      showToast({
        type: "warning",
        message: "Select a valid requirement before uploading.",
      });
      return;
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("requirementLabel", requirement?.label || field);

    setUploadingFields((current) => ({ ...current, [field]: true }));

    try {
      const result = await apiRequest(
        `/api/applicant/requirement-files/${encodeURIComponent(field)}`,
        {
          method: "POST",
          body: payload,
        }
      );

      const uploadedFile = result.file;
      setLibraryFiles((current) => [
        uploadedFile,
        ...current.filter(
          (item) => String(item.requirementField) !== String(field)
        ),
      ]);
      sync({
        ...job,
        files: {
          ...job.files,
          [field]: uploadedFile,
        },
      });

      showToast({ type: "success", message: "Requirement uploaded." });
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
    const currentFile = fileOverride || job.files?.[field];

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
    sync({
      ...job,
      files: {
        ...job.files,
        [field]: null,
      },
    });
    showToast({ type: "success", message: "Requirement removed." });
  };

  const showPositionList = Boolean(job.positionCategory);

  const hasSelectedUploadContext = Boolean(job.jobOpeningId || selectedAdminPosition);
  const customUploadRequirements = hasSelectedUploadContext
    ? job.jobOpeningId
      ? normalizeRequirementList(job.requirements)
      : normalizeRequirementList(selectedAdminPosition.requirements)
    : [];

  const showAttachments =
    hasSelectedUploadContext && customUploadRequirements.length > 0;
  const currentUploadRequirements = customUploadRequirements;
  const visibleRequirementFields = new Set(
    currentUploadRequirements.map((requirement) => requirement.field)
  );
  const otherLibraryFiles = hasSelectedUploadContext
    ? libraryFiles.filter(
        (file) => !visibleRequirementFields.has(file.requirementField)
      )
    : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(job);
    onSave?.(job);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">
            Position Applied For
          </label>

          <select
            value={job.positionCategory}
            disabled={disabled}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">Select position type</option>
            {positionCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {!isLoadingRequirementConfig && positionCategories.length === 0 && (
            <p className="mt-1 text-xs text-slate-500">
              No positions are configured by HR/Admin yet.
            </p>
          )}
        </div>

        {showPositionList && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Position
            </label>

          <select
              value={job.positionId || selectedAdminPosition?.id || ""}
              disabled={disabled}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">Select position</option>

              {positionsForCategory.map((position) => (
                <option key={position.id} value={position.id}>
                  {position.title}
                </option>
              ))}
            </select>
            {!isLoadingRequirementConfig && positionsForCategory.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                No positions found under this category.
              </p>
            )}
          </div>
        )}
      </div>

      {showAttachments && (
        <div className="space-y-4">
          <h2 className="oas-panel-title">
            Attachments / Requirements
          </h2>
          <p className="text-sm text-slate-500">
            {job.jobOpeningId
              ? "These are the current upload requirements configured by HR/Admin for this posting."
              : selectedAdminPosition
                ? "These reusable documents match the requirements HR/Admin configured for the selected position."
                : "These reusable documents come from the requirement fields HR/Admin configured for positions."}
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentUploadRequirements.map((requirement) => {
              return (
                <FileUpload
                  key={requirement.field}
                  label={requirement.label}
                  description={requirement.description}
                  field={requirement.field}
                  file={
                    job.files?.[requirement.field] ||
                    libraryFileByField[requirement.field]
                  }
                  disabled={disabled}
                  uploading={Boolean(uploadingFields[requirement.field])}
                  onFileChange={handleFileChange}
                  onRemoveFile={handleRemoveFile}
                  onPreviewFile={setPreviewFile}
                />
              );
            })}
          </div>
        </div>
      )}

      {!isLoadingRequirementConfig && otherLibraryFiles.length > 0 && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Other Saved Documents
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These files are still saved in your library, but their requirement
              field is not part of the currently selected HR/Admin requirement set.
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

      {isLoadingRequirementConfig && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Loading HR/Admin upload requirements...
        </div>
      )}

      {!isLoadingRequirementConfig && hasSelectedUploadContext && !showAttachments && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {job.jobOpeningId
            ? "No upload requirements are configured by HR/Admin for this job posting."
            : "No upload requirements are configured by HR/Admin yet."}
        </div>
      )}

      {!disabled && (
        <div className="flex items-center justify-end pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className={primaryButtonClass}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}
    </form>
    {previewFile && (
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    )}
    </>
  );
}

function FileUpload({
  label,
  description,
  field,
  file,
  disabled,
  uploading,
  onFileChange,
  onRemoveFile,
  onPreviewFile,
}) {
  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>

      {disabled ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="break-words [overflow-wrap:anywhere]">
            {file?.name || "Not uploaded"}
          </p>
          {(file?.previewUrl || file?.dataUrl) && (
            <button
              type="button"
              onClick={() => onPreviewFile(file)}
              className="mt-2 font-semibold text-blue-700 hover:underline"
            >
              View document
            </button>
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
            onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
          />

          <label
            htmlFor={`profile-${field}`}
            className={`flex h-24 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-400 hover:bg-slate-50 ${
              uploading ? "cursor-wait opacity-70" : "cursor-pointer"
            }`}
          >
            {uploading ? (
              <span className="text-sm font-semibold text-blue-700">
                Uploading...
              </span>
            ) : !file ? (
              <span className="text-sm text-slate-500">
                Upload document
              </span>
            ) : (
              <span className="px-2 text-center text-sm font-medium text-green-600">
                {file.name}
              </span>
            )}
          </label>

          {file && (
            <div className="flex flex-wrap gap-3 text-sm">
              {(file.previewUrl || file.dataUrl) && (
                <button
                  type="button"
                  onClick={() => onPreviewFile(file)}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  View document
                </button>
              )}

              <button
                type="button"
                onClick={() => onRemoveFile(field, file)}
                disabled={uploading}
                className="font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function StepFooter({
  onNextSubmit = false,
  label = "Next Step",
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-end pt-6">
      <button
        type={onNextSubmit ? "submit" : "button"}
        disabled={disabled}
        className={primaryButtonClass}
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
