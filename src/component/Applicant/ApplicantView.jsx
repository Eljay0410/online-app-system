import React from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  MapPin,
  User,
  XCircle,
} from "lucide-react";

export default function ApplicantView() {
  const { id } = useParams();

  const applications = [
    {
      id: 1,
      position: "Teacher I",
      school: "DepEd CSJDM",
      dateApplied: "2026-04-30",
      status: "approved",

      personalInfo: {
        fullName: "Juan Dela Cruz",
        email: "juan.delacruz@gmail.com",
        contactNumber: "09171234567",
        address: "San Jose del Monte, Bulacan",
        birthDate: "2000-05-15",
        gender: "Male",
        civilStatus: "Single",
        citizenship: "Filipino",
      },

      educationalBackground: {
        bachelors: "Bachelor of Elementary Education",
        schoolGraduated: "Bulacan State University",
        yearGraduated: "2022",
        award: "Cum Laude",
      },

      eligibility: {
        type: "Licensure Examination for Teachers",
        rating: "89.50",
        examDate: "2023-09-24",
        licenseNumber: "LET-2023-123456",
        validUntil: "2028-09-24",
      },

      workExperience: {
        position: "Teacher Assistant",
        agency: "DepEd CSJDM",
        status: "Contractual",
        fromYear: "2023",
        toYear: "2025",
      },

      learningDevelopment: {
        title: "Classroom Management Training",
        hours: "24",
        date: "2025-03-10",
        conductedBy: "DepEd CSJDM",
      },

      attachments: [
        "Application Letter.pdf",
        "Resume.pdf",
        "TOR.pdf",
        "LET Rating.pdf",
      ],
    },
    {
      id: 2,
      position: "Administrative Assistant",
      school: "DepEd CSJDM",
      dateApplied: "2026-04-25",
      status: "rejected",

      personalInfo: {
        fullName: "Juan Dela Cruz",
        email: "juan.delacruz@gmail.com",
        contactNumber: "09171234567",
        address: "San Jose del Monte, Bulacan",
        birthDate: "2000-05-15",
        gender: "Male",
        civilStatus: "Single",
        citizenship: "Filipino",
      },

      educationalBackground: {
        bachelors: "Bachelor of Science in Office Administration",
        schoolGraduated: "Bulacan State University",
        yearGraduated: "2022",
        award: "N/A",
      },

      eligibility: {
        type: "Civil Service Professional",
        rating: "86.20",
        examDate: "2023-03-26",
        licenseNumber: "CSE-2023-78910",
        validUntil: "N/A",
      },

      workExperience: {
        position: "Office Staff",
        agency: "Private Company",
        status: "Regular",
        fromYear: "2023",
        toYear: "2024",
      },

      learningDevelopment: {
        title: "Records Management Training",
        hours: "16",
        date: "2024-11-12",
        conductedBy: "DepEd CSJDM",
      },

      attachments: [
        "Application Letter.pdf",
        "Resume.pdf",
        "Civil Service Certificate.pdf",
      ],
    },
  ];

  const application = applications.find(
    (application) => application.id === Number(id)
  );

  const statusLabels = {
    approved: "For Interview",
    rejected: "Denied",
  };

  const statusStyles = {
    approved: "bg-blue-100 text-blue-700 border-blue-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons = {
    approved: <CheckCircle size={18} />,
    rejected: <XCircle size={18} />,
  };

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-slate-800">
            Application not found
          </h1>

          <p className="text-slate-500 mt-2">
            The application you are trying to view does not exist.
          </p>

          <Link
            to="/applicantdashboard"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2 rounded-lg bg-[#0056b3] text-white hover:bg-[#003a78] transition"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/applicantdashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700 transition"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
                Application Details
              </h1>

              <p className="text-slate-600 mt-1">
                Details submitted in your application form.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${
                statusStyles[application.status]
              }`}
            >
              {statusIcons[application.status]}
              {statusLabels[application.status]}
            </span>
          </div>
        </div>

        {/* REMAINING SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            icon={<Briefcase size={22} />}
            label="Position"
            value={application.position}
          />

          <SummaryCard
            icon={<MapPin size={22} />}
            label="Office / School"
            value={application.school}
          />

          <SummaryCard
            icon={<Calendar size={22} />}
            label="Date Applied"
            value={application.dateApplied}
          />
        </div>

        {/* APPLICATION FORM DETAILS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle title="Personal Information" icon={<User size={18} />} />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Full Name" value={application.personalInfo.fullName} />
            <DetailItem label="Email" value={application.personalInfo.email} />
            <DetailItem label="Contact Number" value={application.personalInfo.contactNumber} />
            <DetailItem label="Address" value={application.personalInfo.address} />
            <DetailItem label="Birth Date" value={application.personalInfo.birthDate} />
            <DetailItem label="Gender" value={application.personalInfo.gender} />
            <DetailItem label="Civil Status" value={application.personalInfo.civilStatus} />
            <DetailItem label="Citizenship" value={application.personalInfo.citizenship} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle
            title="Educational Background"
            icon={<FileText size={18} />}
          />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem
              label="Bachelor's Degree"
              value={application.educationalBackground.bachelors}
            />
            <DetailItem
              label="School Graduated"
              value={application.educationalBackground.schoolGraduated}
            />
            <DetailItem
              label="Year Graduated"
              value={application.educationalBackground.yearGraduated}
            />
            <DetailItem
              label="Award"
              value={application.educationalBackground.award}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle title="Eligibility" icon={<CheckCircle size={18} />} />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Eligibility Type" value={application.eligibility.type} />
            <DetailItem label="Rating" value={application.eligibility.rating} />
            <DetailItem label="Exam Date" value={application.eligibility.examDate} />
            <DetailItem
              label="License Number"
              value={application.eligibility.licenseNumber}
            />
            <DetailItem label="Valid Until" value={application.eligibility.validUntil} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle title="Work Experience" icon={<Briefcase size={18} />} />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem label="Position" value={application.workExperience.position} />
            <DetailItem label="Agency" value={application.workExperience.agency} />
            <DetailItem label="Status" value={application.workExperience.status} />
            <DetailItem label="From Year" value={application.workExperience.fromYear} />
            <DetailItem label="To Year" value={application.workExperience.toYear} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle
            title="Learning and Development"
            icon={<FileText size={18} />}
          />

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailItem
              label="Training Title"
              value={application.learningDevelopment.title}
            />
            <DetailItem label="Hours" value={application.learningDevelopment.hours} />
            <DetailItem label="Date" value={application.learningDevelopment.date} />
            <DetailItem
              label="Conducted By"
              value={application.learningDevelopment.conductedBy}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <SectionTitle title="Submitted Attachments" icon={<FileText size={18} />} />

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {application.attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 text-slate-700 p-2 rounded-lg">
                    <FileText size={18} />
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {attachment}
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
                >
                  <Eye size={15} />
                  View
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            to="/application-history"
            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            View Application History
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">{icon}</div>

        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <h2 className="font-bold text-slate-800">{value}</h2>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon }) {
  return (
    <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
      <div className="text-blue-700">{icon}</div>
      <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-800">{value || "N/A"}</p>
    </div>
  );
}