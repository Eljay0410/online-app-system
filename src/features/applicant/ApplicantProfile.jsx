"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Copy,
  Edit3,
  Loader2,
  MailCheck,
  Printer,
  Save,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { getStoredUser, storeUser } from "../auth/auth";

const emptyText = "N/A";

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

const initialApplications = [
  {
    id: 1,
    position: "Teacher I",
    location: "No location",
    dateApplied: "May 11, 2026",
    status: "Application Submitted",
    isOpen: false,
  },
  {
    id: 2,
    position: "Administrative Aide",
    location: "No location",
    dateApplied: "May 11, 2026",
    status: "Application Submitted",
    isOpen: false,
  },
];

const steps = [
  { id: 1, title: "PERSONAL INFORMATION", key: "personalInfo" },
  { id: 2, title: "EDUCATIONAL BACKGROUND", key: "educationalBackground" },
  { id: 3, title: "ELIGIBILITY", key: "eligibility" },
  { id: 4, title: "LEARNING DEVELOPMENT", key: "learningDevelopment" },
  { id: 5, title: "ATTACHMENT", key: "jobPosition" },
  { id: 6, title: "REVIEW", key: "review" },
];

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [activeTab, setActiveTab] = useState("application");
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [applications, setApplications] = useState(initialApplications);

  useEffect(() => {
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

    try {
      const savedFullProfile = localStorage.getItem("applicantFullProfile");
      const savedProfile = localStorage.getItem("applicantProfile");

      if (savedFullProfile) {
        const parsed = JSON.parse(savedFullProfile);
        const merged = mergeProfile(accountPrefill, parsed);
        setProfile(merged);
        setFormData(merged);
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

        setProfile(merged);
        setFormData(merged);
        return;
      }
    } catch (error) {
      console.error("Failed to load applicant profile:", error);
    }

    setProfile(accountPrefill);
    setFormData(accountPrefill);
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

  const handleSave = () => {
    const finalProfile = {
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        soloParentIdNumber: formData.personalInfo.isSoloParent
          ? formData.personalInfo.soloParentIdNumber
          : "",
        pwdIdNumber: formData.personalInfo.isPwd
          ? formData.personalInfo.pwdIdNumber
          : "",
      },
      jobPosition: {
        ...formData.jobPosition,
        files: {
          ...defaultFiles,
          ...(formData.jobPosition.files || {}),
        },
      },
    };

    setProfile(finalProfile);
    localStorage.setItem("applicantFullProfile", JSON.stringify(finalProfile));

    localStorage.setItem(
      "applicantProfile",
      JSON.stringify({
        ...finalProfile.personalInfo,
        email: finalProfile.personalInfo.emailAddress,
        phone: finalProfile.personalInfo.contactNumber,
        birthDate: finalProfile.personalInfo.dob,
        applicantNumber: finalProfile.accountDetails.applicantNumber,
        accountStatus: finalProfile.accountDetails.accountStatus,
      })
    );

    const storedUser = getStoredUser?.();

    if (storedUser && storeUser) {
      storeUser({
        ...storedUser,
        firstName: finalProfile.personalInfo.firstName,
        lastName: finalProfile.personalInfo.lastName,
        email: finalProfile.personalInfo.emailAddress,
        profileComplete: true,
      });
    }

    setIsEditing(false);
  };

  const toggleApplicationDropdown = (applicationId) => {
    setApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId
          ? { ...application, isOpen: !application.isOpen }
          : { ...application, isOpen: false }
      )
    );
  };

  const withdrawApplication = (applicationId) => {
    setApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId
          ? {
              ...application,
              status: "Withdrawn",
              isOpen: false,
            }
          : application
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 px-4 pb-10 font-['Poppins']">
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

      <div className="max-w-6xl mx-auto">
        <Link
          to="/applicantdashboard"
          className="no-print inline-flex items-center text-xs font-semibold text-blue-700 hover:text-blue-900 mb-5"
        >
          ← Back to Dashboard
        </Link>

        <ProfileHeader
          initials={initials}
          fullName={fullName || "Raymond S Bautista"}
          status={profile.accountDetails.accountStatus}
          applicantNumber={profile.accountDetails.applicantNumber}
        />

        <div className="no-print mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-4 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("application")}
            className={`rounded-xl py-3 text-base font-semibold transition ${
              activeTab === "application"
                ? "bg-[#0056b3] text-white shadow-md"
                : "bg-transparent text-slate-700 hover:bg-slate-100"
            }`}
          >
            My Application
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("information")}
            className={`rounded-xl py-3 text-base font-semibold transition ${
              activeTab === "information"
                ? "bg-[#0056b3] text-white shadow-md"
                : "bg-transparent text-slate-700 hover:bg-slate-100"
            }`}
          >
            My Information
          </button>
        </div>

        {activeTab === "application" && (
          <ApplicationList
            applications={applications}
            toggleApplicationDropdown={toggleApplicationDropdown}
            withdrawApplication={withdrawApplication}
          />
        )}

        {activeTab === "information" && (
          <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-8">
            <div className="no-print mb-5 flex justify-end">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0056b3] px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Edit3 size={16} />
                  Update
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0056b3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Save size={16} />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
              <VerticalStepper
                steps={steps}
                currentStep={currentStep}
                setCurrentStep={setCurrentStep}
              />

              <div className="min-h-[540px] rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200 md:p-10">
                <h2 className="mb-8 text-2xl font-bold uppercase tracking-tight text-[#003a78] md:text-3xl">
                  {steps.find((s) => s.id === currentStep)?.title}
                </h2>

                <RenderStepContent
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  formData={formData}
                  updateFormData={updateFormData}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </div>
        )}
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
}) {
  switch (currentStep) {
    case 1:
      return (
        <PersonalInfo
          data={formData.personalInfo}
          disabled={!isEditing}
          onChange={(data) => updateFormData("personalInfo", data)}
          onNext={(data) => {
            updateFormData("personalInfo", data);
            setCurrentStep(2);
          }}
        />
      );

    case 2:
      return (
        <EducationalBackground
          data={formData.educationalBackground}
          disabled={!isEditing}
          onChange={(data) => updateFormData("educationalBackground", data)}
          onBack={() => setCurrentStep(1)}
          onNext={(data) => {
            updateFormData("educationalBackground", data);
            setCurrentStep(3);
          }}
        />
      );

    case 3:
      return (
        <Eligibility
          data={formData.eligibility}
          disabled={!isEditing}
          onChange={(data) => updateFormData("eligibility", data)}
          onBack={() => setCurrentStep(2)}
          onNext={(data) => {
            updateFormData("eligibility", data);
            setCurrentStep(4);
          }}
        />
      );

    case 4:
      return (
        <LearningDevelopment
          data={formData.learningDevelopment}
          disabled={!isEditing}
          onChange={(data) => updateFormData("learningDevelopment", data)}
          onBack={() => setCurrentStep(3)}
          onNext={(data) => {
            updateFormData("learningDevelopment", data);
            setCurrentStep(5);
          }}
        />
      );

    case 5:
      return (
        <Attachment
          data={formData.jobPosition}
          disabled={!isEditing}
          onChange={(data) => updateFormData("jobPosition", data)}
          onBack={() => setCurrentStep(4)}
          onNext={(data) => {
            updateFormData("jobPosition", data);
            setCurrentStep(6);
          }}
        />
      );

    case 6:
      return (
        <Review
          data={formData}
          onBack={() => setCurrentStep(5)}
          onSubmit={(applicationData) => {
            console.log("Application submitted:", applicationData);
          }}
        />
      );

    default:
      return null;
  }
}

