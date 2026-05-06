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
        from: "",
        toYear: "",
      },
    ]
  );

  const [errors, setErrors] = useState({
    eligibilities: [],
  });

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

      if (updatedErrors.eligibilities?.[index]?.[field]) {
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

  const removeLastEligibility = () => {
    if (eligibilities.length > 1) {
      const updated = eligibilities.slice(0, -1);
      setEligibilities(updated);
      syncData({ eligibilities: updated });

      setErrors((prev) => ({
        ...prev,
        eligibilities: prev.eligibilities.slice(0, -1),
      }));
    }
  };

  const addWorkExperience = () => {
    const updated = [
      ...workExperiences,
      {
        position: "",
        agency: "",
        status: "",
        from: "",
        toYear: "",
      },
    ];

    setWorkExperiences(updated);
    syncData({ workExperiences: updated });
  };

  const removeLastWorkExperience = () => {
    if (workExperiences.length > 1) {
      const updated = workExperiences.slice(0, -1);
      setWorkExperiences(updated);
      syncData({ workExperiences: updated });
    }
  };

  const validateEligibilities = () => {
    return eligibilities.map((item) => {
      const rowErrors = {};

      if (!item.type.trim()) {
        rowErrors.type = "Type is required";
      }

      if (!item.rating.trim()) {
        rowErrors.rating = "Rating is required";
      } else if (isNaN(Number(item.rating))) {
        rowErrors.rating = "Rating must be a number";
      }

      if (!item.examDate) {
        rowErrors.examDate = "Exam date is required";
      }

      if (!item.licenseNumber.trim()) {
        rowErrors.licenseNumber = "License number is required";
      }

      if (!item.validUntil) {
        rowErrors.validUntil = "Valid until is required";
      }

      if (
        item.examDate &&
        item.validUntil &&
        new Date(item.validUntil) < new Date(item.examDate)
      ) {
        rowErrors.validUntil = "Valid until cannot be before exam date";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const eligibilityErrors = validateEligibilities();

    setErrors({
      eligibilities: eligibilityErrors,
    });

    const hasEligibilityErrors = eligibilityErrors.some(
      (row) => Object.keys(row).length > 0
    );

    if (hasEligibilityErrors) return;

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
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                )}
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
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Rating <span className="text-red-500">*</span>
                  </label>
                )}
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
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                )}
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
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    License Number <span className="text-red-500">*</span>
                  </label>
                )}
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
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                )}
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
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addEligibility}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {eligibilities.length > 1 && (
            <button
              type="button"
              onClick={removeLastEligibility}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Position
                  </label>
                )}
                <input
                  value={item.position}
                  onChange={(e) =>
                    handleWorkChange(index, "position", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Position"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Agency
                  </label>
                )}
                <input
                  value={item.agency}
                  onChange={(e) =>
                    handleWorkChange(index, "agency", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Agency"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Status
                  </label>
                )}
                <input
                  value={item.status}
                  onChange={(e) =>
                    handleWorkChange(index, "status", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Status"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    From
                  </label>
                )}
                <input
                  type="month"
                  value={item.from}
                  onChange={(e) =>
                    handleWorkChange(index, "from", e.target.value)
                  }
                  className={inputClass()}
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    To / Present
                  </label>
                )}
                <input
                  value={item.toYear}
                  onChange={(e) =>
                    handleWorkChange(index, "toYear", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="To / Present"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addWorkExperience}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {workExperiences.length > 1 && (
            <button
              type="button"
              onClick={removeLastWorkExperience}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
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