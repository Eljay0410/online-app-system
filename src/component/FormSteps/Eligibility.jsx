import { useState } from "react";

const Eligibility = () => {
  const [eligibilities, setEligibilities] = useState([
    {
      type: "",
      rating: "",
      examDate: "",
      licenseNumber: "",
      validUntil: "",
    },
  ]);

  const [workExperiences, setWorkExperiences] = useState([
    {
      position: "",
      agency: "",
      status: "",
      fromYear: "",
      toYear: "",
    },
  ]);

  const handleEligibilityChange = (index, field, value) => {
    const updated = [...eligibilities];
    updated[index][field] = value;
    setEligibilities(updated);
  };

  const addEligibility = () => {
    setEligibilities([
      ...eligibilities,
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ]);
  };

  const removeEligibility = () => {
    if (eligibilities.length > 1) {
      setEligibilities(eligibilities.slice(0, -1));
    }
  };

  const handleWorkChange = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        position: "",
        agency: "",
        status: "",
        fromYear: "",
        toYear: "",
      },
    ]);
  };

  const removeWorkExperience = () => {
    if (workExperiences.length > 1) {
      setWorkExperiences(workExperiences.slice(0, -1));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Eligibility Section */}
      <div className="space-y-4">
      

        {eligibilities.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Type
                  </label>
                )}
                <input
                  type="text"
                  value={item.type}
                  onChange={(e) =>
                    handleEligibilityChange(index, "type", e.target.value)
                  }
                  placeholder="Type"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Rating
                  </label>
                )}
                <input
                  type="text"
                  value={item.rating}
                  onChange={(e) =>
                    handleEligibilityChange(index, "rating", e.target.value)
                  }
                  placeholder="Rating"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Date of Examination
                  </label>
                )}
                <input
                  type="date"
                  value={item.examDate}
                  onChange={(e) =>
                    handleEligibilityChange(index, "examDate", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    License Number
                  </label>
                )}
                <input
                  type="text"
                  value={item.licenseNumber}
                  onChange={(e) =>
                    handleEligibilityChange(
                      index,
                      "licenseNumber",
                      e.target.value
                    )
                  }
                  placeholder="If applicable"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Valid Until
                  </label>
                )}
                <input
                  type="date"
                  value={item.validUntil}
                  onChange={(e) =>
                    handleEligibilityChange(index, "validUntil", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addEligibility}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Add +
          </button>

          {eligibilities.length > 1 && (
            <button
              type="button"
              onClick={removeEligibility}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Remove Last
            </button>
          )}
        </div>
      </div>

      {/* Work Experience Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Position / Title
                  </label>
                )}
                <input
                  type="text"
                  value={item.position}
                  onChange={(e) =>
                    handleWorkChange(index, "position", e.target.value)
                  }
                  placeholder="Position / Title"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Agency / Office
                  </label>
                )}
                <input
                  type="text"
                  value={item.agency}
                  onChange={(e) =>
                    handleWorkChange(index, "agency", e.target.value)
                  }
                  placeholder="Agency / Office"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Status
                  </label>
                )}
                <input
                  type="text"
                  value={item.status}
                  onChange={(e) =>
                    handleWorkChange(index, "status", e.target.value)
                  }
                  placeholder="Status"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    From Year
                  </label>
                )}
                <input
                  type="number"
                  value={item.fromYear}
                  onChange={(e) =>
                    handleWorkChange(index, "fromYear", e.target.value)
                  }
                  placeholder="YYYY"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    To Year
                  </label>
                )}
                <input
                  type="number"
                  value={item.toYear}
                  onChange={(e) =>
                    handleWorkChange(index, "toYear", e.target.value)
                  }
                  placeholder="YYYY"
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addWorkExperience}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Add +
          </button>

          {workExperiences.length > 1 && (
            <button
              type="button"
              onClick={removeWorkExperience}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Remove Last
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Eligibility;