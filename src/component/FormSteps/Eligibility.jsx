import { useState } from "react";

const Eligibility = ({ data, onChange, onBack, onNext }) => {
  const [eligibilities, setEligibilities] = useState(
    data?.eligibilities || [
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ]
  );

  const [workExperiences, setWorkExperiences] = useState(
    data?.workExperiences || [
      {
        position: "",
        agency: "",
        status: "",
        fromYear: "",
        toYear: "",
      },
    ]
  );

  const [errors, setErrors] = useState({
    eligibilities: [],
    workExperiences: [],
  });

  const currentYear = new Date().getFullYear();

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const syncData = (updated) => {
    onChange &&
      onChange({
        eligibilities,
        workExperiences,
        ...updated,
      });
  };

  const handleEligibilityChange = (index, field, value) => {
    const updated = [...eligibilities];
    updated[index][field] = value;
    setEligibilities(updated);
    syncData({ eligibilities: updated });

    setErrors((prev) => {
      const updatedErrors = { ...prev };

      if (updatedErrors.eligibilities[index]?.[field]) {
        updatedErrors.eligibilities[index][field] = "";
      }

      return updatedErrors;
    });
  };

  const handleWorkChange = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
    syncData({ workExperiences: updated });

    setErrors((prev) => {
      const updatedErrors = { ...prev };

      if (updatedErrors.workExperiences[index]?.[field]) {
        updatedErrors.workExperiences[index][field] = "";
      }

      return updatedErrors;
    });
  };

  const addEligibility = () => {
    const updated = [
      ...eligibilities,
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ];

    setEligibilities(updated);
    syncData({ eligibilities: updated });
  };

  const addWorkExperience = () => {
    const updated = [
      ...workExperiences,
      {
        position: "",
        agency: "",
        status: "",
        fromYear: "",
        toYear: "",
      },
    ];

    setWorkExperiences(updated);
    syncData({ workExperiences: updated });
  };

  const validateEligibilities = () => {
    return eligibilities.map((item) => {
      const rowErrors = {};

      if (!item.type.trim()) rowErrors.type = "Type is required";
      if (!item.rating.trim()) rowErrors.rating = "Rating is required";
      if (!item.examDate) rowErrors.examDate = "Exam date is required";
      if (!item.licenseNumber.trim())
        rowErrors.licenseNumber = "License number is required";
      if (!item.validUntil) rowErrors.validUntil = "Validity date is required";

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
        Number(item.toYear) > currentYear
      ) {
        rowErrors.toYear = "Year cannot be in the future";
      } else if (
        item.toYear.toLowerCase() !== "present" &&
        Number(item.fromYear) > Number(item.toYear)
      ) {
        rowErrors.toYear = "To year must be after from year";
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

    onNext &&
      onNext({
        eligibilities,
        workExperiences,
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        {eligibilities.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <input
                value={item.type}
                onChange={(e) =>
                  handleEligibilityChange(index, "type", e.target.value)
                }
                className={inputClass(errors.eligibilities[index]?.type)}
                placeholder="Type"
              />
              {errors.eligibilities[index]?.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.eligibilities[index].type}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Rating <span className="text-red-500">*</span>
              </label>
              <input
                value={item.rating}
                onChange={(e) =>
                  handleEligibilityChange(index, "rating", e.target.value)
                }
                className={inputClass(errors.eligibilities[index]?.rating)}
                placeholder="Rating"
              />
              {errors.eligibilities[index]?.rating && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.eligibilities[index].rating}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={item.examDate}
                onChange={(e) =>
                  handleEligibilityChange(index, "examDate", e.target.value)
                }
                className={inputClass(errors.eligibilities[index]?.examDate)}
              />
              {errors.eligibilities[index]?.examDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.eligibilities[index].examDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                License Number <span className="text-red-500">*</span>
              </label>
              <input
                value={item.licenseNumber}
                onChange={(e) =>
                  handleEligibilityChange(
                    index,
                    "licenseNumber",
                    e.target.value
                  )
                }
                className={inputClass(
                  errors.eligibilities[index]?.licenseNumber
                )}
                placeholder="License Number"
              />
              {errors.eligibilities[index]?.licenseNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.eligibilities[index].licenseNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={item.validUntil}
                onChange={(e) =>
                  handleEligibilityChange(index, "validUntil", e.target.value)
                }
                className={inputClass(errors.eligibilities[index]?.validUntil)}
              />
              {errors.eligibilities[index]?.validUntil && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.eligibilities[index].validUntil}
                </p>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEligibility}
          className="text-blue-700 font-semibold"
        >
          Add +
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                value={item.position}
                onChange={(e) =>
                  handleWorkChange(index, "position", e.target.value)
                }
                className={inputClass(errors.workExperiences[index]?.position)}
                placeholder="Position"
              />
              {errors.workExperiences[index]?.position && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.workExperiences[index].position}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Agency <span className="text-red-500">*</span>
              </label>
              <input
                value={item.agency}
                onChange={(e) =>
                  handleWorkChange(index, "agency", e.target.value)
                }
                className={inputClass(errors.workExperiences[index]?.agency)}
                placeholder="Agency"
              />
              {errors.workExperiences[index]?.agency && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.workExperiences[index].agency}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <input
                value={item.status}
                onChange={(e) =>
                  handleWorkChange(index, "status", e.target.value)
                }
                className={inputClass(errors.workExperiences[index]?.status)}
                placeholder="Status"
              />
              {errors.workExperiences[index]?.status && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.workExperiences[index].status}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  value={item.fromYear}
                  onChange={(e) =>
                    handleWorkChange(index, "fromYear", e.target.value)
                  }
                  className={inputClass(
                    errors.workExperiences[index]?.fromYear
                  )}
                  placeholder="From"
                />
                {errors.workExperiences[index]?.fromYear && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workExperiences[index].fromYear}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  To / Present <span className="text-red-500">*</span>
                </label>
                <input
                  value={item.toYear}
                  onChange={(e) =>
                    handleWorkChange(index, "toYear", e.target.value)
                  }
                  className={inputClass(errors.workExperiences[index]?.toYear)}
                  placeholder="To / Present"
                />
                {errors.workExperiences[index]?.toYear && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.workExperiences[index].toYear}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addWorkExperience}
          className="text-blue-700 font-semibold"
        >
          Add +
        </button>
      </div>

      <div className="flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
        >
          Back
        </button>

        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0056b3] text-white font-bold hover:bg-[#003a78]"
        >
          Next Step
        </button>
      </div>
    </form>
  );
};

export default Eligibility;