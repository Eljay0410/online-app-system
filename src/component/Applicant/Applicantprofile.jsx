"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronDown,
  Edit3,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  User,
  X,
} from "lucide-react";

const defaultProfile = {
  firstName: "Juan",
  middleName: "Santos",
  lastName: "Dela Cruz",
  email: "juan.delacruz@email.com",
  phone: "09123456789",
  sex: "Male",
  civilStatus: "Single",
  nationality: "Filipino",
  religion: "Roman Catholic",
  birthDate: "2000-01-01",
  address: "City of San Jose Del Monte, Bulacan",
  applicantNumber: "OAS-2026-0001",
  accountStatus: "Active",

  education: "Bachelor of Elementary Education",
  schoolGraduated: "Bulacan State University",
  yearGraduated: "2022",

  eligibility: "LET Passer",
  rating: "89.50",
  examDate: "2023-09-24",
  licenseNumber: "LET-2023-123456",

  workPosition: "Teacher Assistant",
  agency: "DepEd CSJDM",
  employmentStatus: "Contractual",
  fromYear: "2023",
  toYear: "2025",

  trainingTitle: "Classroom Management Training",
  trainingHours: "24",
  trainingDate: "2025-03-10",
  conductedBy: "DepEd CSJDM",

  attachments: {
    applicationLetter: "Application Letter.pdf",
    resume: "Resume.pdf",
    tor: "TOR.pdf",
    eligibilityCertificate: "LET Rating.pdf",
  },
};

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);

  const [activeTab, setActiveTab] = useState("applications");
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  const [activeApplications, setActiveApplications] = useState([
    {
      id: 23095,
      position: "Administrative Aide",
      location: "San Jose Del Monte, Bulacan, Philippines",
      status: "Under Consideration",
      site: "Candidate Experience site",
      appliedDate: "05/05/2026",
    },
  ]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("applicantProfile");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      setFormData(parsedProfile);
    }
  }, []);

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.middleName} ${profile.lastName}`;
  }, [profile]);

  const initials = useMemo(() => {
    const firstInitial = profile.firstName?.charAt(0) || "";
    const lastInitial = profile.lastName?.charAt(0) || "";

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [profile]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsEditingInfo(false);
    setFormData(profile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (e) => {
    const { name, files } = e.target;
    const fileName = files?.[0]?.name || "";

    setFormData((prev) => ({
      ...prev,
      attachments: {
        ...prev.attachments,
        [name]: fileName,
      },
    }));
  };

  const handleEditInfo = () => {
    setFormData(profile);
    setIsEditingInfo(true);
  };

  const handleCancelEditInfo = () => {
    setFormData(profile);
    setIsEditingInfo(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    setProfile(formData);
    localStorage.setItem("applicantProfile", JSON.stringify(formData));
    setIsEditingInfo(false);
  };

  const handleWithdrawApplication = (applicationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    setActiveApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId
          ? { ...application, status: "Withdrawn" }
          : application
      )
    );
  };

  const displayData = isEditingInfo ? formData : profile;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/applicantdashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* HEADER CARD */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0056b3] h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 -mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-800">
                      {initials}
                    </span>
                  </div>
                </div>

                <div className="mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {fullName}
                  </h1>

                  <p className="text-slate-500 mt-1">Applicant Profile</p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                      <ShieldCheck size={14} />
                      {profile.accountStatus}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                      <IdCard size={14} />
                      {profile.applicantNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* SLIDE BUTTON */}
              <div className="rounded-2xl bg-slate-100 p-1 flex items-center border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleTabChange("applications")}
                  className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === "applications"
                      ? "bg-[#0056b3] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  My Job
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("info")}
                  className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === "info"
                      ? "bg-[#0056b3] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  View Info
                </button>
              </div>
            </div>
          </div>
        </div>

        <form
          id="profileForm"
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* LEFT SIDE */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Contact Information
              </h2>

              <div className="space-y-4">
                <InfoLine icon={<Mail size={19} />} label="Email Address">
                  {profile.email}
                </InfoLine>

                <InfoLine icon={<Phone size={19} />} label="Phone Number">
                  {profile.phone}
                </InfoLine>

                <InfoLine icon={<MapPin size={19} />} label="Address">
                  {profile.address}
                </InfoLine>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Account Details
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">
                    Unique Application Number
                  </p>
                  <p className="font-medium text-slate-800">
                    {profile.applicantNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Account Status</p>
                  <p className="font-medium text-green-700">
                    {profile.accountStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          {activeTab === "applications" ? (
            <ActiveApplications
              activeApplications={activeApplications}
              onWithdraw={handleWithdrawApplication}
            />
          ) : (
            <ApplicationInformation
              data={displayData}
              isEditing={isEditingInfo}
              onEdit={handleEditInfo}
              onCancel={handleCancelEditInfo}
              onChange={handleChange}
              onAttachmentChange={handleAttachmentChange}
            />
          )}
        </form>
      </div>
    </div>
  );
}

function ActiveApplications({ activeApplications, onWithdraw }) {
  const [openStatusId, setOpenStatusId] = useState(null);

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Briefcase className="text-blue-700" size={22} />

          <h2 className="text-lg font-semibold text-blue-900">
            Active Job Applications
          </h2>
        </div>

        <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
          {activeApplications.length} Active
        </span>
      </div>

      <div className="space-y-4">
        {activeApplications.map((application) => (
          <div
            key={application.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-white hover:shadow-sm transition"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {application.position}
                </h3>

                <div className="flex items-start gap-2 mt-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 text-slate-500" />
                  <span>{application.location}</span>
                </div>

                <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                  <Building2 size={16} className="text-slate-500" />
                  <span>{application.site}</span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
                  <CalendarDays size={16} className="text-slate-500" />
                  <span>Applied on {application.appliedDate}</span>
                </div>
              </div>

              <div className="md:text-right relative">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setOpenStatusId(
                      openStatusId === application.id ? null : application.id
                    )
                  }
                  className={`inline-flex items-center gap-2 mt-2 rounded-full border px-3 py-1 text-sm font-semibold transition ${
                    application.status === "Withdrawn"
                      ? "border-red-200 bg-red-100 text-red-700"
                      : "border-yellow-200 bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {application.status}
                  <ChevronDown size={15} />
                </button>

                {openStatusId === application.id && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-20 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        onWithdraw(application.id);
                        setOpenStatusId(null);
                      }}
                      disabled={application.status === "Withdrawn"}
                      className={`w-full px-4 py-3 text-sm font-medium transition ${
                        application.status === "Withdrawn"
                          ? "text-slate-400 cursor-not-allowed"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                    >
                      Withdraw Application
                    </button>
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-500">
                  Application ID #{application.id}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to="/application-history"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          View All Applications
        </Link>
      </div>
    </div>
  );
}

function ApplicationInformation({
  data,
  isEditing,
  onEdit,
  onCancel,
  onChange,
  onAttachmentChange,
}) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <User className="text-blue-700" size={22} />

          <h2 className="text-lg font-semibold text-blue-900">
            Application Information
          </h2>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <Edit3 size={16} />
            Edit Info
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              form="profileForm"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <Section title="Personal Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="First Name"
              name="firstName"
              value={data.firstName}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Middle Name"
              name="middleName"
              value={data.middleName}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Last Name"
              name="lastName"
              value={data.lastName}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Email"
              name="email"
              value={data.email}
              onChange={onChange}
              type="email"
              isEditing={isEditing}
            />

            <InputField
              label="Phone"
              name="phone"
              value={data.phone}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Birth Date"
              name="birthDate"
              value={data.birthDate}
              onChange={onChange}
              type="date"
              isEditing={isEditing}
            />

            <InputField
              label="Sex"
              name="sex"
              value={data.sex}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Civil Status"
              name="civilStatus"
              value={data.civilStatus}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Nationality"
              name="nationality"
              value={data.nationality}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Religion"
              name="religion"
              value={data.religion}
              onChange={onChange}
              isEditing={isEditing}
            />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-600">
              Address
            </label>

            {isEditing ? (
              <textarea
                name="address"
                value={data.address || ""}
                onChange={onChange}
                rows="3"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {data.address || "N/A"}
              </p>
            )}
          </div>
        </Section>

        <Section title="Educational Background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Education"
              name="education"
              value={data.education}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="School Graduated"
              name="schoolGraduated"
              value={data.schoolGraduated}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Year Graduated"
              name="yearGraduated"
              value={data.yearGraduated}
              onChange={onChange}
              isEditing={isEditing}
            />
          </div>
        </Section>

        <Section title="Eligibility">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Eligibility"
              name="eligibility"
              value={data.eligibility}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Rating"
              name="rating"
              value={data.rating}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Exam Date"
              name="examDate"
              value={data.examDate}
              onChange={onChange}
              type="date"
              isEditing={isEditing}
            />

            <InputField
              label="License Number"
              name="licenseNumber"
              value={data.licenseNumber}
              onChange={onChange}
              isEditing={isEditing}
            />
          </div>
        </Section>

        <Section title="Work Experience">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Position"
              name="workPosition"
              value={data.workPosition}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Agency"
              name="agency"
              value={data.agency}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Employment Status"
              name="employmentStatus"
              value={data.employmentStatus}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="From Year"
              name="fromYear"
              value={data.fromYear}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="To Year"
              name="toYear"
              value={data.toYear}
              onChange={onChange}
              isEditing={isEditing}
            />
          </div>
        </Section>

        <Section title="Learning and Development">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField
              label="Training Title"
              name="trainingTitle"
              value={data.trainingTitle}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Training Hours"
              name="trainingHours"
              value={data.trainingHours}
              onChange={onChange}
              isEditing={isEditing}
            />

            <InputField
              label="Training Date"
              name="trainingDate"
              value={data.trainingDate}
              onChange={onChange}
              type="date"
              isEditing={isEditing}
            />

            <InputField
              label="Conducted By"
              name="conductedBy"
              value={data.conductedBy}
              onChange={onChange}
              isEditing={isEditing}
            />
          </div>
        </Section>

        <Section title="Attachments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AttachmentField
              label="Application Letter"
              name="applicationLetter"
              currentFile={data.attachments?.applicationLetter}
              onChange={onAttachmentChange}
              isEditing={isEditing}
            />

            <AttachmentField
              label="Resume"
              name="resume"
              currentFile={data.attachments?.resume}
              onChange={onAttachmentChange}
              isEditing={isEditing}
            />

            <AttachmentField
              label="Transcript of Records"
              name="tor"
              currentFile={data.attachments?.tor}
              onChange={onAttachmentChange}
              isEditing={isEditing}
            />

            <AttachmentField
              label="Eligibility Certificate"
              name="eligibilityCertificate"
              currentFile={data.attachments?.eligibilityCertificate}
              onChange={onAttachmentChange}
              isEditing={isEditing}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}

function InfoLine({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-blue-700 mt-1">{icon}</div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{children}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-blue-900 mb-4 border-b border-slate-200 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", isEditing }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-600">{label}</label>

      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
          {value || "N/A"}
        </p>
      )}
    </div>
  );
}

function AttachmentField({ label, name, currentFile, onChange, isEditing }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <FileText className="text-blue-700 mt-1" size={20} />

        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">{label}</p>

          <p className="text-xs text-slate-500 mt-1">
            Current file:{" "}
            <span className="font-medium text-slate-700">
              {currentFile || "No file uploaded"}
            </span>
          </p>

          {isEditing && (
            <label className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition">
              <Upload size={16} />
              Replace File

              <input
                type="file"
                name={name}
                onChange={onChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}