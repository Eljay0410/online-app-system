"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  Save,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
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

const defaultApplicationProfile = {
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
    applicantNumber: "Not yet generated",
    accountStatus: "Active",
  },
};

const suffixOptions = [
  "Jr.",
  "Sr.",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];

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
  {
    field: "letterOfIntent",
    label: "Letter of Intent",
    description:
      "Addressed to the SDS with purpose and learning area/subject group, if applicable.",
  },
  {
    field: "pds",
    label: "Personal Data Sheet",
    description:
      "PDS with Work Experience Sheet and recent picture, digitally/electronically signed.",
  },
  {
    field: "residency",
    label: "Proof of Residency",
    description: "Voter's ID or any proof of residency.",
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC License or ID.",
  },
  {
    field: "boardRating",
    label: "Certificate of Board Rating",
    description: "Upload your Certificate of Board Rating.",
  },
  {
    field: "academicRecord",
    label: "Academic Records",
    description:
      "TOR, diploma, graduate or post-graduate units/degrees, if available.",
  },
  {
    field: "serviceRecord",
    label: "Service Record / COE",
    description: "Duly signed Service Record or Certificate of Employment.",
  },
  {
    field: "latestAppointment",
    label: "Latest Appointment",
    description: "For applicants applying for promotion.",
  },
  {
    field: "trainingCertificates",
    label: "Training Certificates",
    description:
      "Relevant specialized trainings or professional development programs, if any.",
  },
  {
    field: "tesdaCertificate",
    label: "TESDA NC II / TMC",
    description:
      "TESDA National Certificate II or Trainers Methodology Certificate, if applicable.",
  },
  {
    field: "performanceRating",
    label: "Performance Ratings",
    description: "Required ratings with at least Very Satisfactory rating.",
  },
  {
    field: "cavDataPrivacy",
    label: "CAV / Omnibus / Data Privacy Form",
    description:
      "Checklist, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form.",
  },
  {
    field: "otherDocuments",
    label: "Other Supporting Documents",
    description:
      "Other HRMPSB requirements, including PPST portfolio, if applicable.",
  },
];

