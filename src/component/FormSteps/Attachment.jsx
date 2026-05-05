import { useState } from "react";

const Attachment = ({ data, onChange, onBack, onNext }) => {
  const [positionType, setPositionType] = useState(data?.positionType || "");
  const [error, setError] = useState("");

  const showAttachments =
    positionType === "Non-Teaching" ||
    [
      "Teacher II",
      "Teacher III",
      "Teacher IV",
      "Teacher V",
      "Teacher VI",
      "Teacher VII",
      "Master Teacher I",
      "Master Teacher II",
      "Master Teacher III",
      "Master Teacher IV",
      "Master Teacher V",
    ].includes(positionType);

  const handlePositionChange = (value) => {
    setPositionType(value);
    setError("");

    onChange &&
      onChange({
        positionType: value,
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!positionType) {
      setError("Position applied for is required");
      return;
    }

    const formData = {
      positionType,
    };

    console.log("Attachment Data:", formData);

    onNext && onNext(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Position Applied For <span className="text-red-500">*</span>
        </label>

        <select
          value={positionType}
          onChange={(e) => handlePositionChange(e.target.value)}
          className={`w-full md:w-[420px] h-11 px-4 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
            error ? "border-red-500" : "border-slate-300"
          }`}
        >
          <option value="">Select position</option>
          <option value="Non-Teaching">Non-Teaching</option>
          <option value="Teacher I">Teacher I</option>
          <option value="Teacher II">Teacher II</option>
          <option value="Teacher III">Teacher III</option>
          <option value="Teacher IV">Teacher IV</option>
          <option value="Teacher V">Teacher V</option>
          <option value="Teacher VI">Teacher VI</option>
          <option value="Teacher VII">Teacher VII</option>
          <option value="Master Teacher I">Master Teacher I</option>
          <option value="Master Teacher II">Master Teacher II</option>
          <option value="Master Teacher III">Master Teacher III</option>
          <option value="Master Teacher IV">Master Teacher IV</option>
          <option value="Master Teacher V">Master Teacher V</option>
        </select>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>

      {positionType === "Teacher I" && (
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-blue-800">
            If you are applying for Teacher I, you are required to personally
            submit the hard copies of your attachments to the Human Resource
            Office.
          </p>

          <div>
            <p className="font-semibold mb-2">Required documents:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Unique Application Number (UAN) generated at the review section.</li>
              <li>Letter of intent addressed to the Schools Division Superintendent.</li>
              <li>Fully accomplished Personal Data Sheet (PDS).</li>
              <li>Photocopy of Voter’s ID and/or any proof of residency.</li>
              <li>Photocopy of valid and updated PRC License/ID.</li>
              <li>Photocopy of Certificate of Board Rating.</li>
              <li>Photocopy of Transcript of Records and Diploma.</li>
              <li>Photocopy of Service Record or Certificate of Employment.</li>
              <li>Photocopy of latest appointment, if applicable.</li>
              <li>Photocopy of relevant training certificates, if any.</li>
              <li>Photocopy of TESDA NC II and TMC, if applicable.</li>
              <li>Photocopy of required Performance Ratings.</li>
              <li>Checklist of Requirements and Omnibus Sworn Statement.</li>
              <li>Other documents as may be required by the HRMPSB.</li>
            </ol>
          </div>
        </div>
      )}

      {showAttachments && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">
            Attachments / Requirements
          </h2>

          <div className="space-y-3">
            <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
              Upload Transcript of Records
            </div>

            <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
              Upload Diploma
            </div>

            <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
              Upload Certificate of Employment
            </div>

            <div className="h-24 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-sm">
              Upload PRC License / Eligibility
            </div>
          </div>

          <p className="text-slate-500 text-sm">
            Please upload the required supporting documents for your selected position.
          </p>
        </div>
      )}

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

export default Attachment;