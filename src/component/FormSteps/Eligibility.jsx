import { useState } from "react";

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400";

const inputSmallClass =
  "w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400";

const labelClass =
  "block text-sm font-medium text-slate-600 mb-1";

const Eligibility = () => {
  const [eligibilities, setEligibilities] = useState([
    {
      type: "",
      rating: "",
      examDate: "",
      licenseNumber: "",
      validUntil: "",
    },
  ]);

  const [workExperiences, setWorkExperiences] = useState([
    {
      position: "",
      agency: "",
      status: "",
      fromYear: "",
      toYear: "",
    },
  ]);

  const handleEligibilityChange = (index, field, value) => {
    const updated = [...eligibilities];
    updated[index][field] = value;
    setEligibilities(updated);
  };

  const addEligibility = () => {
    setEligibilities([
      ...eligibilities,
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ]);
  };

  const removeEligibility = () => {
    if (eligibilities.length > 1) {
      setEligibilities(eligibilities.slice(0, -1));
    }
  };

  const handleWorkChange = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        position: "",
        agency: "",
        status: "",
        fromYear: "",
        toYear: "",
      },
    ]);
  };

  const removeWorkExperience = () => {
    if (workExperiences.length > 1) {
      setWorkExperiences(workExperiences.slice(0, -1));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

      {/* ================= Eligibility ================= */}
      <div className="space-y-4">  

        {eligibilities.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

              <div>
                {index === 0 && <label className={labelClass}>Type</label>}
                <input type="text" value={item.type}
                  onChange={(e) => handleEligibilityChange(index, "type", e.target.value)}
                  placeholder="Type" className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Rating</label>}
                <input type="text" value={item.rating}
                  onChange={(e) => handleEligibilityChange(index, "rating", e.target.value)}
                  placeholder="Rating" className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Date of Examination</label>}
                <input type="date" value={item.examDate}
                  onChange={(e) => handleEligibilityChange(index, "examDate", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>License Number</label>}
                <input type="text" value={item.licenseNumber}
                  onChange={(e) => handleEligibilityChange(index, "licenseNumber", e.target.value)}
                  placeholder="If applicable" className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Valid Until</label>}
                <input type="date" value={item.validUntil}
                  onChange={(e) => handleEligibilityChange(index, "validUntil", e.target.value)}
                  className={inputClass}
                />
              </div>

            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button type="button" onClick={addEligibility} className="text-blue-700 font-semibold">
            Add +
          </button>

          {eligibilities.length > 1 && (
            <button type="button" onClick={removeEligibility} className="text-red-600 font-semibold">
              Remove Last
            </button>
          )}
        </div>
      </div>

      {/* ================= Work Experience ================= */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-1xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

              <div>
                {index === 0 && <label className={labelClass}>Position / Title</label>}
                <input type="text" value={item.position}
                  onChange={(e) => handleWorkChange(index, "position", e.target.value)}
                  placeholder="Position" className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Agency / Office</label>}
                <input type="text" value={item.agency}
                  onChange={(e) => handleWorkChange(index, "agency", e.target.value)}
                  placeholder="Agency" className={inputClass}
                />
              </div>

              <div>
                {index === 0 && <label className={labelClass}>Status</label>}
                <input type="text" value={item.status}
                  onChange={(e) => handleWorkChange(index, "status", e.target.value)}
                  placeholder="Status" className={inputClass}
                />
              </div>

              {/* Inclusive Date */}
              <div>
                {index === 0 && <label className={labelClass}>Inclusive Date</label>}

                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="From"
                    value={item.fromYear}
                    onChange={(e) => handleWorkChange(index, "fromYear", e.target.value)}
                    className={inputSmallClass}
                  />

                  <input type="text" placeholder="To / Present"
                    value={item.toYear}
                    onChange={(e) => handleWorkChange(index, "toYear", e.target.value)}
                    className={inputSmallClass}
                  />
                </div>
              </div>

            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button type="button" onClick={addWorkExperience} className="text-blue-700 font-semibold">
            Add +
          </button>

          {workExperiences.length > 1 && (
            <button type="button" onClick={removeWorkExperience} className="text-red-600 font-semibold">
              Remove Last
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Eligibility;