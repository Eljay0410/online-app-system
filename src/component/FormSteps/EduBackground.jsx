import { useState } from "react";

const EducationalBackground = () => {
  const [bachelors, setBachelors] = useState([
    { school: "", course: "", year: "", award: "" },
  ]);

  const [hasPostGraduate, setHasPostGraduate] = useState("no");

  const [additionalDegrees, setAdditionalDegrees] = useState([
    { school: "", course: "", year: "", award: "" },
  ]);

  const handleChange = (list, setList, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setList(updated);
  };

  const addItem = (list, setList) => {
    setList([...list, { school: "", course: "", year: "", award: "" }]);
  };

  const removeItem = (list, setList, index) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Bachelor’s Degree */}
      {bachelors.map((item, index) => (
        <div key={index} className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-700">
            Bachelor&apos;s Degree
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                School
              </label>
              <input
                type="text"
                placeholder="School name"
                value={item.school}
                onChange={(e) =>
                  handleChange(
                    bachelors,
                    setBachelors,
                    index,
                    "school",
                    e.target.value
                  )
                }
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Course
              </label>
              <input
                type="text"
                placeholder="Course"
                value={item.course}
                onChange={(e) =>
                  handleChange(
                    bachelors,
                    setBachelors,
                    index,
                    "course",
                    e.target.value
                  )
                }
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Year Graduated
              </label>
              <input
                type="number"
                placeholder="YYYY"
                value={item.year}
                onChange={(e) =>
                  handleChange(
                    bachelors,
                    setBachelors,
                    index,
                    "year",
                    e.target.value
                  )
                }
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Academic Award
              </label>
              <input
                type="text"
                placeholder="Optional"
                value={item.award}
                onChange={(e) =>
                  handleChange(
                    bachelors,
                    setBachelors,
                    index,
                    "award",
                    e.target.value
                  )
                }
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => addItem(bachelors, setBachelors)}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Add +
            </button>

            {bachelors.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(bachelors, setBachelors, index)}
                className="text-sm font-semibold text-red-600 hover:underline"
              >
                Minus -
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Post Graduate Question */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Do you have a postgraduate degree?
        </label>
        <select
          value={hasPostGraduate}
          onChange={(e) => setHasPostGraduate(e.target.value)}
          className="w-full md:w-[320px] h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      {/* Additional Degrees */}
      {hasPostGraduate === "yes" &&
        additionalDegrees.map((item, index) => (
          <div key={index} className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-700">
             Post Graduate Degree
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  School
                </label>
                <input
                  type="text"
                  placeholder="School name"
                  value={item.school}
                  onChange={(e) =>
                    handleChange(
                      additionalDegrees,
                      setAdditionalDegrees,
                      index,
                      "school",
                      e.target.value
                    )
                  }
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Course
                </label>
                <input
                  type="text"
                  placeholder="Course"
                  value={item.course}
                  onChange={(e) =>
                    handleChange(
                      additionalDegrees,
                      setAdditionalDegrees,
                      index,
                      "course",
                      e.target.value
                    )
                  }
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Year Graduated
                </label>
                <input
                  type="number"
                  placeholder="YYYY"
                  value={item.year}
                  onChange={(e) =>
                    handleChange(
                      additionalDegrees,
                      setAdditionalDegrees,
                      index,
                      "year",
                      e.target.value
                    )
                  }
                  required
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Academic Award
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={item.award}
                  onChange={(e) =>
                    handleChange(
                      additionalDegrees,
                      setAdditionalDegrees,
                      index,
                      "award",
                      e.target.value
                    )
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => addItem(additionalDegrees, setAdditionalDegrees)}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                Add +
              </button>

              {additionalDegrees.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeItem(
                      additionalDegrees,
                      setAdditionalDegrees,
                      index
                    )
                  }
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

export default EducationalBackground;