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

  const inputClass = () =>
    "w-full h-11 px-4 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300";

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

  const removeEligibility = (index) => {
    const updated = eligibilities.filter((_, i) => i !== index);
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

  const removeWorkExperience = (index) => {
    const updated = workExperiences.filter((_, i) => i !== index);
    setWorkExperiences(updated);
    syncData({ workExperiences: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Type
                </label>
                <input
                  value={item.type}
                  onChange={(e) =>
                    handleEligibilityChange(index, "type", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Type"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Rating
                </label>
                <input
                  value={item.rating}
                  onChange={(e) =>
                    handleEligibilityChange(index, "rating", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Rating"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={item.examDate}
                  onChange={(e) =>
                    handleEligibilityChange(index, "examDate", e.target.value)
                  }
                  className={inputClass()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  License Number
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
                  className={inputClass()}
                  placeholder="License Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={item.validUntil}
                  onChange={(e) =>
                    handleEligibilityChange(index, "validUntil", e.target.value)
                  }
                  className={inputClass()}
                />
              </div>
            </div>

            {index > 0 &&  (
              <button
                type="button"
                onClick={() => removeEligibility(index)}
                className="text-red-600 font-semibold text-sm"
              >
                Remove
              </button>
            )}
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
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Position
                </label>
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Agency
                </label>
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
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Status
                </label>
                <input
                  value={item.status}
                  onChange={(e) =>
                    handleWorkChange(index, "status", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Status"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    From
                  </label>
                  <input
                    value={item.fromYear}
                    onChange={(e) =>
                      handleWorkChange(index, "fromYear", e.target.value)
                    }
                    className={inputClass()}
                    placeholder="From"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    To / Present
                  </label>
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

            {index > 0 && (
              <button
                type="button"
                onClick={() => removeWorkExperience(index)}
                className="text-red-600 font-semibold text-sm"
              >
                Remove
              </button>
            )}
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