function ProfileHeader({ initials, fullName, status, applicantNumber }) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="relative min-h-[150px] bg-gradient-to-r from-[#0056b3] via-[#0056b3] to-[#003a78] px-6 py-6 md:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />

        <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-white bg-blue-100 shadow-lg">
            <span className="text-xl font-extrabold text-blue-700">
              {initials}
            </span>
          </div>

          <div className="min-w-0 flex-1 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              Applicant Profile
            </p>

            <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">
              {fullName}
            </h1>

            <p className="mt-1 text-sm text-white/80">
              Profile and Application Form
            </p>
          </div>

          <div className="grid w-full max-w-sm gap-2 md:w-72">
            <div className="rounded-full bg-white/95 px-4 py-2 text-center text-xs font-bold text-green-700 shadow-sm">
              {status}
            </div>

            <div className="rounded-full bg-white/95 px-4 py-2 text-center text-xs font-bold text-blue-700 shadow-sm">
              {applicantNumber}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationList({
  applications,
  toggleApplicationDropdown,
  withdrawApplication,
}) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {applications.map((application) => (
          <div
            key={application.id}
            className="relative grid grid-cols-1 border-b border-slate-200 px-5 py-5 last:border-b-0 md:grid-cols-[1fr_280px]"
          >
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {application.position}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {application.location} • {application.dateApplied}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <p className="text-sm font-semibold text-slate-600">Status</p>

              <button
                type="button"
                onClick={() => toggleApplicationDropdown(application.id)}
                className="mt-1 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-left text-base font-semibold text-slate-700 hover:bg-slate-100"
              >
                {application.status}
                <ChevronDown size={18} />
              </button>

              {application.isOpen && (
                <div className="absolute right-5 top-24 z-20 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <button
                    type="button"
                    onClick={() => withdrawApplication(application.id)}
                    className="w-full px-4 py-3 text-left text-slate-700 hover:bg-slate-100"
                  >
                    Withdraw Application
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalStepper({ steps, currentStep, setCurrentStep }) {
  return (
    <div className="hidden lg:block">
      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
        <div className="relative">
          <div className="absolute bottom-6 left-5 top-6 w-px bg-slate-300" />

          <div className="space-y-4">
            {steps.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`relative flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-blue-200"
                      : "hover:bg-white"
                  }`}
                >
                  <span
                    className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                      isDone
                        ? "border-green-500 bg-green-500 text-white"
                        : isActive
                        ? "border-[#0056b3] bg-[#0056b3] text-white"
                        : "border-slate-300 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {isDone ? <CheckCircle2 size={20} /> : step.id}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-extrabold uppercase leading-snug ${
                        isActive
                          ? "text-[#003a78]"
                          : isDone
                          ? "text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>

                    <span
                      className={`mt-1 block text-xs ${
                        isActive ? "text-blue-600" : "text-slate-400"
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

      <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-xs font-medium leading-5 text-blue-800 ring-1 ring-blue-100">
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

function PersonalInfo({ data = {}, onChange, onNext, disabled = false }) {
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
      newErrors.contactNumber = "Contact number required";
    } else if (!/^09\d{9}$/.test(personal.contactNumber)) {
      newErrors.contactNumber = "Must start with 09 and be 11 digits";
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

        <div className="md:col-span-4 -mt-4">
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

      <StepFooter disabledBack onNextSubmit />
    </form>
  );
}

/* ================= EDUCATION ================= */

function EducationalBackground({
  data,
  onChange,
  onBack,
  onNext,
  disabled = false,
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

      <StepFooter onBack={onBack} onNextSubmit />
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>

      {rows.map((item, index) => (
        <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SmallInput
            placeholder="School"
            value={item.school}
            disabled={disabled}
            onChange={(e) =>
              onChange(listName, index, "school", e.target.value)
            }
          />

          <SmallInput
            placeholder="Course"
            value={item.course}
            disabled={disabled}
            onChange={(e) =>
              onChange(listName, index, "course", e.target.value)
            }
          />

          <SmallInput
            placeholder="Year"
            value={item.year}
            disabled={disabled}
            onChange={(e) =>
              onChange(listName, index, "year", e.target.value)
            }
          />

          <SmallInput
            placeholder="Award"
            value={item.award}
            disabled={disabled}
            onChange={(e) =>
              onChange(listName, index, "award", e.target.value)
            }
          />
        </div>
      ))}

      {!disabled && (
        <div className="flex gap-4">
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

function Eligibility({ data, onChange, onBack, onNext, disabled = false }) {
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
      <div className="space-y-4">
        {eligibility.eligibilities.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <SmallInput
              placeholder="Type"
              value={item.type}
              disabled={disabled}
              onChange={(e) =>
                updateList("eligibilities", index, "type", e.target.value)
              }
            />

            <SmallInput
              placeholder="Rating"
              value={item.rating}
              disabled={disabled}
              onChange={(e) =>
                updateList("eligibilities", index, "rating", e.target.value)
              }
            />

            <SmallInput
              type="date"
              value={item.examDate}
              disabled={disabled}
              onChange={(e) =>
                updateList("eligibilities", index, "examDate", e.target.value)
              }
            />

            <SmallInput
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
              type="date"
              value={item.validUntil}
              disabled={disabled}
              onChange={(e) =>
                updateList("eligibilities", index, "validUntil", e.target.value)
              }
            />
          </div>
        ))}

        {!disabled && (
          <div className="flex gap-4">
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

      <div className="space-y-4">
        <h2 className="text-xl font-bold uppercase text-blue-900">
          Work Experience
        </h2>

        {eligibility.workExperiences.map((item, index) => (
          <div key={index} className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <SmallInput
              placeholder="Position"
              value={item.position}
              disabled={disabled}
              onChange={(e) =>
                updateList("workExperiences", index, "position", e.target.value)
              }
            />

            <SmallInput
              placeholder="Agency"
              value={item.agency}
              disabled={disabled}
              onChange={(e) =>
                updateList("workExperiences", index, "agency", e.target.value)
              }
            />

            <SmallInput
              placeholder="Status"
              value={item.status}
              disabled={disabled}
              onChange={(e) =>
                updateList("workExperiences", index, "status", e.target.value)
              }
            />

            <SmallInput
              type="month"
              value={item.from || item.fromYear}
              disabled={disabled}
              onChange={(e) =>
                updateList("workExperiences", index, "from", e.target.value)
              }
            />

            <SmallInput
              placeholder="To / Present"
              value={item.toYear}
              disabled={disabled}
              onChange={(e) =>
                updateList("workExperiences", index, "toYear", e.target.value)
              }
            />
          </div>
        ))}

        {!disabled && (
          <div className="flex gap-4">
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

      <StepFooter onBack={onBack} onNextSubmit />
    </form>
  );
}

/* ================= LEARNING DEVELOPMENT ================= */

function LearningDevelopment({
  data,
  onChange,
  onBack,
  onNext,
  disabled = false,
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
      <div className="space-y-4">
        {learning.trainings.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_2fr_0.7fr_1.4fr]"
          >
            <SmallInput
              placeholder="Title"
              value={item.title}
              disabled={disabled}
              onChange={(e) => updateTraining(index, "title", e.target.value)}
            />

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

            <SmallInput
              type="number"
              placeholder="Hours"
              value={item.hours}
              disabled={disabled}
              onChange={(e) => updateTraining(index, "hours", e.target.value)}
            />

            <SmallInput
              placeholder="Conducted / Sponsored By"
              value={item.conductedBy}
              disabled={disabled}
              onChange={(e) =>
                updateTraining(index, "conductedBy", e.target.value)
              }
            />
          </div>
        ))}

        {!disabled && (
          <div className="flex gap-4">
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

      <StepFooter onBack={onBack} onNextSubmit />
    </form>
  );
}

/* ================= ATTACHMENT ================= */

function Attachment({ data, onChange, onBack, onNext, disabled = false }) {
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

    const safeFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    sync({
      ...job,
      files: {
        ...job.files,
        [field]: safeFile,
      },
    });
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
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-blue-800">
            If you are applying for Teacher I, you are required to personally
            submit the hard copies of your attachments to the Human Resource
            Office.
          </p>

          <ol className="list-decimal space-y-2 pl-5">
            <li>Unique Application Number generated after submission.</li>
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
          <h2 className="text-lg font-semibold text-slate-700">
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

      <StepFooter onBack={onBack} onNextSubmit />
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
            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-500 hover:bg-blue-50"
          >
            {!file ? (
              <span className="text-sm text-slate-500">
                Click to upload file
              </span>
            ) : (
              <span className="px-2 text-center text-sm font-medium text-green-600">
                Uploaded: {file.name}
              </span>
            )}
          </label>

          {file && (
            <button
              type="button"
              onClick={() => onRemoveFile(field)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Remove Attachment
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ================= REVIEW ================= */

function Review({ data, onBack, onSubmit }) {
  const [uan, setUan] = useState(data?.uan || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(Boolean(data?.uan));
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState("done");
  const [copyLabel, setCopyLabel] = useState("Copy");

  const personalInfo = data?.personalInfo || {};
  const education = data?.educationalBackground || {};
  const eligibility = data?.eligibility || {};
  const learningDevelopment = data?.learningDevelopment || {};
  const jobPosition = data?.jobPosition || {};

  const applicantName =
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
      personalInfo.suffix,
    ]
      .filter(Boolean)
      .join(" ") || emptyText;

  const uanDisplay = String(uan || "").toUpperCase();

  const submitApplication = async () => {
    if (isSubmitting || isLocked) return;

    setIsSubmitting(true);
    setModalStage("saving");
    setShowModal(true);

    setTimeout(() => {
      const generatedUan =
        uan ||
        `CSJDM-${new Date().getFullYear()}-${Date.now()
          .toString()
          .slice(-4)}`;

      setUan(generatedUan);
      setIsLocked(true);
      setModalStage("done");
      setIsSubmitting(false);

      onSubmit?.({
        ...data,
        uan: generatedUan,
      });
    }, 900);
  };

  const copyUan = async () => {
    if (!uan) return;

    try {
      await navigator.clipboard.writeText(uanDisplay);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1600);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy"), 1600);
    }
  };

  const renderList = (items, renderItem) =>
    items?.length ? (
      items.map(renderItem)
    ) : (
      <p className="text-sm text-slate-500">No entries provided.</p>
    );

  return (
    <div className="space-y-8">
      <div id="print-section">
        <div className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Application Receipt
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review your details carefully. Submitting will save the
              application, generate your UAN, and lock this form.
            </p>
          </div>

          {uan && (
            <div className="border-b border-slate-200 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-blue-50 px-3 py-2 text-center">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      UAN
                    </p>
                    <p className="mt-1 break-all text-lg font-bold tracking-widest text-blue-800">
                      {uanDisplay}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {applicantName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {jobPosition.positionType ||
                        jobPosition.positionCategory ||
                        ""}
                    </p>
                  </div>
                </div>

                <div className="no-print flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyUan}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                    {copyLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Print
                  </button>

                  <div className="hidden items-center gap-2 text-sm font-semibold text-blue-700 sm:inline-flex">
                    <ShieldCheck className="h-4 w-4" />
                    Locked
                  </div>
                </div>
              </div>
            </div>
          )}

          <ReviewSection title="Personal Information">
            <p>
              <strong>Name:</strong> {applicantName}
            </p>
            <p>
              <strong>Email:</strong> {personalInfo.emailAddress || emptyText}
            </p>
            <p>
              <strong>Contact Number:</strong>{" "}
              {personalInfo.contactNumber || emptyText}
            </p>
            <p>
              <strong>Date of Birth:</strong> {personalInfo.dob || emptyText}
            </p>
            <p>
              <strong>Address:</strong> {personalInfo.address || emptyText}
            </p>
            <p>
              <strong>Age:</strong> {personalInfo.age || emptyText}
            </p>
            <p>
              <strong>Sex:</strong> {personalInfo.sex || emptyText}
            </p>
            <p>
              <strong>Civil Status:</strong>{" "}
              {personalInfo.civilStatus || emptyText}
            </p>
            <p>
              <strong>Nationality:</strong>{" "}
              {personalInfo.nationalityInput ||
                personalInfo.nationality ||
                emptyText}
            </p>
            <p>
              <strong>Religion:</strong>{" "}
              {personalInfo.religionInput ||
                personalInfo.religion ||
                emptyText}
            </p>
            <p>
              <strong>Ethnic Group:</strong>{" "}
              {personalInfo.ethnicGroup || emptyText}
            </p>
            <p>
              <strong>Disability:</strong>{" "}
              {personalInfo.disability || emptyText}
            </p>
            <p>
              <strong>Solo Parent:</strong>{" "}
              {personalInfo.isSoloParent ? "Yes" : "No"}
            </p>
            <p>
              <strong>Solo Parent ID Number:</strong>{" "}
              {personalInfo.soloParentIdNumber || emptyText}
            </p>
            <p>
              <strong>PWD:</strong> {personalInfo.isPwd ? "Yes" : "No"}
            </p>
            <p>
              <strong>PWD ID Number:</strong>{" "}
              {personalInfo.pwdIdNumber || emptyText}
            </p>
          </ReviewSection>

          <ReviewSection title="Educational Background">
            <h3 className="text-sm font-semibold text-slate-800">
              Bachelor&apos;s Degree
            </h3>

            {renderList(education.bachelors, (item, index) => (
              <p key={index}>
                {item.school || emptyText} - {item.course || emptyText},{" "}
                {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </p>
            ))}

            <h3 className="pt-3 text-sm font-semibold text-slate-800">
              Post Graduate Degree
            </h3>

            {renderList(education.postGraduate, (item, index) => (
              <p key={index}>
                {item.school || emptyText} - {item.course || emptyText},{" "}
                {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </p>
            ))}
          </ReviewSection>

          <ReviewSection title="Eligibility">
            {renderList(eligibility.eligibilities, (item, index) => (
              <p key={index}>
                <strong>{item.type || emptyText}</strong> - Rating{" "}
                {item.rating || emptyText}, Exam {item.examDate || emptyText},
                License {item.licenseNumber || emptyText}
              </p>
            ))}

            <h3 className="pt-3 text-sm font-semibold text-slate-800">
              Work Experience
            </h3>

            {renderList(eligibility.workExperiences, (item, index) => (
              <p key={index}>
                <strong>{item.position || emptyText}</strong> -{" "}
                {item.agency || emptyText}, {item.status || emptyText},{" "}
                {item.from || item.fromYear || emptyText} to{" "}
                {item.toYear || emptyText}
              </p>
            ))}
          </ReviewSection>

          <ReviewSection title="Learning and Development">
            {renderList(learningDevelopment.trainings, (item, index) => (
              <p key={index}>
                <strong>{item.title || emptyText}</strong> -{" "}
                {item.fromDate || emptyText} to {item.toDate || emptyText},{" "}
                {item.hours || emptyText} hours,{" "}
                {item.conductedBy || emptyText}
              </p>
            ))}
          </ReviewSection>

          <ReviewSection title="Job Position and Attachments">
            <p>
              <strong>Position Applied For:</strong>{" "}
              {jobPosition.positionType ||
                jobPosition.positionCategory ||
                emptyText}
            </p>

            <p className="font-semibold text-slate-800">Attached Files:</p>

            <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              {Object.entries(jobPosition.files || {}).map(([key, file]) => (
                <li key={key}>
                  <strong>{key}:</strong> {file?.name || "Not uploaded"}
                </li>
              ))}
            </ul>
          </ReviewSection>

          <div className="border-t border-slate-200 pt-5 text-sm text-amber-800">
            <div className="flex gap-3 rounded-lg bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Once submitted, your application will be locked and can no
                longer be edited. Make sure all details are correct before
                proceeding.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <SubmitModal
          modalStage={modalStage}
          uanDisplay={uanDisplay}
          copyLabel={copyLabel}
          copyUan={copyUan}
          close={() => setShowModal(false)}
        />
      )}

      <div className="no-print flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLocked || isSubmitting}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-bold transition-all ${
            isLocked || isSubmitting
              ? "cursor-not-allowed border-gray-300 text-gray-400"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={submitApplication}
          disabled={isSubmitting || isLocked}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isLocked ? "Submitted" : "Submit"}
        </button>
      </div>
    </div>
  );
}

function SubmitModal({ modalStage, uanDisplay, copyLabel, copyUan, close }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {modalStage !== "saving" && (
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {modalStage === "saving" && (
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <Loader2 className="h-14 w-14 animate-spin text-blue-700" />
            <h3 className="mt-6 text-2xl font-extrabold text-slate-950">
              Submitting application
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Submitting your application and generating your UAN...
            </p>
          </div>
        )}

        {modalStage === "done" && (
          <div className="px-8 pb-10 pt-12 text-center sm:px-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.45)]">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <h3 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-950">
              Application submitted!
            </h3>

            <p className="mt-2 text-base font-medium text-slate-500">
              Your application has been saved successfully.
            </p>

            <div className="mt-6 rounded-md bg-blue-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase text-blue-700">
                UAN
              </p>
              <p className="break-all text-lg font-bold tracking-widest text-blue-800">
                {uanDisplay}
              </p>

              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={copyUan}
                  className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <Copy className="h-4 w-4" />
                  {copyLabel}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Print
                </button>
              </div>
            </div>

            <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <MailCheck className="h-4 w-4" />
              </div>
              <p className="leading-5">
                Activation instructions will be sent to your email address.
              </p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={close}
                className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */

function ReviewSection({ title, children }) {
  return (
    <section className="space-y-3 text-sm text-slate-700">
      <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
      <div className="border-b border-slate-300" />
      <div className="grid gap-2 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function StepFooter({ onBack, disabledBack = false, onNextSubmit = false }) {
  return (
    <div className="flex items-center justify-between pt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={disabledBack}
        className="rounded-xl border-2 border-slate-200 bg-white px-6 py-2 font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40"
      >
        Back
      </button>

      <button
        type={onNextSubmit ? "submit" : "button"}
        className="rounded-xl bg-[#0056b3] px-6 py-2 font-bold text-white transition hover:bg-[#003a78]"
      >
        Next Step
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
        placeholder={label}
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
  value,
  disabled,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <input
      type={type}
      value={value || ""}
      disabled={disabled}
      onChange={onChange}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 placeholder-slate-400 outline-none hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-600"
    />
  );
}