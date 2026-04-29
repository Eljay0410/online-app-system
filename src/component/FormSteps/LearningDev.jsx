import { useState } from "react";

const LearningDevelopment = ({ onNext }) => {
  const [trainings, setTrainings] = useState([
    {
      title: "",
      fromDate: "",
      toDate: "",
      hours: "",
      conductedBy: "",
    },
  ]);

  const [errors, setErrors] = useState([]);

  const currentYear = new Date().getFullYear();

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const inputSmallClass = (hasError) =>
    `w-full h-11 px-3 text-sm rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const clearError = (index, field) => {
    setErrors((prev) => {
      const updated = [...prev];

      if (updated[index]?.[field]) {
        updated[index][field] = "";
      }

      return updated;
    });
  };

  const handleChange = (index, field, value) => {
    const updated = [...trainings];
    updated[index][field] = value;
    setTrainings(updated);
    clearError(index, field);
  };

  const addTraining = () => {
    setTrainings([
      ...trainings,
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ]);
  };

  const removeTraining = () => {
    if (trainings.length > 1) {
      setTrainings(trainings.slice(0, -1));
      setErrors(errors.slice(0, -1));
    }
  };

  const validateForm = () => {
    return trainings.map((item) => {
      const rowErrors = {};

      if (!item.title.trim()) {
        rowErrors.title = "Title is required";
      }

      if (!item.fromDate) {
        rowErrors.fromDate = "From year is required";
      } else if (item.fromDate.length !== 4) {
        rowErrors.fromDate = "Enter 4-digit year";
      } else if (Number(item.fromDate) > currentYear) {
        rowErrors.fromDate = "Year cannot be in the future";
      }

      if (!item.toDate) {
        rowErrors.toDate = "To year is required";
      } else if (item.toDate.length !== 4) {
        rowErrors.toDate = "Enter 4-digit year";
      } else if (Number(item.toDate) > currentYear) {
        rowErrors.toDate = "Year cannot be in the future";
      } else if (Number(item.toDate) < Number(item.fromDate)) {
        rowErrors.toDate = "To year cannot be earlier than From year";
      }

      if (!item.hours) {
        rowErrors.hours = "Number of hours is required";
      } else if (Number(item.hours) <= 0) {
        rowErrors.hours = "Hours must be greater than 0";
      }

      if (!item.conductedBy.trim()) {
        rowErrors.conductedBy = "Conducted / Sponsored By is required";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    const hasErrors = validationErrors.some(
      (row) => Object.keys(row).length > 0
    );

    if (hasErrors) return;

    const formData = {
      trainings,
    };

    console.log("Learning Development Data:", formData);

    if (onNext) {
      onNext(formData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="space-y-4">
        {trainings.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Title */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) =>
                    handleChange(index, "title", e.target.value)
                  }
                  className={inputClass(errors[index]?.title)}
                  autoComplete="off"
                />

                {errors[index]?.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[index].title}
                  </p>
                )}
              </div>

              {/* Inclusive Date */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Inclusive Date <span className="text-red-500">*</span>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      placeholder="From"
                      value={item.fromDate}
                      onChange={(e) =>
                        handleChange(index, "fromDate", e.target.value)
                      }
                      className={inputSmallClass(errors[index]?.fromDate)}
                      autoComplete="off"
                    />

                    {errors[index]?.fromDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[index].fromDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="To"
                      value={item.toDate}
                      onChange={(e) =>
                        handleChange(index, "toDate", e.target.value)
                      }
                      className={inputSmallClass(errors[index]?.toDate)}
                      autoComplete="off"
                    />

                    {errors[index]?.toDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[index].toDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Number of Hours */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Number of Hours <span className="text-red-500">*</span>
                  </label>
                )}

                <input
                  type="number"
                  placeholder="Number of hours"
                  value={item.hours}
                  onChange={(e) =>
                    handleChange(index, "hours", e.target.value)
                  }
                  className={inputClass(errors[index]?.hours)}
                  autoComplete="off"
                />

                {errors[index]?.hours && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[index].hours}
                  </p>
                )}
              </div>

              {/* Conducted / Sponsored By */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Conducted / Sponsored By{" "}
                    <span className="text-red-500">*</span>
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Conducted / Sponsored By"
                  value={item.conductedBy}
                  onChange={(e) =>
                    handleChange(index, "conductedBy", e.target.value)
                  }
                  className={inputClass(errors[index]?.conductedBy)}
                  autoComplete="off"
                />

                {errors[index]?.conductedBy && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[index].conductedBy}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addTraining}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            Add +
          </button>

          {trainings.length > 1 && (
            <button
              type="button"
              onClick={removeTraining}
              className="text-sm font-semibold text-red-600 hover:underline"
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

export default LearningDevelopment;