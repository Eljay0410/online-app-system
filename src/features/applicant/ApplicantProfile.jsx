"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/ui/BackButton";
import { apiRequest } from "../../lib/api";
import { getStoredUser, storeUser, useAuth } from "../auth/auth";

const defaultFiles = {
  letterOfIntent: null,
  pds: null,
  residency: null,
  prcLicense: null,
  boardRating: null,
  eligibilityRating: null,
  academicRecord: null,
  serviceRecord: null,
  employmentCertificate: null,
  latestAppointment: null,
  trainingCertificates: null,
  tesdaCertificate: null,
  performanceRating: null,
  cavDataPrivacy: null,
  otherDocuments: null,
};

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
  { id: 5, title: "ATTACHMENT", key: "jobPosition" },
];

const primaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200";

export default function ApplicantProfile({
  embedded = false,
  mode = "full",
  autoEdit = false,
}) {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [currentStep, setCurrentStep] = useState(mode === "documents" ? 5 : 1);
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [isSaving, setIsSaving] = useState(false);
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

        const serverData = result.profile?.data || {};
        const merged = mergeProfile(accountPrefill, serverData);
        setProfile(merged);
        setFormData(merged);

        localStorage.setItem("applicantFullProfile", JSON.stringify(merged));
      } catch (error) {
        hydrateFromStorage();
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const handleEdit = () => {
    setFormData(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleSave = async (profileOverride) => {
    if (isSaving) return;
    setIsSaving(true);
    const sourceProfile = profileOverride || formData;

    const completedAt = new Date().toISOString();
    const finalProfile = {
      ...sourceProfile,
      applicationDetails: {
        ...(sourceProfile.applicationDetails || {}),
        completedAt,
      },
      personalInfo: {
        ...sourceProfile.personalInfo,
        soloParentIdNumber: sourceProfile.personalInfo.isSoloParent
          ? sourceProfile.personalInfo.soloParentIdNumber
          : "",
        pwdIdNumber: sourceProfile.personalInfo.isPwd
          ? sourceProfile.personalInfo.pwdIdNumber
          : "",
      },
      jobPosition: {
        ...sourceProfile.jobPosition,
        files: {
          ...defaultFiles,
          ...(sourceProfile.jobPosition.files || {}),
        },
      },
    };

    try {
      const result = await apiRequest("/api/applicant/profile", {
        method: "PUT",
        body: JSON.stringify(finalProfile),
      });

      const savedData = result.profile?.data || finalProfile;
      const merged = mergeProfile(defaultProfile, savedData);

      setProfile(merged);
      setFormData(merged);

      localStorage.setItem("applicantFullProfile", JSON.stringify(merged));
      localStorage.setItem(
        "applicantProfile",
        JSON.stringify({
          ...merged.personalInfo,
          email: merged.personalInfo.emailAddress,
          phone: merged.personalInfo.contactNumber,
          birthDate: merged.personalInfo.dob,
          applicantNumber: merged.accountDetails.applicantNumber,
          accountStatus: merged.accountDetails.accountStatus,
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
      if (!autoEdit) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save applicant profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepBack = () => {
    const currentIndex = visibleSteps.findIndex((step) => step.id === currentStep);

    if (currentIndex > 0) {
      setCurrentStep(visibleSteps[currentIndex - 1].id);
      return;
    }

    if (!embedded) {
      navigate(-1);
    }
  };

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
          <>
            <ProfileHeader
              initials={initials}
              fullName={fullName || "Applicant"}
              status={profile.accountDetails.accountStatus}
              applicantNumber={profile.accountDetails.applicantNumber}
            />
          </>
        )}

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
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
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                />
              )}

              <div className="min-h-[540px] rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 md:p-10">
                {visibleSteps.findIndex((step) => step.id === currentStep) > 0 && (
                  <BackButton
                    onClick={handleStepBack}
                    className="mb-4"
                    ariaLabel="Go back"
                  />
                )}

                <h2 className="oas-page-title mb-8 uppercase text-[#003a78]">
                  {visibleSteps.find((s) => s.id === currentStep)?.title}
                </h2>

                <RenderStepContent
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  formData={formData}
                  updateFormData={updateFormData}
                  isEditing={isEditing}
                  onSave={handleSave}
                  isSaving={isSaving}
                  steps={visibleSteps}
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
  isSaving,
  steps,
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

function ProfileHeader({ initials, fullName, status, applicantNumber }) {
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
          </div>

          <div className="grid w-full max-w-sm gap-2 md:w-72">
            <div className="rounded-full bg-white/95 px-4 py-2 text-center text-xs font-bold text-green-700 shadow-sm">
              {status}
            </div>

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
  return (
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
  );
}

function mergeProfile(baseProfile, parsedProfile) {
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
      ...parsedProfile.jobPosition,
      files: {
        ...defaultFiles,
        ...(parsedProfile.jobPosition?.files || {}),
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
  footerLabel = "Next Step",
}) {
  const [errors, setErrors] = useState({});
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
    nationality: data.nationality || "",
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
      nationality: data.nationality || "",
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

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "isSoloParent" && errors.soloParentIdNumber) {
      setErrors((prev) => ({ ...prev, soloParentIdNumber: "" }));
    }

    if (field === "isPwd" && errors.pwdIdNumber) {
      setErrors((prev) => ({ ...prev, pwdIdNumber: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!personal.firstName.trim()) newErrors.firstName = "First name required";
    if (!personal.noMiddleName && !personal.middleName.trim()) {
      newErrors.middleName = "Middle name required";
    }
    if (!personal.lastName.trim()) newErrors.lastName = "Last name required";
    if (!personal.address.trim()) newErrors.address = "Address required";

    if (!personal.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required.";
    } else if (!/^09\d{9}$/.test(personal.contactNumber)) {
      newErrors.contactNumber =
        "Contact number must start with 09 and be 11 digits.";
    }

    if (!personal.emailAddress.trim()) {
      newErrors.emailAddress = "Email required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.emailAddress)) {
      newErrors.emailAddress = "Invalid email";
    }

    if (!personal.dob) newErrors.dob = "Date of birth required";
    if (!personal.sex) newErrors.sex = "Sex required";
    if (!personal.civilStatus) newErrors.civilStatus = "Civil status required";
    if (!personal.nationality) newErrors.nationality = "Nationality required";
    if (!personal.religion) newErrors.religion = "Religion required";

    if (personal.isSoloParent && !personal.soloParentIdNumber.trim()) {
      newErrors.soloParentIdNumber = "Solo Parent ID number required";
    }

    if (personal.isPwd && !personal.pwdIdNumber.trim()) {
      newErrors.pwdIdNumber = "PWD ID number required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!disabled && !validateForm()) return;

    onNext?.({
      ...personal,
      middleName: personal.noMiddleName ? "" : personal.middleName,
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
            options={["", "Filipino", "Dual Citizen", "Others"]}
            onChange={(value) => updateField("nationality", value)}
          />

          {(personal.nationality === "Dual Citizen" ||
            personal.nationality === "Others") && (
            <input
              value={personal.nationalityInput}
              disabled={disabled}
              onChange={(e) => updateField("nationalityInput", e.target.value)}
              placeholder="Specify nationality"
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
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
              className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
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
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
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

      <StepFooter onNextSubmit label={footerLabel} />
    </form>
  );
}

/* ================= EDUCATION ================= */

function EducationalBackground({
  data,
  onChange,
  onNext,
  disabled = false,
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
        onChange={handleChange}
        onAdd={() => addItem("bachelors")}
        onRemove={() => removeItem("bachelors")}
      />

      <EducationGroup
        title="Post Graduate Degree"
        rows={education.postGraduate}
        listName="postGraduate"
        disabled={disabled}
        onChange={handleChange}
        onAdd={() => addItem("postGraduate")}
        onRemove={() => removeItem("postGraduate")}
      />

      <StepFooter onNextSubmit label={footerLabel} />
    </form>
  );
}

function EducationGroup({
  title,
  rows,
  listName,
  disabled,
  onChange,
  onAdd,
  onRemove,
}) {
  return (
    <div className="oas-panel space-y-4 p-5">
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="oas-panel space-y-4 p-5">
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

      <div className="oas-panel space-y-4 p-5">
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

      <StepFooter onNextSubmit label={footerLabel} />
    </form>
  );
}

/* ================= LEARNING DEVELOPMENT ================= */

function LearningDevelopment({
  data,
  onChange,
  onNext,
  disabled = false,
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
      <div className="oas-panel space-y-4 p-5">
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

      <StepFooter onNextSubmit label={footerLabel} />
    </form>
  );
}

/* ================= ATTACHMENT ================= */

function Attachment({ data, onChange, onNext, onSave, isSaving, disabled = false }) {
  const teachingPositions = [
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

  const nonTeachingPositions = [
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

  const teacherPromotionPositions = [
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

  const teacherUploadRequirements = [
    { field: "letterOfIntent", label: "Letter of Intent" },
    { field: "pds", label: "Personal Data Sheet" },
    { field: "residency", label: "Proof of Residency" },
    { field: "prcLicense", label: "PRC License / ID" },
    { field: "boardRating", label: "Certificate of Board Rating" },
    { field: "academicRecord", label: "Academic Records" },
    { field: "serviceRecord", label: "Service Record / COE" },
    { field: "latestAppointment", label: "Latest Appointment" },
    { field: "trainingCertificates", label: "Training Certificates" },
    { field: "tesdaCertificate", label: "TESDA NC II / TMC" },
    { field: "performanceRating", label: "Performance Ratings" },
    { field: "cavDataPrivacy", label: "CAV / Omnibus / Data Privacy Form" },
    { field: "otherDocuments", label: "Other Supporting Documents" },
  ];

  const nonTeachingUploadRequirements = [
    { field: "letterOfIntent", label: "Letter of Intent" },
    { field: "pds", label: "Personal Data Sheet" },
    { field: "residency", label: "Proof of Residency" },
    { field: "prcLicense", label: "PRC License / ID" },
    { field: "eligibilityRating", label: "Certificate of Eligibility / Rating" },
    { field: "academicRecord", label: "Academic Records" },
    { field: "trainingCertificates", label: "Training Certificates" },
    { field: "employmentCertificate", label: "Employment / Service Record" },
    { field: "latestAppointment", label: "Latest Appointment" },
    { field: "performanceRating", label: "Performance Rating" },
    { field: "cavDataPrivacy", label: "CAV / Omnibus / Data Privacy Form" },
    { field: "otherDocuments", label: "Other Supporting Documents" },
  ];

  const [job, setJob] = useState({
    positionCategory: data?.positionCategory || "",
    positionType: data?.positionType || "",
    jobOpeningId: data?.jobOpeningId || "",
    files: {
      ...defaultFiles,
      ...(data?.files || {}),
    },
  });

  useEffect(() => {
    setJob({
      positionCategory: data?.positionCategory || "",
      positionType: data?.positionType || "",
      jobOpeningId: data?.jobOpeningId || "",
      files: {
        ...defaultFiles,
        ...(data?.files || {}),
      },
    });
  }, [data]);

  const sync = (updated) => {
    setJob(updated);
    onChange?.(updated);
  };

  const handleCategoryChange = (value) => {
    sync({
      ...job,
      positionCategory: value,
      positionType: "",
      files: { ...defaultFiles },
    });
  };

  const handlePositionChange = (value) => {
    sync({
      ...job,
      positionType: value,
      files: { ...defaultFiles },
    });
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("Please upload a file smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const safeFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        dataUrl: reader.result,
      };

      sync({
        ...job,
        files: {
          ...job.files,
          [field]: safeFile,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (field) => {
    sync({
      ...job,
      files: {
        ...job.files,
        [field]: null,
      },
    });
  };

  const showPositionList =
    job.positionCategory === "Teaching" ||
    job.positionCategory === "Non-Teaching";

  const showAttachments =
    job.positionCategory === "Non-Teaching"
      ? job.positionType !== ""
      : teacherPromotionPositions.includes(job.positionType);

  const currentUploadRequirements =
    job.positionCategory === "Non-Teaching"
      ? nonTeachingUploadRequirements
      : teacherUploadRequirements;

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext?.(job);
    onSave?.(job);
  };

  return (
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
            <option value="Teaching">Teaching</option>
            <option value="Non-Teaching">Non-Teaching</option>
          </select>
        </div>

        {showPositionList && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              {job.positionCategory === "Teaching"
                ? "Teaching Position"
                : "Non-Teaching Position"}
            </label>

            <select
              value={job.positionType}
              disabled={disabled}
              onChange={(e) => handlePositionChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">Select position</option>

              {(job.positionCategory === "Teaching"
                ? teachingPositions
                : nonTeachingPositions
              ).map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {job.positionType === "Teacher I" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-800">
            If you are applying for Teacher I, you are required to personally
            submit the hard copies of your attachments to the Human Resource
            Office.
          </p>

          <ol className="list-decimal space-y-2 pl-5">
            <li>Unique Application Number (UAN) from your profile.</li>
            <li>Letter of intent addressed to the SDS.</li>
            <li>Fully accomplished Personal Data Sheet.</li>
            <li>Photocopy of Voter&apos;s ID and/or proof of residency.</li>
            <li>Photocopy of valid and updated PRC License/ID.</li>
            <li>Photocopy of Certificate of Board Rating.</li>
            <li>Photocopy of TOR and Diploma.</li>
            <li>Service Record or Certificate of Employment.</li>
            <li>Latest appointment, if applicable.</li>
            <li>Relevant trainings, if any.</li>
            <li>TESDA NC II or TMC, if applicable.</li>
            <li>Required Performance Ratings.</li>
            <li>Checklist, Omnibus, CAV, and Data Privacy Consent.</li>
            <li>Other HRMPSB requirements.</li>
          </ol>
        </div>
      )}

      {showAttachments && (
        <div className="space-y-4">
          <h2 className="oas-panel-title">
            Attachments / Requirements
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentUploadRequirements.map((requirement) => (
              <FileUpload
                key={requirement.field}
                label={requirement.label}
                field={requirement.field}
                file={job.files?.[requirement.field]}
                disabled={disabled}
                onFileChange={handleFileChange}
                onRemoveFile={handleRemoveFile}
              />
            ))}
          </div>
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
  );
}

function FileUpload({
  label,
  field,
  file,
  disabled,
  onFileChange,
  onRemoveFile,
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>

      {disabled ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {file?.name || "Not uploaded"}
        </div>
      ) : (
        <>
          <input
            type="file"
            id={`profile-${field}`}
            className="hidden"
            onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
          />

          <label
            htmlFor={`profile-${field}`}
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {!file ? (
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
              {file.dataUrl && (
                <a
                  href={file.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  View document
                </a>
              )}

              <button
                type="button"
                onClick={() => onRemoveFile(field)}
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

function StepFooter({ onNextSubmit = false, label = "Next Step" }) {
  return (
    <div className="flex items-center justify-end pt-6">
      <button
        type={onNextSubmit ? "submit" : "button"}
        className={primaryButtonClass}
      >
        {label}
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
