import { useState } from "react";

const Attachment = ({ data, onChange, onBack, onNext }) => {
  const [positionType, setPositionType] = useState(data?.positionType || "");
  const [files, setFiles] = useState(
    data?.files || {
      tor: null,
      diploma: null,
      coe: null,
      prc: null,
    }
  );

  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState({});

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

  const syncData = (updated) => {
    onChange &&
      onChange({
        positionType,
        files,
        ...updated,
      });
  };

  const handlePositionChange = (value) => {
    setPositionType(value);
    setError("");
    setFileErrors({});

    const updatedFiles = {
      tor: null,
      diploma: null,
      coe: null,
      prc: null,
    };

    setFiles(updatedFiles);

    syncData({
      positionType: value,
      files: updatedFiles,
    });
  };

  const handleFileChange = (field, file) => {
    const updatedFiles = {
      ...files,
      [field]: file,
    };

    setFiles(updatedFiles);

    setFileErrors((prev) => ({
      ...prev,
      [field]: "",
    }));

    syncData({
      files: updatedFiles,
    });
  };

  const validateFiles = () => {
    const errors = {};

    if (showAttachments) {
      if (!files.tor) errors.tor = "TOR is required";
      if (!files.diploma) errors.diploma = "Diploma is required";
      if (!files.coe) errors.coe = "Certificate of Employment is required";
      if (!files.prc) errors.prc = "PRC License / Eligibility is required";
    }

    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!positionType) {
      setError("Position applied for is required");
      return;
    }

    if (!validateFiles()) return;

    onNext &&
      onNext({
        positionType,
        files,
      });
  };

  const FileUpload = ({ label, field }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>

      <input
        type="file"
        id={field}
        className="hidden"
        onChange={(e) => handleFileChange(field, e.target.files[0] || null)}
      />

      <label
        htmlFor={field}
        className={`flex flex-col items-center justify-center h-24 w-full border-2 border-dashed rounded-xl cursor-pointer transition ${
          fileErrors[field]
            ? "border-red-400 bg-red-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        {!files[field] ? (
          <span className="text-sm text-slate-500">Click to upload file</span>
        ) : (
          <span className="text-sm font-medium text-green-600 text-center px-2">
            Uploaded: {files[field].name}
          </span>
        )}
      </label>

      {fileErrors[field] && (
        <p className="text-xs text-red-500">{fileErrors[field]}</p>
      )}
    </div>
  );

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
              <li>
                Unique Application Number (UAN) generated at the review section.
              </li>
              <li>
                Letter of intent addressed to the Schools Division
                Superintendent.
              </li>
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

          <FileUpload label="Upload Transcript of Records" field="tor" />
          <FileUpload label="Upload Diploma" field="diploma" />
          <FileUpload label="Upload Certificate of Employment" field="coe" />
          <FileUpload label="Upload PRC License / Eligibility" field="prc" />

          <p className="text-slate-500 text-sm">
            Please upload the required supporting documents for your selected
            position.
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