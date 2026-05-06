import { useState } from "react";

const LearningDevelopment = ({ data, onChange, onBack, onNext }) => {
  const [trainings, setTrainings] = useState(
    data?.trainings || [
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ]
  );

  const inputClass = () =>
    "w-full h-11 px-4 rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 border-slate-300";

  const inputSmallClass = () =>
    "w-full h-11 px-3 text-sm rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 border-slate-300";

  const syncData = (updatedTrainings) => {
    onChange &&
      onChange({
        trainings: updatedTrainings,
      });
  };

  const handleChange = (index, field, value) => {
    const updated = [...trainings];
    updated[index][field] = value;

    setTrainings(updated);
    syncData(updated);
  };

  const addTraining = () => {
    const updated = [
      ...trainings,
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ];

    setTrainings(updated);
    syncData(updated);
  };

  const removeTraining = () => {
    if (trainings.length > 1) {
      const updated = trainings.slice(0, -1);

      setTrainings(updated);
      syncData(updated);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      trainings,
    };

    console.log("Learning Development Data:", formData);

    onNext && onNext(formData);
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
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_2fr_0.7fr_1.4fr] gap-4">
              {/* Title */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Title
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) =>
                    handleChange(index, "title", e.target.value)
                  }
                  className={inputClass()}
                  autoComplete="off"
                />
              </div>

              {/* Inclusive Date */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Inclusive Date
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={item.fromDate}
                    onChange={(e) =>
                      handleChange(index, "fromDate", e.target.value)
                    }
                    className={inputSmallClass()}
                    autoComplete="off"
                  />

                  <input
                    type="date"
                    value={item.toDate}
                    onChange={(e) =>
                      handleChange(index, "toDate", e.target.value)
                    }
                    className={inputSmallClass()}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Number of Hours */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    No. of Hours
                  </label>
                )}

                <input
                  type="number"
                  placeholder="Hours"
                  value={item.hours}
                  onChange={(e) =>
                    handleChange(index, "hours", e.target.value)
                  }
                  className={inputSmallClass()}
                  autoComplete="off"
                />
              </div>

              {/* Conducted / Sponsored By */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Conducted / Sponsored By
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Conducted / Sponsored By"
                  value={item.conductedBy}
                  onChange={(e) =>
                    handleChange(index, "conductedBy", e.target.value)
                  }
                  className={inputClass()}
                  autoComplete="off"
                />
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
            + Add Row
          </button>

          {trainings.length > 1 && (
            <button
              type="button"
              onClick={removeTraining}
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
          className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          Back
        </button>

        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0056b3] text-white font-bold hover:bg-[#003a78] transition"
        >
          Next Step
        </button>
      </div>
    </form>
  );
};

export default LearningDevelopment;