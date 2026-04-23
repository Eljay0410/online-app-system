import { useState } from "react";

const LearningDevelopment = () => {
  const [trainings, setTrainings] = useState([
    {
      title: "",
      fromDate: "",
      toDate: "",
      hours: "",
      conductedBy: "",
    },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...trainings];
    updated[index][field] = value;
    setTrainings(updated);
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
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">

        {trainings.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
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
                    type="number"
                    placeholder="From"
                    value={item.fromDate}
                    onChange={(e) =>
                      handleChange(index, "fromDate", e.target.value)
                    }
                    className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                  />

                  <input
                    type="number"
                    placeholder="To"
                    value={item.toDate}
                    onChange={(e) =>
                      handleChange(index, "toDate", e.target.value)
                    }
                    className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
                  />
                </div>
              </div>

              {/* Number of Hours */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Number of Hours
                  </label>
                )}
                <input
                  type="number"
                  placeholder="Number of hours"
                  value={item.hours}
                  onChange={(e) =>
                    handleChange(index, "hours", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
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
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
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
    </div>
  );
};

export default LearningDevelopment;