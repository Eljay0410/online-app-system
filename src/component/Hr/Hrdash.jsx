import React from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export default function Hrdash() {
  const applicants = [
    {
      id: 1,
      name: "Juan Dela Cruz",
      position: "Teacher I",
      office: "DepEd CSJDM",
      dateSubmitted: "2026-04-30",
      status: "for_interview",
    },
    {
      id: 2,
      name: "Maria Santos",
      position: "Administrative Assistant",
      office: "DepEd CSJDM",
      dateSubmitted: "2026-04-25",
      status: "denied",
    },
    {
      id: 3,
      name: "Carlo Reyes",
      position: "Teacher II",
      office: "DepEd CSJDM",
      dateSubmitted: "2026-04-22",
      status: "pending",
    },
  ];

  const statusLabels = {
    for_interview: "For Interview",
    denied: "Denied",
    pending: "Pending Review",
  };

  const statusStyles = {
    for_interview: "bg-blue-100 text-blue-700 border-blue-200",
    denied: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* LEFT */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
              HR Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Manage applicants, review submissions, and monitor hiring status.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <Link
              to="/hr/applicants"
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 transition"
            >
              Applicants
            </Link>

            <Link
              to="/hr/add-job"
              className="px-5 py-2 rounded-full bg-[#0056b3] text-white text-sm font-medium hover:bg-[#003a78] transition"
            >
              Add Job
            </Link>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                <Users size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Applicants</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {applicants.length}
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 text-yellow-700 p-3 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {
                    applicants.filter(
                      (applicant) => applicant.status === "pending"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">For Interview</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {
                    applicants.filter(
                      (applicant) => applicant.status === "for_interview"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-700 p-3 rounded-xl">
                <XCircle size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Denied</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {
                    applicants.filter(
                      (applicant) => applicant.status === "denied"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/hr/applicants"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                <Briefcase size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Review Applicants</h2>
                <p className="text-sm text-slate-500">Check submitted applications.</p>
              </div>
            </div>
          </Link>

          <Link
            to="/hr/add-job"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 p-3 rounded-xl">
                <UserPlus size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Post Job</h2>
                <p className="text-sm text-slate-500">Create a new vacancy.</p>
              </div>
            </div>
          </Link>

          <Link
            to="/hr/interviews"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
                <CheckCircle size={22} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">Interviews</h2>
                <p className="text-sm text-slate-500">View interview schedule.</p>
              </div>
            </div>
          </Link>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-blue-900">
              Recent Applications
            </h2>
          </div>

          {applicants.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No applications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Applicant</th>
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3">Office / School</th>
                    <th className="px-5 py-3">Date Submitted</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {applicants.map((applicant) => (
                    <tr
                      key={applicant.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {applicant.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {applicant.position}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {applicant.office}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {applicant.dateSubmitted}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                            statusStyles[applicant.status]
                          }`}
                        >
                          {statusLabels[applicant.status]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/hr/applicants/${applicant.id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0056b3] text-white hover:bg-[#003a78] transition"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