const nonTeachingUploadRequirements = [
  {
    field: "letterOfIntent",
    label: "Letter of Intent",
    description: "Addressed to the SDS with purpose and position applied for.",
  },
  {
    field: "pds",
    label: "Personal Data Sheet",
    description: "PDS with Work Experience Sheet and recent picture.",
  },
  {
    field: "residency",
    label: "Proof of Residency",
    description: "Voter's ID or any proof of residency.",
  },
  {
    field: "prcLicense",
    label: "PRC License / ID",
    description: "Valid and updated PRC License or ID, if applicable.",
  },
  {
    field: "eligibilityRating",
    label: "Certificate of Eligibility / Rating",
    description: "Eligibility or rating certificate, if applicable.",
  },
  {
    field: "academicRecord",
    label: "Academic Records",
    description:
      "TOR, diploma, graduate or post-graduate units/degrees, if available.",
  },
  {
    field: "trainingCertificates",
    label: "Training Certificates",
    description: "Relevant certificates of training, if applicable.",
  },
  {
    field: "employmentCertificate",
    label: "Employment / Service Record",
    description: "COE, contract of service, or signed service record.",
  },
  {
    field: "latestAppointment",
    label: "Latest Appointment",
    description: "Photocopy of latest appointment, if applicable.",
  },
  {
    field: "performanceRating",
    label: "Performance Rating",
    description: "Rating for the required/latest rating period, if applicable.",
  },
  {
    field: "cavDataPrivacy",
    label: "CAV / Omnibus / Data Privacy Form",
    description: "Notarized certification and Data Privacy Consent Form.",
  },
  {
    field: "otherDocuments",
    label: "Other Supporting Documents",
    description: "MOVs and other documents required for assessment.",
  },
];

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(defaultApplicationProfile);
  const [formData, setFormData] = useState(defaultApplicationProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");

  const scrollContainerRef = useRef(null);
  const sectionChangeLockRef = useRef(false);

  const sections = [
    {
      id: "personal",
      label: "Personal Info",
      description: "Basic applicant details",
      icon: <User size={18} />,
    },
    {
      id: "education",
      label: "Education",
      description: "Degree and school records",
      icon: <GraduationCap size={18} />,
    },
    {
      id: "eligibility",
      label: "Eligibility",
      description: "Licenses and work experience",
      icon: <IdCard size={18} />,
    },
    {
      id: "learning",
      label: "Learning Dev.",
      description: "Trainings and seminars",
      icon: <CalendarDays size={18} />,
    },
    {
      id: "job",
      label: "Job Position",
      description: "Position and attachments",
      icon: <Briefcase size={18} />,
    },
    {
      id: "review",
      label: "Review & Print",
      description: "Preview application form",
      icon: <Eye size={18} />,
    },
  ];

  useEffect(() => {
    const storedUser = getStoredUser();

    const accountPrefill = {
      ...defaultApplicationProfile,
      personalInfo: {
        ...defaultApplicationProfile.personalInfo,
        firstName: storedUser?.firstName || "",
        lastName: storedUser?.lastName || "",
        emailAddress: storedUser?.email || "",
      },
      jobPosition: {
        ...defaultApplicationProfile.jobPosition,
        files: {
          ...defaultFiles,
        },
      },
    };

    try {
      const savedFullProfile = localStorage.getItem("applicantFullProfile");
      const savedOldProfile = localStorage.getItem("applicantProfile");

      if (savedFullProfile) {
        const parsedProfile = JSON.parse(savedFullProfile);

        const mergedProfile = {
          ...accountPrefill,
          ...parsedProfile,
          personalInfo: {
            ...accountPrefill.personalInfo,
            ...parsedProfile.personalInfo,
          },
          educationalBackground: {
            ...accountPrefill.educationalBackground,
            ...parsedProfile.educationalBackground,
          },
          eligibility: {
            ...accountPrefill.eligibility,
            ...parsedProfile.eligibility,
          },
          learningDevelopment: {
            ...accountPrefill.learningDevelopment,
            ...parsedProfile.learningDevelopment,
          },
          jobPosition: {
            ...accountPrefill.jobPosition,
            ...parsedProfile.jobPosition,
            files: {
              ...defaultFiles,
              ...(parsedProfile.jobPosition?.files || {}),
            },
          },
          accountDetails: {
            ...accountPrefill.accountDetails,
            ...parsedProfile.accountDetails,
          },
        };

        setProfile(mergedProfile);
        setFormData(mergedProfile);
        return;
      }

      if (savedOldProfile) {
        const parsedOldProfile = JSON.parse(savedOldProfile);

        const mergedProfile = {
          ...accountPrefill,
          personalInfo: {
            ...accountPrefill.personalInfo,
            ...parsedOldProfile,
            contactNumber:
              parsedOldProfile.contactNumber || parsedOldProfile.phone || "",
            emailAddress:
              parsedOldProfile.emailAddress || parsedOldProfile.email || "",
            dob: parsedOldProfile.dob || parsedOldProfile.birthDate || "",
          },
          accountDetails: {
            ...accountPrefill.accountDetails,
            applicantNumber:
              parsedOldProfile.applicantNumber || "Not yet generated",
            accountStatus: parsedOldProfile.accountStatus || "Active",
          },
        };

        setProfile(mergedProfile);
        setFormData(mergedProfile);
        return;
      }
    } catch (error) {
      console.error("Failed to load applicant profile:", error);
    }

    setProfile(accountPrefill);
    setFormData(accountPrefill);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [activeSection]);

  const currentData = isEditing ? formData : profile;
  const personalInfo = currentData.personalInfo;
  const accountDetails = currentData.accountDetails;

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

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
    const firstInitial = profile.personalInfo.firstName?.charAt(0) || "A";
    const lastInitial = profile.personalInfo.lastName?.charAt(0) || "P";

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [profile]);

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.personalInfo.firstName,
      profile.personalInfo.lastName,
      profile.personalInfo.address,
      profile.personalInfo.contactNumber,
      profile.personalInfo.emailAddress,
      profile.personalInfo.dob,
      profile.personalInfo.sex,
      profile.personalInfo.civilStatus,
      profile.personalInfo.nationality,
      profile.personalInfo.religion,
      profile.educationalBackground.bachelors?.[0]?.school,
      profile.educationalBackground.bachelors?.[0]?.course,
      profile.eligibility.eligibilities?.[0]?.type,
      profile.learningDevelopment.trainings?.[0]?.title,
      profile.jobPosition.positionCategory,
      profile.jobPosition.positionType,
    ];

    const filled = fields.filter(Boolean).length;

    return Math.round((filled / fields.length) * 100);
  }, [profile]);

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

  const changeSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  const goToNextSection = () => {
    const currentIndex = sections.findIndex(
      (section) => section.id === activeSection
    );

    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
    }
  };

  const goToPreviousSection = () => {
    const currentIndex = sections.findIndex(
      (section) => section.id === activeSection
    );

    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
    }
  };

  const handleFormScrollNavigation = (e) => {
    const container = scrollContainerRef.current;

    if (!container || sectionChangeLockRef.current) return;

    const threshold = 12;
    const isScrollingDown = e.deltaY > 0;
    const isScrollingUp = e.deltaY < 0;

    const reachedBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;

    const reachedTop = container.scrollTop <= threshold;

    const currentIndex = sections.findIndex(
      (section) => section.id === activeSection
    );

    if (isScrollingDown && reachedBottom && currentIndex < sections.length - 1) {
      e.preventDefault();
      sectionChangeLockRef.current = true;
      goToNextSection();

      setTimeout(() => {
        sectionChangeLockRef.current = false;
      }, 650);

      return;
    }

    if (isScrollingUp && reachedTop && currentIndex > 0) {
      e.preventDefault();
      sectionChangeLockRef.current = true;
      goToPreviousSection();

      setTimeout(() => {
        sectionChangeLockRef.current = false;
      }, 650);
    }
  };

  const updatePersonalInfo = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value,
      },
    }));
  };

  const handlePersonalChange = (e) => {
    const { name, value, checked, type } = e.target;

    if (name === "dob") {
      updatePersonalInfo("dob", value);
      updatePersonalInfo("age", calculateAge(value));
      return;
    }

    if (name === "contactNumber") {
      updatePersonalInfo(
        "contactNumber",
        value.replace(/\D/g, "").slice(0, 11)
      );
      return;
    }

    if (name === "noMiddleName") {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          noMiddleName: checked,
          middleName: checked ? "" : prev.personalInfo.middleName,
        },
      }));
      return;
    }

    if (name === "hasEthnicGroup") {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          hasEthnicGroup: checked,
          ethnicGroup: checked ? prev.personalInfo.ethnicGroup : "",
        },
      }));
      return;
    }

    if (name === "hasDisability") {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          hasDisability: checked,
          disability: checked ? prev.personalInfo.disability : "",
        },
      }));
      return;
    }

    updatePersonalInfo(name, type === "checkbox" ? checked : value);
  };

  const updateArrayField = (section, listName, index, field, value) => {
    setFormData((prev) => {
      const updatedList = [...prev[section][listName]];

      updatedList[index] = {
        ...updatedList[index],
        [field]: value,
      };

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [listName]: updatedList,
        },
      };
    });
  };

  const addRow = (section, listName, emptyRow) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [listName]: [...prev[section][listName], emptyRow],
      },
    }));
  };

  const removeRow = (section, listName) => {
    setFormData((prev) => {
      if (prev[section][listName].length <= 1) return prev;

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [listName]: prev[section][listName].slice(0, -1),
        },
      };
    });
  };

  const handleJobPositionChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      jobPosition: {
        ...prev.jobPosition,
        [name]: value,
        ...(name === "positionCategory" ? { positionType: "" } : {}),
        files: {
          ...defaultFiles,
          ...(prev.jobPosition.files || {}),
        },
      },
    }));
  };

  const handleFileChange = (field, file) => {
    if (!file) return;

    const safeFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };

    setFormData((prev) => ({
      ...prev,
      jobPosition: {
        ...prev.jobPosition,
        files: {
          ...defaultFiles,
          ...(prev.jobPosition.files || {}),
          [field]: safeFile,
        },
      },
    }));
  };

  const handleRemoveFile = (field) => {
    setFormData((prev) => ({
      ...prev,
      jobPosition: {
        ...prev.jobPosition,
        files: {
          ...defaultFiles,
          ...(prev.jobPosition.files || {}),
          [field]: null,
        },
      },
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

  const handleSave = (e) => {
    e.preventDefault();

    const finalProfile = {
      ...formData,
      personalInfo: {
        ...formData.personalInfo,
        age: calculateAge(formData.personalInfo.dob),
        middleName: formData.personalInfo.noMiddleName
          ? ""
          : formData.personalInfo.middleName,
        nationalityInput:
          formData.personalInfo.nationality === "Dual Citizen" ||
          formData.personalInfo.nationality === "Others"
            ? formData.personalInfo.nationalityInput
            : "",
        religionInput:
          formData.personalInfo.religion === "Others"
            ? formData.personalInfo.religionInput
            : "",
        ethnicGroup: formData.personalInfo.hasEthnicGroup
          ? formData.personalInfo.ethnicGroup
          : "",
        disability: formData.personalInfo.hasDisability
          ? formData.personalInfo.disability
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

    const storedUser = getStoredUser();

    if (storedUser) {
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

  const handlePrintApplication = () => {
    setActiveSection("review");

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const showAttachments =
    currentData.jobPosition.positionCategory === "Non-Teaching"
      ? currentData.jobPosition.positionType !== ""
      : teacherPromotionPositions.includes(currentData.jobPosition.positionType);

  const currentUploadRequirements =
    currentData.jobPosition.positionCategory === "Non-Teaching"
      ? nonTeachingUploadRequirements
      : teacherUploadRequirements;

  const uploadedCount = Object.values(currentData.jobPosition.files || {}).filter(
    Boolean
  ).length;

  const currentSection = sections.find((section) => section.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8 pb-10">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #application-print-section,
            #application-print-section * {
              visibility: visible;
            }

            #application-print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              color: black;
              background: white;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="max-w-7xl mx-auto space-y-6 no-print">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/applicantdashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm">
            <CheckCircle2 size={16} className="text-green-600" />
            Profile completion:{" "}
            <span className="font-bold text-slate-900">
              {profileCompletion}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <aside className="space-y-6 lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="h-28 bg-gradient-to-r from-[#0056b3] to-[#003a78]" />

              <div className="px-6 pb-6 -mt-12 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-2xl font-bold text-blue-800">
                      {initials}
                    </span>
                  </div>
                </div>

                <h1 className="mt-4 text-xl font-bold text-slate-900">
                  {fullName || "Applicant Profile"}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Profile and Application Form
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <span className="inline-flex items-center justify-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                    <ShieldCheck size={14} />
                    {accountDetails.accountStatus}
                  </span>

                  <span className="inline-flex items-center justify-center gap-1 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                    <IdCard size={14} />
                    {accountDetails.applicantNumber}
                  </span>
                </div>

                <div className="mt-5">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      <Edit3 size={18} />
                      Edit Application
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-slate-700 font-semibold hover:bg-slate-200 transition"
                      >
                        <X size={17} />
                        Cancel
                      </button>

                      <button
                        type="submit"
                        form="profileForm"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition"
                      >
                        <Save size={17} />
                        Save
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-blue-900 mb-4">
                Quick Summary
              </h2>

              <div className="space-y-4">
                <InfoItem
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={personalInfo.emailAddress}
                />

                <InfoItem
                  icon={<Phone size={18} />}
                  label="Contact Number"
                  value={personalInfo.contactNumber}
                />

                <InfoItem
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={personalInfo.address}
                />

                <InfoItem
                  icon={<Briefcase size={18} />}
                  label="Position"
                  value={currentData.jobPosition.positionType}
                />

                <InfoItem
                  icon={<FileText size={18} />}
                  label="Uploaded Attachments"
                  value={`${uploadedCount} file(s)`}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-200 p-3 shadow-sm">
              <div className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => changeSection(section.id)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                      activeSection === section.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div>{section.icon}</div>

                      <div>
                        <p className="text-sm font-bold">{section.label}</p>
                        <p
                          className={`text-xs ${
                            activeSection === section.id
                              ? "text-blue-100"
                              : "text-slate-400"
                          }`}
                        >
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <form id="profileForm" onSubmit={handleSave}>
              <div
                ref={scrollContainerRef}
                onWheel={handleFormScrollNavigation}
                className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 space-y-6 scroll-smooth"
              >
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-6 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                        {currentSection?.icon}
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          {currentSection?.label}
                        </h2>
                        <p className="text-sm text-slate-500">
                          {currentSection?.description}
                        </p>
                      </div>
                    </div>

                    {isEditing && activeSection !== "review" && (
                      <div className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                        Editing mode is active
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
                  Scroll to the bottom to continue to the next section. Scroll
                  to the top to go back to the previous section.
                </div>

                {activeSection === "personal" && (
                  <SectionCard
                    icon={<User size={22} />}
                    title="Personal Information"
                    description="This information is used to prefill your application form."
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <Field label="First Name">
                        {isEditing ? (
                          <input
                            name="firstName"
                            value={personalInfo.firstName}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.firstName} />
                        )}
                      </Field>

                      <Field label="Middle Name">
                        {isEditing ? (
                          <>
                            <input
                              name="middleName"
                              value={personalInfo.middleName}
                              onChange={handlePersonalChange}
                              disabled={personalInfo.noMiddleName}
                              className={inputClass}
                            />

                            <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                name="noMiddleName"
                                checked={personalInfo.noMiddleName}
                                onChange={handlePersonalChange}
                              />
                              I don&apos;t have a middle name
                            </label>
                          </>
                        ) : (
                          <DisplayValue
                            value={
                              personalInfo.noMiddleName
                                ? "No middle name"
                                : personalInfo.middleName
                            }
                          />
                        )}
                      </Field>

                      <Field label="Last Name">
                        {isEditing ? (
                          <input
                            name="lastName"
                            value={personalInfo.lastName}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.lastName} />
                        )}
                      </Field>

                      <Field label="Suffix">
                        {isEditing ? (
                          <select
                            name="suffix"
                            value={personalInfo.suffix}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          >
                            <option value="">Not Applicable</option>
                            {suffixOptions.map((suffix) => (
                              <option key={suffix} value={suffix}>
                                {suffix}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <DisplayValue value={personalInfo.suffix} />
                        )}
                      </Field>

                      <Field label="Address" className="md:col-span-4">
                        {isEditing ? (
                          <input
                            name="address"
                            value={personalInfo.address}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.address} />
                        )}
                      </Field>

                      <Field label="Contact Number">
                        {isEditing ? (
                          <input
                            name="contactNumber"
                            value={personalInfo.contactNumber}
                            onChange={handlePersonalChange}
                            maxLength={11}
                            placeholder="09XXXXXXXXX"
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.contactNumber} />
                        )}
                      </Field>

                      <Field label="Email Address">
                        {isEditing ? (
                          <input
                            type="email"
                            name="emailAddress"
                            value={personalInfo.emailAddress}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.emailAddress} />
                        )}
                      </Field>

                      <Field label="Date of Birth">
                        {isEditing ? (
                          <input
                            type="date"
                            name="dob"
                            value={personalInfo.dob}
                            onChange={handlePersonalChange}
                            max={new Date().toISOString().split("T")[0]}
                            className={inputClass}
                          />
                        ) : (
                          <DisplayValue value={personalInfo.dob} />
                        )}
                      </Field>

                      <Field label="Age">
                        <DisplayValue value={personalInfo.age} />
                      </Field>

                      <Field label="Sex">
                        {isEditing ? (
                          <select
                            name="sex"
                            value={personalInfo.sex}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <DisplayValue value={personalInfo.sex} capitalize />
                        )}
                      </Field>

                      <Field label="Civil Status">
                        {isEditing ? (
                          <select
                            name="civilStatus"
                            value={personalInfo.civilStatus}
                            onChange={handlePersonalChange}
                            className={inputClass}
                          >
                            <option value="">Select</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="widowed">Widowed</option>
                            <option value="separated">Separated</option>
                            <option value="divorced">Divorced</option>
                          </select>
                        ) : (
                          <DisplayValue
                            value={personalInfo.civilStatus}
                            capitalize
                          />
                        )}
                      </Field>

                      <Field label="Nationality">
                        {isEditing ? (
                          <>
                            <select
                              name="nationality"
                              value={personalInfo.nationality}
                              onChange={handlePersonalChange}
                              className={inputClass}
                            >
                              <option value="">Select</option>
                              <option value="Filipino">Filipino</option>
                              <option value="Dual Citizen">Dual Citizen</option>
                              <option value="Others">Others</option>
                            </select>

                            {(personalInfo.nationality === "Dual Citizen" ||
                              personalInfo.nationality === "Others") && (
                              <input
                                name="nationalityInput"
                                value={personalInfo.nationalityInput}
                                onChange={handlePersonalChange}
                                placeholder="Specify nationality"
                                className={inputClass}
                              />
                            )}
                          </>
                        ) : (
                          <DisplayValue
                            value={
                              personalInfo.nationalityInput ||
                              personalInfo.nationality
                            }
                          />
                        )}
                      </Field>

                      <Field label="Religion">
                        {isEditing ? (
                          <>
                            <select
                              name="religion"
                              value={personalInfo.religion}
                              onChange={handlePersonalChange}
                              className={inputClass}
                            >
                              <option value="">Select</option>
                              {religionOptions.map((religion) => (
                                <option key={religion} value={religion}>
                                  {religion}
                                </option>
                              ))}
                            </select>

                            {personalInfo.religion === "Others" && (
                              <input
                                name="religionInput"
                                value={personalInfo.religionInput}
                                onChange={handlePersonalChange}
                                placeholder="Specify religion"
                                className={inputClass}
                              />
                            )}
                          </>
                        ) : (
                          <DisplayValue
                            value={
                              personalInfo.religionInput ||
                              personalInfo.religion
                            }
                          />
                        )}
                      </Field>

                      <Field label="Ethnic Group">
                        {isEditing ? (
                          <>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                name="hasEthnicGroup"
                                checked={personalInfo.hasEthnicGroup}
                                onChange={handlePersonalChange}
                              />
                              Do you belong to an ethnic group?
                            </label>

                            {personalInfo.hasEthnicGroup && (
                              <select
                                name="ethnicGroup"
                                value={personalInfo.ethnicGroup}
                                onChange={handlePersonalChange}
                                className={inputClass}
                              >
                                <option value="">Select ethnic group</option>
                                {ethnicGroupOptions.map((group) => (
                                  <option key={group} value={group}>
                                    {group}
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        ) : (
                          <DisplayValue value={personalInfo.ethnicGroup} />
                        )}
                      </Field>

                      <Field label="Disability">
                        {isEditing ? (
                          <>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                              <input
                                type="checkbox"
                                name="hasDisability"
                                checked={personalInfo.hasDisability}
                                onChange={handlePersonalChange}
                              />
                              Do you have a disability?
                            </label>

                            {personalInfo.hasDisability && (
                              <input
                                name="disability"
                                value={personalInfo.disability}
                                onChange={handlePersonalChange}
                                placeholder="Specify disability"
                                className={inputClass}
                              />
                            )}
                          </>
                        ) : (
                          <DisplayValue value={personalInfo.disability} />
                        )}
                      </Field>
                    </div>
                  </SectionCard>
                )}

                {activeSection === "education" && (
                  <SectionCard
                    icon={<GraduationCap size={22} />}
                    title="Educational Background"
                    description="Bachelor's and post-graduate information from your application form."
                  >
                    <EditableTableSection
                      title="Bachelor's Degree"
                      isEditing={isEditing}
                      rows={currentData.educationalBackground.bachelors}
                      fields={[
                        { key: "school", label: "School" },
                        { key: "course", label: "Course" },
                        { key: "year", label: "Year", type: "number" },
                        { key: "award", label: "Award" },
                      ]}
                      onChange={(index, field, value) =>
                        updateArrayField(
                          "educationalBackground",
                          "bachelors",
                          index,
                          field,
                          value
                        )
                      }
                      onAdd={() =>
                        addRow("educationalBackground", "bachelors", {
                          school: "",
                          course: "",
                          year: "",
                          award: "",
                        })
                      }
                      onRemove={() =>
                        removeRow("educationalBackground", "bachelors")
                      }
                    />

                    <EditableTableSection
                      title="Post Graduate Degree"
                      isEditing={isEditing}
                      rows={currentData.educationalBackground.postGraduate}
                      fields={[
                        { key: "school", label: "School" },
                        { key: "course", label: "Course" },
                        { key: "year", label: "Year", type: "number" },
                        { key: "award", label: "Award" },
                      ]}
                      onChange={(index, field, value) =>
                        updateArrayField(
                          "educationalBackground",
                          "postGraduate",
                          index,
                          field,
                          value
                        )
                      }
                      onAdd={() =>
                        addRow("educationalBackground", "postGraduate", {
                          school: "",
                          course: "",
                          year: "",
                          award: "",
                        })
                      }
                      onRemove={() =>
                        removeRow("educationalBackground", "postGraduate")
                      }
                    />
                  </SectionCard>
                )}

                {activeSection === "eligibility" && (
                  <SectionCard
                    icon={<IdCard size={22} />}
                    title="Eligibility and Work Experience"
                    description="Eligibility and work experience details used in your application."
                  >
                    <EditableTableSection
                      title="Eligibility"
                      isEditing={isEditing}
                      rows={currentData.eligibility.eligibilities}
                      fields={[
                        { key: "type", label: "Type" },
                        { key: "rating", label: "Rating" },
                        { key: "examDate", label: "Exam Date", type: "date" },
                        { key: "licenseNumber", label: "License Number" },
                        {
                          key: "validUntil",
                          label: "Valid Until",
                          type: "date",
                        },
                      ]}
                      onChange={(index, field, value) =>
                        updateArrayField(
                          "eligibility",
                          "eligibilities",
                          index,
                          field,
                          value
                        )
                      }
                      onAdd={() =>
                        addRow("eligibility", "eligibilities", {
                          type: "",
                          rating: "",
                          examDate: "",
                          licenseNumber: "",
                          validUntil: "",
                        })
                      }
                      onRemove={() =>
                        removeRow("eligibility", "eligibilities")
                      }
                    />

                    <EditableTableSection
                      title="Work Experience"
                      isEditing={isEditing}
                      rows={currentData.eligibility.workExperiences}
                      fields={[
                        { key: "position", label: "Position" },
                        { key: "agency", label: "Agency" },
                        { key: "status", label: "Status" },
                        { key: "from", label: "From", type: "month" },
                        { key: "toYear", label: "To / Present" },
                      ]}
                      onChange={(index, field, value) =>
                        updateArrayField(
                          "eligibility",
                          "workExperiences",
                          index,
                          field,
                          value
                        )
                      }
                      onAdd={() =>
                        addRow("eligibility", "workExperiences", {
                          position: "",
                          agency: "",
                          status: "",
                          from: "",
                          toYear: "",
                        })
                      }
                      onRemove={() =>
                        removeRow("eligibility", "workExperiences")
                      }
                    />
                  </SectionCard>
                )}

                {activeSection === "learning" && (
                  <SectionCard
                    icon={<CalendarDays size={22} />}
                    title="Learning and Development"
                    description="Training and seminar records from your application form."
                  >
                    <EditableTableSection
                      title="Trainings"
                      isEditing={isEditing}
                      rows={currentData.learningDevelopment.trainings}
                      fields={[
                        { key: "title", label: "Title" },
                        { key: "fromDate", label: "From Date", type: "date" },
                        { key: "toDate", label: "To Date", type: "date" },
                        { key: "hours", label: "Hours", type: "number" },
                        {
                          key: "conductedBy",
                          label: "Conducted / Sponsored By",
                        },
                      ]}
                      onChange={(index, field, value) =>
                        updateArrayField(
                          "learningDevelopment",
                          "trainings",
                          index,
                          field,
                          value
                        )
                      }
                      onAdd={() =>
                        addRow("learningDevelopment", "trainings", {
                          title: "",
                          fromDate: "",
                          toDate: "",
                          hours: "",
                          conductedBy: "",
                        })
                      }
                      onRemove={() =>
                        removeRow("learningDevelopment", "trainings")
                      }
                    />
                  </SectionCard>
                )}

                {activeSection === "job" && (
                  <SectionCard
                    icon={<Briefcase size={22} />}
                    title="Job Position and Attachments"
                    description="Preferred job position and required supporting documents."
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Position Applied For">
                        {isEditing ? (
                          <select
                            value={formData.jobPosition.positionCategory}
                            onChange={(e) =>
                              handleJobPositionChange(
                                "positionCategory",
                                e.target.value
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">Select position type</option>
                            <option value="Teaching">Teaching</option>
                            <option value="Non-Teaching">Non-Teaching</option>
                          </select>
                        ) : (
                          <DisplayValue
                            value={profile.jobPosition.positionCategory}
                          />
                        )}
                      </Field>

                      <Field label="Position">
                        {isEditing ? (
                          <select
                            value={formData.jobPosition.positionType}
                            onChange={(e) =>
                              handleJobPositionChange(
                                "positionType",
                                e.target.value
                              )
                            }
                            className={inputClass}
                            disabled={!formData.jobPosition.positionCategory}
                          >
                            <option value="">Select position</option>

                            {(formData.jobPosition.positionCategory ===
                            "Teaching"
                              ? teachingPositions
                              : nonTeachingPositions
                            ).map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <DisplayValue
                            value={profile.jobPosition.positionType}
                          />
                        )}
                      </Field>
                    </div>

                    {currentData.jobPosition.positionType === "Teacher I" && (
                      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
                        <p className="font-semibold text-blue-800">
                          If you are applying for Teacher I, you are required to
                          personally submit the hard copies of your attachments
                          to the Human Resource Office.
                        </p>

                        <ol className="mt-4 list-decimal pl-5 space-y-2">
                          <li>
                            Unique Application Number generated after
                            submission.
                          </li>
                          <li>Letter of intent addressed to the SDS.</li>
                          <li>Fully accomplished Personal Data Sheet.</li>
                          <li>
                            Photocopy of Voter&apos;s ID or proof of residency.
                          </li>
                          <li>Photocopy of valid and updated PRC License/ID.</li>
                          <li>Photocopy of Certificate of Board Rating.</li>
                          <li>Photocopy of TOR and Diploma.</li>
                          <li>Service Record or Certificate of Employment.</li>
                          <li>Latest appointment, if applicable.</li>
                          <li>Relevant trainings, if any.</li>
                          <li>TESDA NC II or TMC, if applicable.</li>
                          <li>Required Performance Ratings.</li>
                          <li>
                            Checklist, Omnibus, CAV, and Data Privacy Consent.
                          </li>
                          <li>Other HRMPSB requirements.</li>
                        </ol>
                      </div>
                    )}

                    {showAttachments && (
                      <div className="mt-8 space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                              Attachments / Requirements
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              Upload or review your supporting documents for the
                              selected position.
                            </p>
                          </div>

                          <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                            {uploadedCount} uploaded
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentUploadRequirements.map((requirement) => (
                            <ProfileFileUpload
                              key={requirement.field}
                              label={requirement.label}
                              description={requirement.description}
                              field={requirement.field}
                              file={
                                currentData.jobPosition.files?.[
                                  requirement.field
                                ]
                              }
                              isEditing={isEditing}
                              onFileChange={handleFileChange}
                              onRemoveFile={handleRemoveFile}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {!showAttachments &&
                      currentData.jobPosition.positionType &&
                      currentData.jobPosition.positionType !== "Teacher I" && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                          No attachment upload is required for this selected
                          position.
                        </div>
                      )}
                  </SectionCard>
                )}

                {activeSection === "review" && (
                  <ApplicationReview
                    data={currentData}
                    uploadedCount={uploadedCount}
                    onPrint={handlePrintApplication}
                  />
                )}

                <div className="pb-2" />
              </div>
            </form>
          </main>
        </div>
      </div>

      <div className="hidden print:block">
        <ApplicationReview
          data={currentData}
          uploadedCount={uploadedCount}
          onPrint={handlePrintApplication}
          printOnly
        />
      </div>
    </div>
  );
}

function ApplicationReview({ data, uploadedCount, onPrint, printOnly = false }) {
  const personalInfo = data.personalInfo || {};
  const education = data.educationalBackground || {};
  const eligibility = data.eligibility || {};
  const learningDevelopment = data.learningDevelopment || {};
  const jobPosition = data.jobPosition || {};
  const accountDetails = data.accountDetails || {};

  const applicantName =
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
      personalInfo.suffix,
    ]
      .filter(Boolean)
      .join(" ") || emptyText;

  const renderList = (items, renderItem) =>
    items?.length ? (
      items.map(renderItem)
    ) : (
      <p className="text-sm text-slate-500">No entries provided.</p>
    );

  return (
    <div
      id={printOnly ? "application-print-section" : undefined}
      className="space-y-6"
    >
      {!printOnly && (
        <div className="no-print flex justify-end">
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 transition"
          >
            <Printer size={18} />
            Print Application Form
          </button>
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-8">
        <div className="border-b border-slate-200 pb-5">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Application Form Review
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {applicantName}
          </h1>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600">
            <p>
              <strong>Applicant Number:</strong>{" "}
              {accountDetails.applicantNumber || emptyText}
            </p>
            <p>
              <strong>Status:</strong> {accountDetails.accountStatus || emptyText}
            </p>
            <p>
              <strong>Uploaded Attachments:</strong> {uploadedCount} file(s)
            </p>
          </div>
        </div>

        <ReviewSection title="Personal Information">
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
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
            <p className="sm:col-span-2">
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
              {personalInfo.religionInput || personalInfo.religion || emptyText}
            </p>
            <p>
              <strong>Ethnic Group:</strong>{" "}
              {personalInfo.ethnicGroup || emptyText}
            </p>
            <p>
              <strong>Disability:</strong>{" "}
              {personalInfo.disability || emptyText}
            </p>
          </div>
        </ReviewSection>

        <ReviewSection title="Educational Background">
          <h3 className="text-sm font-semibold text-slate-800">
            Bachelor&apos;s Degree
          </h3>

          <div className="space-y-2">
            {renderList(education.bachelors, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.school || emptyText}</strong> -{" "}
                {item.course || emptyText}, {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </div>
            ))}
          </div>

          <h3 className="pt-4 text-sm font-semibold text-slate-800">
            Post Graduate Degree
          </h3>

          <div className="space-y-2">
            {renderList(education.postGraduate, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.school || emptyText}</strong> -{" "}
                {item.course || emptyText}, {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </div>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection title="Eligibility">
          <div className="space-y-2">
            {renderList(eligibility.eligibilities, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.type || emptyText}</strong> - Rating{" "}
                {item.rating || emptyText}, Exam {item.examDate || emptyText},
                License {item.licenseNumber || emptyText}, Valid Until{" "}
                {item.validUntil || emptyText}
              </div>
            ))}
          </div>

          <h3 className="pt-4 text-sm font-semibold text-slate-800">
            Work Experience
          </h3>

          <div className="space-y-2">
            {renderList(eligibility.workExperiences, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.position || emptyText}</strong> -{" "}
                {item.agency || emptyText}, {item.status || emptyText},{" "}
                {item.from || emptyText} to {item.toYear || emptyText}
              </div>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection title="Learning and Development">
          <div className="space-y-2">
            {renderList(learningDevelopment.trainings, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.title || emptyText}</strong> -{" "}
                {item.fromDate || emptyText} to {item.toDate || emptyText},{" "}
                {item.hours || emptyText} hours,{" "}
                {item.conductedBy || emptyText}
              </div>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection title="Job Position and Attachments">
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Position Applied For:</strong>{" "}
              {jobPosition.positionCategory || emptyText}
            </p>
            <p>
              <strong>Position:</strong> {jobPosition.positionType || emptyText}
            </p>
          </div>

          {jobPosition.positionType === "Teacher I" && (
            <div className="mt-4 rounded-xl border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-blue-900">
                Teacher I applicants must personally submit hard copies of the
                required attachments to the Human Resource Office.
              </p>
            </div>
          )}

          <div className="mt-4">
            <p className="font-semibold text-slate-800">Attached Files:</p>

            <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              {Object.entries(jobPosition.files || {}).map(([key, file]) => (
                <li key={key}>
                  <strong>{key}:</strong>{" "}
                  {file?.name ||
                    file?.fileName ||
                    file?.filename ||
                    "Not uploaded"}
                </li>
              ))}
            </ul>
          </div>
        </ReviewSection>

        <div className="border-t border-slate-200 pt-5 text-sm text-slate-500 italic">
          This printed form reflects the current saved applicant profile and
          application information.
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
      <div className="border-b border-slate-300" />
      {children}
    </section>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-blue-700">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, description, children }) {
  return (
    <section className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-blue-900">{title}</h2>
          {description && (
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function DisplayValue({ value, capitalize = false }) {
  return (
    <p
      className={`mt-1 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm text-slate-800 min-h-[42px] ${
        capitalize ? "capitalize" : ""
      }`}
    >
      {value || "N/A"}
    </p>
  );
}

function EditableTableSection({
  title,
  isEditing,
  rows,
  fields,
  onChange,
  onAdd,
  onRemove,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
          {title}
        </h3>

        {isEditing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              <Plus size={15} />
              Add Row
            </button>

            {rows.length > 1 && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                <Trash2 size={15} />
                Remove Last
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Entry {rowIndex + 1}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-slate-500">
                    {field.label}
                  </label>

                  {isEditing ? (
                    <input
                      type={field.type || "text"}
                      value={row[field.key] || ""}
                      onChange={(e) =>
                        onChange(rowIndex, field.key, e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  ) : (
                    <p className="mt-1 rounded-xl bg-white border border-slate-100 px-3 py-2.5 text-sm text-slate-800 min-h-[42px]">
                      {row[field.key] || "N/A"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileFileUpload({
  label,
  description,
  field,
  file,
  isEditing,
  onFileChange,
  onRemoveFile,
}) {
  const fileName =
    file?.name || file?.fileName || file?.filename || file?.label || "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <label className="block text-sm font-bold text-slate-700">
          {label}
        </label>

        {description && (
          <p className="text-xs text-slate-500 mt-1 leading-5">
            {description}
          </p>
        )}
      </div>

      {isEditing ? (
        <>
          <input
            type="file"
            id={`profile-${field}`}
            className="hidden"
            onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
          />

          <label
            htmlFor={`profile-${field}`}
            className={`flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-4 text-center transition ${
              fileName
                ? "border-green-300 bg-green-50"
                : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            {fileName ? (
              <>
                <CheckCircle2 className="mb-2 h-6 w-6 text-green-600" />
                <span className="text-sm font-semibold text-green-700 break-all">
                  {fileName}
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="mb-2 h-7 w-7 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">
                  Click to upload file
                </span>
              </>
            )}
          </label>

          {fileName && (
            <button
              type="button"
              onClick={() => onRemoveFile(field)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Remove Attachment
            </button>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
          {fileName ? (
            <span className="font-semibold text-green-700 break-all">
              Uploaded: {fileName}
            </span>
          ) : (
            <span className="text-slate-500">Not uploaded</span>
          )}
        </div>
      )}
    </div>
  );
}