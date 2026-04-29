import React from "react";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

const Applicantdash = () => {
  const applications = [
    {
      id: 1,
      position: "Administrative Assistant",
      status: "Under Review",
      date: "April 29, 2026",
    },
    {
      id: 2,
      position: "Financial Services Specialist",
      status: "Submitted",
      date: "April 28, 2026",
    },
  ];

  const getStatusStyle = (status) => {
    if (status === "Submitted") return "bg-blue-100 text-blue-700";
    if (status === "Under Review") return "bg-yellow-100 text-yellow-700";
    if (status === "Approved") return "bg-green-100 text-green-700";
    if (status === "Rejected") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-6 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Applicant Dashboard
          </h1>
          <p className="text-slate-500 mt-2">
            Welcome back! Track your job applications here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-5 border-slate-300">
            <FileText className="text-blue-600 mb-3" />
            <p className="text-sm text-slate-500">Total Applications</p>
            <h2 className="text-2xl font-bold">2</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border-slate-300">
            <Clock className="text-yellow-600 mb-3" />
            <p className="text-sm text-slate-500">Under Review</p>
            <h2 className="text-2xl font-bold">1</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border-slate-300">
            <CheckCircle className="text-green-600 mb-3" />
            <p className="text-sm text-slate-500">Approved</p>
            <h2 className="text-2xl font-bold">0</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5 border-slate-300">
            <XCircle className="text-red-600 mb-3" />
            <p className="text-sm text-slate-500">Rejected</p>
            <h2 className="text-2xl font-bold">0</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-slate-300 overflow-hidden">
          <div className="p-5 border-slate-300">
            <h2 className="text-xl font-semibold text-slate-900">
              My Applications
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="text-left p-4">Position</th>
                  <th className="text-left p-4">Date Applied</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border- hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">
                      {app.position}
                    </td>
                    <td className="p-4 text-slate-600">{app.date}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applicantdash;