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

  const removeTraining = (index) => {
    const updated = trainings.filter((_, i) => i !== index);
    setTrainings(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-2xl md:text-3xl font-bold text-blue-900 uppercase">
        Learning and Development
      </h1>

      {trainings.map((item, index) => (
        <div key={index} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Title
              </label>
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
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Inclusive Date
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* From Year */}
                <input
                  type="number"
                  placeholder="From"
                  value={item.fromDate}
                  onChange={(e) =>
                    handleChange(index, "fromDate", e.target.value)
                  }
                  className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white 
                  text-slate-700 placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  hover:border-slate-400"
                />

                {/* To Year */}
                <input
                  type="number"
                  placeholder="To"
                  value={item.toDate}
                  onChange={(e) =>
                    handleChange(index, "toDate", e.target.value)
                  }
                  className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white 
                  text-slate-700 placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                  hover:border-slate-400"
                />
              </div>
            </div>

            {/* Number of Hours */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Number of Hours
              </label>
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
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Conducted / Sponsored By
              </label>
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
                onClick={() => removeTraining(index)}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Minus -
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LearningDevelopment;