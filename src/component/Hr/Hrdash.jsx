import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Calendar,
  CheckCircle,
  FileText,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

export default function Hrdash() {
  const applicants = [];

  const [showJobModal, setShowJobModal] = useState(false);

  const [jobData, setJobData] = useState({
    title: "",
    location: "",
    vacancy: "",
    deadline: "",
  });

  const handleJobChange = (e) => {
    const { name, value } = e.target;

    setJobData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateJob = async (e) => {
  e.preventDefault();

  try {
    await fetch("http://localhost:3000/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jobData),
    });

    setJobData({
      title: "",
      location: "",
      vacancy: "",
      deadline: "",
    });

    setShowJobModal(false);

    alert("Job created successfully");
  } catch (error) {
    console.error(error);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            HR Admin Dashboard
          </h1>

          <p className="text-slate-600 mt-1">
            Manage applicants, review submissions, and monitor hiring status.
          </p>
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
                <h2 className="text-2xl font-bold text-slate-800">0</h2>
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
                <h2 className="text-2xl font-bold text-slate-800">0</h2>
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
                <h2 className="text-2xl font-bold text-slate-800">0</h2>
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
                <h2 className="font-semibold text-slate-800">
                  Review Applicants
                </h2>

                <p className="text-sm text-slate-500">
                  Check submitted applications.
                </p>
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setShowJobModal(true)}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-700 p-3 rounded-xl">
                <UserPlus size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-800">Post Job</h2>

                <p className="text-sm text-slate-500">
                  Create a new vacancy.
                </p>
              </div>
            </div>
          </button>

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

                <p className="text-sm text-slate-500">
                  View interview schedule.
                </p>
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

          <div className="p-6 text-center text-slate-500">
            No applications found.
          </div>
        </div>
      </div>

      {/* POST JOB MODAL */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-bold text-blue-900">
                Create Job Vacancy
              </h2>

              <p className="text-sm text-slate-500">
                Add job information for the applicant job openings page.
              </p>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Job Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={jobData.title}
                  onChange={handleJobChange}
                  required
                  placeholder="Example: Teacher I"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={jobData.location}
                  onChange={handleJobChange}
                  required
                  placeholder="Example: DepEd CSJDM"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Number ofVacancies
                </label>

                <input
                  type="number"
                  name="vacancy"
                  value={jobData.vacancy}
                  onChange={handleJobChange}
                  required
                  min="1"
                  placeholder="Example: 12"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Deadline of Application
                </label>

                <input
                  type="date"
                  name="deadline"
                  value={jobData.deadline}
                  onChange={handleJobChange}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2 font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#0056b3] px-5 py-2 font-medium text-white hover:bg-[#003a78]"
                >
                  Save Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}