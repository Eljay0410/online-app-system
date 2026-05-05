import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Calendar, FileText, Eye } from "lucide-react";

export default function ApplicantDash() {
  const applications = [
    {
      id: 1,
      position: "Teacher I",
      school: "DepEd CSJDM",
      dateApplied: "2026-04-30",
      status: "approved",
    },
    {
      id: 2,
      position: "Administrative Assistant",
      school: "DepEd CSJDM",
      dateApplied: "2026-04-25",
      status: "rejected",
    },
  ];

  const statusLabels = {
    approved: "For Interview",
    rejected: "Denied",
  };

  const statusStyles = {
    approved: "bg-blue-100 text-blue-700 border-blue-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const visibleApplications = applications.filter(
    (application) => application.status !== "under_review"
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* LEFT */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
              Applicant Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              View your application status and previous submissions.
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            <Link
              to="/application-history"
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm hover:bg-slate-100 transition"
            >
              History
            </Link>

            <Link
              to="/apply"
              className="px-5 py-2 rounded-full bg-[#0056b3] text-white text-sm font-medium hover:bg-[#003a78] transition"
            >
              Apply New
            </Link>
          </div>

        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Applications</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {visibleApplications.length}
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                <Briefcase size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">For Interview</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {
                    visibleApplications.filter(
                      (application) => application.status === "approved"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-700 p-3 rounded-xl">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Denied</p>
                <h2 className="text-2xl font-bold text-slate-800">
                  {
                    visibleApplications.filter(
                      (application) => application.status === "rejected"
                    ).length
                  }
                </h2>
              </div>
            </div>
          </div>

        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-blue-900">
              Previous Applications
            </h2>
          </div>

          {visibleApplications.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No previous applications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              
              <table className="w-full text-sm text-left">
                
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3">Position</th>
                    <th className="px-5 py-3">Office / School</th>
                    <th className="px-5 py-3">Date Applied</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleApplications.map((application) => (
                    <tr
                      key={application.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {application.position}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {application.school}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {application.dateApplied}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                            statusStyles[application.status]
                          }`}
                        >
                          {statusLabels[application.status]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/application-history/${application.id}`}
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