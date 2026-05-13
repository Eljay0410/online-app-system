import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { apiRequest } from "../../lib/api.js";

const Jobopening = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    apiRequest("/api/job-openings")
      .then((data) => setJobs(data.jobs || []))
      .catch((error) => console.error(error));
  }, []);

  return (
    <main className="min-h-screen bg-white pt-28 px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
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
            {jobs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-500 shadow-sm">
                No job openings available.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1.5fr_1fr] gap-3 md:gap-0 items-center px-6 py-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition bg-white"
                >
                  {/* JOB TITLE */}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {job.title}
                    </p>
                  </div>

                  {/* LOCATION */}
                  <p className="flex items-center gap-2 text-slate-700">
                    <MapPin size={16} className="text-slate-400" />
                    {job.location}
                  </p>

                  {/* VACANCY */}
                  <p className="text-slate-700">{job.vacancy}</p>

                  {/* DEADLINE */}
                  <p className="text-slate-700">
                    {new Date(job.deadline).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  {/* APPLY BUTTON */}
                  <button className="w-fit rounded-full bg-[#0056b3] px-5 py-2 text-sm font-medium text-white hover:bg-[#003a78] transition">
                    Apply
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Jobopening;
