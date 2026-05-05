import React from "react";
import { MapPin } from "lucide-react";

const jobs = [
  {
    title: "Teacher I",
    location: "DepEd CSJDM",
    vacancy: 12,
    deadline: "May 30, 2026",
  },
  {
    title: "Administrative Aide VI",
    location: "SDO Office",
    vacancy: 3,
    deadline: "May 30, 2026",
  },
  {
    title: "Guidance Counselor I",
    location: "DepEd CSJDM",
    vacancy: 2,
    deadline: "June 5, 2026",
  },
  {
    title: "Administrative Assistant II",
    location: "SDO Office",
    vacancy: 1,
    deadline: "June 10, 2026",
  },
  {
    title: "Special Education Teacher I",
    location: "DepEd CSJDM",
    vacancy: 5,
    deadline: "June 15, 2026",
  },
];

const Jobopening = () => {
  return (
    <main className="min-h-screen bg-white pt-28 px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Jobs</h1>
        </div>

        <section>
          {/* TABLE HEADER */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] px-6 py-3 text-sm text-slate-400">
            <span>Job Title</span>
            <span>Location</span>
            <span>Vacancy</span>
            <span>Deadline of Application</span>
            <span>Action</span>
          </div>

          {/* JOB LIST */}
          <div className="space-y-3">
            {jobs.map((job, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] gap-3 md:gap-0 items-center px-6 py-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition bg-white"
              >
                <div>
                  <p className="font-semibold text-slate-900">{job.title}</p>
                </div>

                <p className="flex items-center gap-2 text-slate-700">
                  <MapPin size={16} className="text-slate-400" />
                  {job.location}
                </p>

                <p className="text-slate-700">{job.vacancy}</p>

                <p className="text-slate-700">{job.deadline}</p>

                <button className="w-fit rounded-full bg-[#0056b3] px-5 py-2 text-sm font-medium text-white hover:bg-[#003a78] transition">
                  Apply
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Jobopening;