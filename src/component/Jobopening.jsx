import React from "react";
import {
  SlidersHorizontal,
  MapPin,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

const jobs = [
  {
    title: "Teacher I",
    category: "Teaching",
    status: "Open",
    salary: "SG 11",
    location: "DepEd CSJDM",
  },
  {
    title: "Administrative Aide VI",
    category: "Administrative",
    status: "Open",
    salary: "SG 6",
    location: "SDO Office",
  },
  {
    title: "Guidance Counselor I",
    category: "Student Services",
    status: "Hold",
    salary: "SG 11",
    location: "DepEd CSJDM",
  },
  {
    title: "Administrative Assistant II",
    category: "Administrative",
    status: "Closed",
    salary: "SG 8",
    location: "SDO Office",
  },
  {
    title: "Special Education Teacher I",
    category: "Teaching",
    status: "Open",
    salary: "SG 11",
    location: "DepEd CSJDM",
  },
  {
    title: "School Nurse II",
    category: "Health Services",
    status: "Closed",
    salary: "SG 15",
    location: "DepEd CSJDM",
  },
];

const statusStyle = {
  Open: "bg-green-50 text-green-600 border-green-300",
  Hold: "bg-yellow-50 text-yellow-600 border-yellow-300",
  Closed: "bg-red-50 text-red-500 border-red-300",
};

const Jobopening = () => {
  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="min-h-screen bg-white pt-28 px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>

          <button className="flex items-center gap-3 border border-slate-200 rounded-full px-5 py-3 text-sm text-slate-600 shadow-sm w-fit">
            <CalendarDays size={18} />
            <span className="text-slate-400">As of</span>
            {formattedDate}
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-8">
            
          {/* SIDEBAR */}
          <aside className="space-y-8">
            <button className="flex items-center gap-3 border border-slate-200 rounded-full px-5 py-3 text-sm text-slate-700 shadow-sm">
              Filter
              <SlidersHorizontal size={18} />
            </button>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Category</h3>
              <div className="space-y-4 text-slate-500 text-sm">
                {[
                  "Teaching",
                  "Administrative",
                  "Student Services",
                  "Health Services",
                ].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Location</h3>
              <div className="space-y-4 text-slate-500 text-sm">
                {["DepEd CSJDM", "SDO Office", "Schools Division Office"].map(
                  (item) => (
                    <label key={item} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300"
                      />
                      {item}
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-4">Job Type</h3>
              <div className="space-y-4 text-slate-500 text-sm">
                {["Full-Time", "Permanent", "Contractual"].map((item) => (
                  <label key={item} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          {/* CONTENT */}
          <section>
            {/* TABS */}
            <div className="flex gap-8 border-b border-slate-200 mb-5 overflow-x-auto">
              {["All", "Open", "Hold", "Closed", "Drafts (2)"].map(
                (tab, index) => (
                  <button
                    key={tab}
                    className={`pb-3 text-sm whitespace-nowrap ${
                      index === 0
                        ? "text-violet-600 border-b-2 border-violet-600"
                        : "text-slate-500"
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            {/* TABLE HEADER */}
            <div className="hidden md:grid grid-cols-[2fr_1.4fr_1fr_1.2fr_1fr] px-6 py-3 text-sm text-slate-400">
              <span>Job Title</span>
              <span>Category</span>
              <span>Status</span>
              <span>Salary</span>
              <span>Location</span>
            </div>

            {/* JOB LIST */}
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.4fr_1fr_1.2fr_1fr] gap-3 md:gap-0 items-center px-6 py-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition bg-white"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="md:hidden text-sm text-slate-500">
                      {job.category}
                    </p>
                  </div>

                  <p className="hidden md:block text-slate-700">
                    {job.category}
                  </p>

                  <span
                    className={`w-fit px-3 py-1 rounded-full border text-sm font-medium ${
                      statusStyle[job.status]
                    }`}
                  >
                    ● {job.status}
                  </span>

                  <p className="text-slate-900 font-medium">{job.salary}</p>

                  <p className="flex items-center gap-2 text-slate-700">
                    <MapPin size={16} className="text-slate-400" />
                    {job.location}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Jobopening;