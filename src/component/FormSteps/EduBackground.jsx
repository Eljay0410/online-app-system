import { useState } from "react";

const EducationalBackground = () => {
  const [bachelors, setBachelors] = useState([
    { school: "", course: "", year: "", award: "" },
  ]);

  const [postGraduate, setPostGraduate] = useState([
    { school: "", course: "", year: "", award: "" },
  ]);

  const [errors, setErrors] = useState({
    bachelors: [],
    postGraduate: [],
  });

  const currentYear = new Date().getFullYear();

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const handleChange = (listName, list, setList, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setList(updated);

    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (updatedErrors[listName]?.[index]?.[field]) {
        updatedErrors[listName][index][field] = "";
      }
      return updatedErrors;
    });
  };

  const addItem = (list, setList) => {
    setList([...list, { school: "", course: "", year: "", award: "" }]);
  };

  const removeItem = (listName, list, setList) => {
    if (list.length > 1) {
      setList(list.slice(0, -1));

      setErrors((prev) => ({
        ...prev,
        [listName]: prev[listName].slice(0, -1),
      }));
    }
  };

  const validateList = (list) => {
    return list.map((item) => {
      const rowErrors = {};

      if (!item.school.trim()) {
        rowErrors.school = "School is required";
      }

      if (!item.course.trim()) {
        rowErrors.course = "Course is required";
      }

      if (!item.year) {
        rowErrors.year = "Year is required";
      } else if (item.year.length !== 4) {
        rowErrors.year = "Enter 4-digit year";
      } else if (Number(item.year) > currentYear) {
        rowErrors.year = "Year cannot be in the future";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const bachelorErrors = validateList(bachelors);
    const postGraduateErrors = validateList(postGraduate);

    setErrors({
      bachelors: bachelorErrors,
      postGraduate: postGraduateErrors,
    });

    const hasBachelorErrors = bachelorErrors.some(
      (row) => Object.keys(row).length > 0
    );

    const hasPostGraduateErrors = postGraduateErrors.some(
      (row) => Object.keys(row).length > 0
    );

    if (hasBachelorErrors || hasPostGraduateErrors) return;

    const formData = {
      bachelors,
      postGraduate,
    };

    console.log("Educational Background Data:", formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Bachelor's Degree */}
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
                    School <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  placeholder="School name"
                  value={item.school}
                  onChange={(e) =>
                    handleChange(
                      "bachelors",
                      bachelors,
                      setBachelors,
                      index,
                      "school",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.bachelors[index]?.school)}
                  autoComplete="off"
                />
                {errors.bachelors[index]?.school && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bachelors[index].school}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Course"
                  value={item.course}
                  onChange={(e) =>
                    handleChange(
                      "bachelors",
                      bachelors,
                      setBachelors,
                      index,
                      "course",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.bachelors[index]?.course)}
                  autoComplete="off"
                />
                {errors.bachelors[index]?.course && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bachelors[index].course}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Year Graduated <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="number"
                  placeholder="YYYY"
                  value={item.year}
                  onChange={(e) =>
                    handleChange(
                      "bachelors",
                      bachelors,
                      setBachelors,
                      index,
                      "year",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.bachelors[index]?.year)}
                  autoComplete="off"
                />
                {errors.bachelors[index]?.year && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bachelors[index].year}
                  </p>
                )}
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
                    handleChange(
                      "bachelors",
                      bachelors,
                      setBachelors,
                      index,
                      "award",
                      e.target.value
                    )
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        ))}

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
              onClick={() =>
                removeItem("bachelors", bachelors, setBachelors)
              }
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Delete Last
            </button>
          )}
        </div>
      </div>

      {/* Post Graduate */}
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
                    School <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  placeholder="School name"
                  value={item.school}
                  onChange={(e) =>
                    handleChange(
                      "postGraduate",
                      postGraduate,
                      setPostGraduate,
                      index,
                      "school",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.postGraduate[index]?.school)}
                  autoComplete="off"
                />
                {errors.postGraduate[index]?.school && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.postGraduate[index].school}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="text"
                  placeholder="Course"
                  value={item.course}
                  onChange={(e) =>
                    handleChange(
                      "postGraduate",
                      postGraduate,
                      setPostGraduate,
                      index,
                      "course",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.postGraduate[index]?.course)}
                  autoComplete="off"
                />
                {errors.postGraduate[index]?.course && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.postGraduate[index].course}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Year Graduated <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="number"
                  placeholder="YYYY"
                  value={item.year}
                  onChange={(e) =>
                    handleChange(
                      "postGraduate",
                      postGraduate,
                      setPostGraduate,
                      index,
                      "year",
                      e.target.value
                    )
                  }
                  className={inputClass(errors.postGraduate[index]?.year)}
                  autoComplete="off"
                />
                {errors.postGraduate[index]?.year && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.postGraduate[index].year}
                  </p>
                )}
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
                    handleChange(
                      "postGraduate",
                      postGraduate,
                      setPostGraduate,
                      index,
                      "award",
                      e.target.value
                    )
                  }
                  className="w-full h-11 px-4 rounded-xl border border-slate-300"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        ))}

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
              onClick={() =>
                removeItem("postGraduate", postGraduate, setPostGraduate)
              }
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Delete Last
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

export default EducationalBackground;