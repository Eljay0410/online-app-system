import { useState } from "react";

const EducationalBackground = ({ data, onChange, onBack, onNext }) => {
  const [bachelors, setBachelors] = useState(
    data?.bachelors || [{ school: "", course: "", year: "", award: "" }]
  );

  const [postGraduate, setPostGraduate] = useState(
    data?.postGraduate || [{ school: "", course: "", year: "", award: "" }]
  );

  const [errors, setErrors] = useState({
    bachelors: [],
    postGraduate: [],
  });

  const currentYear = new Date().getFullYear();

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const syncData = (updated) => {
    onChange &&
      onChange({
        bachelors,
        postGraduate,
        ...updated,
      });
  };

  const handleChange = (listName, list, setList, index, field, value) => {
    const updated = [...list];
    updated[index][field] = value;
    setList(updated);

    if (listName === "bachelors") {
      syncData({ bachelors: updated });
    } else {
      syncData({ postGraduate: updated });
    }

    setErrors((prev) => {
      const updatedErrors = { ...prev };
      if (updatedErrors[listName]?.[index]?.[field]) {
        updatedErrors[listName][index][field] = "";
      }
      return updatedErrors;
    });
  };

  const addItem = (listName, list, setList) => {
    const updated = [...list, { school: "", course: "", year: "", award: "" }];
    setList(updated);

    if (listName === "bachelors") {
      syncData({ bachelors: updated });
    } else {
      syncData({ postGraduate: updated });
    }
  };

  const removeItem = (listName, list, setList) => {
    if (list.length > 1) {
      const updated = list.slice(0, -1);
      setList(updated);

      if (listName === "bachelors") {
        syncData({ bachelors: updated });
      } else {
        syncData({ postGraduate: updated });
      }

      setErrors((prev) => ({
        ...prev,
        [listName]: prev[listName].slice(0, -1),
      }));
    }
  };

  const validateList = (list, required = true) => {
    return list.map((item) => {
      const rowErrors = {};

      if (required && !item.school.trim()) {
        rowErrors.school = "School is required";
      }

      if (required && !item.course.trim()) {
        rowErrors.course = "Course is required";
      }

      if (required && !item.year) {
        rowErrors.year = "Year is required";
      } else if (item.year && item.year.length !== 4) {
        rowErrors.year = "Enter 4-digit year";
      } else if (item.year && Number(item.year) > currentYear) {
        rowErrors.year = "Year cannot be in the future";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const bachelorErrors = validateList(bachelors, true);
    const postGraduateErrors = validateList(postGraduate, false);

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

    onNext &&
      onNext({
        bachelors,
        postGraduate,
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">
          Bachelor&apos;s Degree
        </h2>

        {bachelors.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              {index === 0 && (
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  School <span className="text-red-500">*</span>
                </label>
              )}
              <input
                placeholder="School"
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
                  Year <span className="text-red-500">*</span>
                </label>
              )}
              <input
                type="number"
                placeholder="Year"
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
                  Award
                </label>
              )}
              <input
                placeholder="Award"
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
              />
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => addItem("bachelors", bachelors, setBachelors)}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {bachelors.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem("bachelors", bachelors, setBachelors)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700">
          Post Graduate Degree
        </h2>

        {postGraduate.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              {index === 0 && (
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  School
                </label>
              )}
              <input
                placeholder="School"
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
                  Course
                </label>
              )}
              <input
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
                  Year
                </label>
              )}
              <input
                type="number"
                placeholder="Year"
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
                  Award
                </label>
              )}
              <input
                placeholder="Award"
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
              />
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() =>
              addItem("postGraduate", postGraduate, setPostGraduate)
            }
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

export default EducationalBackground;