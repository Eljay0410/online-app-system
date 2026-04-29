import { useState } from "react";

const labelClass = "block text-sm font-medium text-slate-600 mb-1";

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

  const [errors, setErrors] = useState({
    eligibilities: [],
    workExperiences: [],
  });

  const currentYear = new Date().getFullYear();

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const inputSmallClass = (hasError) =>
    `w-full h-11 px-3 text-sm rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const clearError = (section, index, field) => {
    setErrors((prev) => {
      const updated = { ...prev };
      if (updated[section]?.[index]?.[field]) {
        updated[section][index][field] = "";
      }
      return updated;
    });
  };

  const handleEligibilityChange = (index, field, value) => {
    const updated = [...eligibilities];
    updated[index][field] = value;
    setEligibilities(updated);
    clearError("eligibilities", index, field);
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
      setErrors((prev) => ({
        ...prev,
        eligibilities: prev.eligibilities.slice(0, -1),
      }));
    }
  };

  const handleWorkChange = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
    clearError("workExperiences", index, field);
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
      setErrors((prev) => ({
        ...prev,
        workExperiences: prev.workExperiences.slice(0, -1),
      }));
    }
  };

  const validateEligibilities = () => {
    return eligibilities.map((item) => {
      const rowErrors = {};

      if (!item.type.trim()) rowErrors.type = "Type is required";
      if (!item.rating.trim()) rowErrors.rating = "Rating is required";
      if (!item.examDate) rowErrors.examDate = "Date of examination is required";

      return rowErrors;
    });
  };

  const validateWorkExperiences = () => {
    return workExperiences.map((item) => {
      const rowErrors = {};

      if (!item.position.trim()) rowErrors.position = "Position is required";
      if (!item.agency.trim()) rowErrors.agency = "Agency is required";
      if (!item.status.trim()) rowErrors.status = "Status is required";

      if (!item.fromYear) {
        rowErrors.fromYear = "From year is required";
      } else if (item.fromYear.length !== 4) {
        rowErrors.fromYear = "Enter 4-digit year";
      } else if (Number(item.fromYear) > currentYear) {
        rowErrors.fromYear = "Year cannot be in the future";
      }

      if (!item.toYear.trim()) {
        rowErrors.toYear = "To year is required";
      } else if (
        item.toYear.toLowerCase() !== "present" &&
        item.toYear.length !== 4
      ) {
        rowErrors.toYear = "Enter 4-digit year or Present";
      } else if (
        item.toYear.toLowerCase() !== "present" &&
        Number(item.toYear) < Number(item.fromYear)
      ) {
        rowErrors.toYear = "To year cannot be earlier than From year";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const eligibilityErrors = validateEligibilities();
    const workErrors = validateWorkExperiences();

    setErrors({
      eligibilities: eligibilityErrors,
      workExperiences: workErrors,
    });

    const hasEligibilityErrors = eligibilityErrors.some(
      (row) => Object.keys(row).length > 0
    );

    const hasWorkErrors = workErrors.some(
      (row) => Object.keys(row).length > 0
    );

    if (hasEligibilityErrors || hasWorkErrors) return;

    const formData = {
      eligibilities,
      workExperiences,
    };

    console.log("Eligibility Data:", formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500"
    >
      {/* Eligibility */}
      <div className="space-y-4">
        {eligibilities.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Type <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  value={item.type}
                  onChange={(e) =>
                    handleEligibilityChange(index, "type", e.target.value)
                  }
                  placeholder="Type"
                  className={inputClass(errors.eligibilities[index]?.type)}
                  autoComplete="off"
                />
                {errors.eligibilities[index]?.type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].type}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Rating <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  value={item.rating}
                  onChange={(e) =>
                    handleEligibilityChange(index, "rating", e.target.value)
                  }
                  placeholder="Rating"
                  className={inputClass(errors.eligibilities[index]?.rating)}
                  autoComplete="off"
                />
                {errors.eligibilities[index]?.rating && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].rating}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Date of Examination <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="date"
                  value={item.examDate}
                  onChange={(e) =>
                    handleEligibilityChange(index, "examDate", e.target.value)
                  }
                  className={inputClass(errors.eligibilities[index]?.examDate)}
                  autoComplete="off"
                />
                {errors.eligibilities[index]?.examDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].examDate}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>License Number</label>
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
                  className={inputClass(false)}
                  autoComplete="off"
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Valid Until</label>}
                <input
                  type="date"
                  value={item.validUntil}
                  onChange={(e) =>
                    handleEligibilityChange(index, "validUntil", e.target.value)
                  }
                  className={inputClass(false)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addEligibility}
            className="text-blue-700 font-semibold"
          >
            Add +
          </button>

          {eligibilities.length > 1 && (
            <button
              type="button"
              onClick={removeEligibility}
              className="text-red-600 font-semibold"
            >
              Remove Last
            </button>
          )}
        </div>
      </div>

      {/* Work Experience */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-1xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Position / Title <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  value={item.position}
                  onChange={(e) =>
                    handleWorkChange(index, "position", e.target.value)
                  }
                  placeholder="Position"
                  className={inputClass(
                    errors.workExperiences[index]?.position
                  )}
                  autoComplete="off"
                />
                {errors.workExperiences[index]?.position && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workExperiences[index].position}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Agency / Office <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  value={item.agency}
                  onChange={(e) =>
                    handleWorkChange(index, "agency", e.target.value)
                  }
                  placeholder="Agency"
                  className={inputClass(errors.workExperiences[index]?.agency)}
                  autoComplete="off"
                />
                {errors.workExperiences[index]?.agency && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workExperiences[index].agency}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Status <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  value={item.status}
                  onChange={(e) =>
                    handleWorkChange(index, "status", e.target.value)
                  }
                  placeholder="Status"
                  className={inputClass(errors.workExperiences[index]?.status)}
                  autoComplete="off"
                />
                {errors.workExperiences[index]?.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workExperiences[index].status}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className={labelClass}>
                    Inclusive Date <span className="text-red-500">*</span>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      placeholder="From"
                      value={item.fromYear}
                      onChange={(e) =>
                        handleWorkChange(index, "fromYear", e.target.value)
                      }
                      className={inputSmallClass(
                        errors.workExperiences[index]?.fromYear
                      )}
                      autoComplete="off"
                    />
                    {errors.workExperiences[index]?.fromYear && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.workExperiences[index].fromYear}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="To / Present"
                      value={item.toYear}
                      onChange={(e) =>
                        handleWorkChange(index, "toYear", e.target.value)
                      }
                      className={inputSmallClass(
                        errors.workExperiences[index]?.toYear
                      )}
                      autoComplete="off"
                    />
                    {errors.workExperiences[index]?.toYear && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.workExperiences[index].toYear}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addWorkExperience}
            className="text-blue-700 font-semibold"
          >
            Add +
          </button>

          {workExperiences.length > 1 && (
            <button
              type="button"
              onClick={removeWorkExperience}
              className="text-red-600 font-semibold"
            >
              Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0056b3] text-white hover:bg-[#003a78] transition"
        >
          Next Step
        </button>
      </div>
    </form>
  );
};

export default Eligibility;