import { useState } from "react";

const EducationalBackground = () => {
  const [bachelors, setBachelors] = useState([
    { school: "", course: "", year: "", award: "" },
  ]);

  const [postGraduate, setPostGraduate] = useState([
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

  const removeItem = (list, setList) => {
    if (list.length > 1) {
      setList(list.slice(0, -1)); // remove last row only
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ================= Bachelor’s Degree ================= */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">
          Bachelor&apos;s Degree
        </h2>

        {bachelors.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    School
                  </label>
                )}
                <input
                  type="text"
                  placeholder="School name"
                  value={item.school}
                  onChange={(e) =>
                    handleChange(bachelors, setBachelors, index, "school", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Course
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Course"
                  value={item.course}
                  onChange={(e) =>
                    handleChange(bachelors, setBachelors, index, "course", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Year Graduated
                  </label>
                )}
                <input
                  type="number"
                  placeholder="YYYY"
                  value={item.year}
                  onChange={(e) =>
                    handleChange(bachelors, setBachelors, index, "year", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Academic Award
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Optional"
                  value={item.award}
                  onChange={(e) =>
                    handleChange(bachelors, setBachelors, index, "award", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => addItem(bachelors, setBachelors)}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {bachelors.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(bachelors, setBachelors)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
             - Delete last
            </button>
          )}
        </div>
      </div>

      {/* ================= Post Graduate ================= */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">
          Post Graduate Degree
        </h2>

        {postGraduate.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    School
                  </label>
                )}
                <input
                  type="text"
                  placeholder="School name"
                  value={item.school}
                  onChange={(e) =>
                    handleChange(postGraduate, setPostGraduate, index, "school", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Course
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Course"
                  value={item.course}
                  onChange={(e) =>
                    handleChange(postGraduate, setPostGraduate, index, "course", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Year Graduated
                  </label>
                )}
                <input
                  type="number"
                  placeholder="YYYY"
                  value={item.year}
                  onChange={(e) =>
                    handleChange(postGraduate, setPostGraduate, index, "year", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Academic Award
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Optional"
                  value={item.award}
                  onChange={(e) =>
                    handleChange(postGraduate, setPostGraduate, index, "award", e.target.value)
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => addItem(postGraduate, setPostGraduate)}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {postGraduate.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(postGraduate, setPostGraduate)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Delete Last
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EducationalBackground;