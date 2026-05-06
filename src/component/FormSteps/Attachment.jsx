import { useState } from "react";

const Attachment = ({ data, onChange, onBack, onNext }) => {
  const teachingRequirements = {
    uan: null,
    letterOfIntent: null,
    pds: null,
    residency: null,
    prcLicense: null,
    boardRating: null,
    academicRecord: null,
    serviceRecord: null,
    latestAppointment: null,
    trainingCertificates: null,
    tesdaCertificate: null,
    performanceRating: null,
    cavDataPrivacy: null,
    otherDocuments: null,
  };

  const nonTeachingRequirements = {
    uan: null,
    letterOfIntent: null,
    pds: null,
    residency: null,
    prcLicense: null,
    eligibilityRating: null,
    academicRecord: null,
    trainingCertificates: null,
    employmentCertificate: null,
    latestAppointment: null,
    performanceRating: null,
    cavDataPrivacy: null,
    otherDocuments: null,
  };

  const [positionCategory, setPositionCategory] = useState(
    data?.positionCategory || ""
  );

  const [positionType, setPositionType] = useState(data?.positionType || "");

  const [files, setFiles] = useState(
    data?.files ||
      (data?.positionCategory === "Non-Teaching"
        ? nonTeachingRequirements
        : teachingRequirements)
  );

  const [error, setError] = useState("");
  const [positionError, setPositionError] = useState("");
  const [fileErrors, setFileErrors] = useState({});

  const teachingPositions = [
    "Teacher I",
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
  ];

  const nonTeachingPositions = [
    "Administrative Officer",
    "Administrative Assistant",
    "Administrative Aide",
    "Accounting Clerk",
    "Bookkeeper",
    "Disbursing Officer",
    "Guidance Counselor",
    "Librarian",
    "Nurse",
    "Registrar",
    "School Clerk",
    "Security Guard",
    "Utility Worker",
  ];

  const teacherPromotionPositions = [
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
  ];

  const teacherUploadRequirements = [
    {
      field: "uan",
      label: "Unique Application Number",
      description: "Upload proof/screenshot of generated UAN.",
    },
    {
      field: "letterOfIntent",
      label: "Letter of Intent",
      description:
        "Addressed to the SDS with purpose and learning area/subject group, if applicable.",
    },
    {
      field: "pds",
      label: "Personal Data Sheet",
      description:
        "PDS with Work Experience Sheet and recent picture, digitally/electronically signed.",
    },
    {
      field: "residency",
      label: "Proof of Residency",
      description: "Voter's ID or any proof of residency.",
    },
    {
      field: "prcLicense",
      label: "PRC License / ID",
      description: "Valid and updated PRC License or ID.",
    },
    {
      field: "boardRating",
      label: "Certificate of Board Rating",
      description: "Upload your Certificate of Board Rating.",
    },
    {
      field: "academicRecord",
      label: "Academic Records",
      description:
        "TOR, diploma, graduate or post-graduate units/degrees, if available.",
    },
    {
      field: "serviceRecord",
      label: "Service Record / COE",
      description: "Duly signed Service Record or Certificate of Employment.",
    },
    {
      field: "latestAppointment",
      label: "Latest Appointment",
      description: "For applicants applying for promotion.",
    },
    {
      field: "trainingCertificates",
      label: "Training Certificates",
      description:
        "Relevant specialized trainings or professional development programs, if any.",
    },
    {
      field: "tesdaCertificate",
      label: "TESDA NC II / TMC",
      description: "TESDA National Certificate II or Trainers Methodology Certificate, if applicable.",
    },
    {
      field: "performanceRating",
      label: "Performance Ratings",
      description:
        "Required ratings with at least Very Satisfactory rating.",
    },
    {
      field: "cavDataPrivacy",
      label: "CAV / Omnibus / Data Privacy Form",
      description:
        "Checklist, Omnibus Sworn Statement, CAV, and Data Privacy Consent Form.",
    },
    {
      field: "otherDocuments",
      label: "Other Supporting Documents",
      description:
        "Other HRMPSB requirements, including PPST portfolio, if applicable.",
    },
  ];

  const nonTeachingUploadRequirements = [
    {
      field: "uan",
      label: "Unique Application Number",
      description: "Upload proof/screenshot of generated UAN.",
    },
    {
      field: "letterOfIntent",
      label: "Letter of Intent",
      description: "Addressed to the SDS with purpose and position applied for.",
    },
    {
      field: "pds",
      label: "Personal Data Sheet",
      description: "PDS with Work Experience Sheet and recent picture.",
    },
    {
      field: "residency",
      label: "Proof of Residency",
      description: "Voter's ID or any proof of residency.",
    },
    {
      field: "prcLicense",
      label: "PRC License / ID",
      description: "Valid and updated PRC License or ID, if applicable.",
    },
    {
      field: "eligibilityRating",
      label: "Certificate of Eligibility / Rating",
      description: "Eligibility or rating certificate, if applicable.",
    },
    {
      field: "academicRecord",
      label: "Academic Records",
      description:
        "TOR, diploma, graduate or post-graduate units/degrees, if available.",
    },
    {
      field: "trainingCertificates",
      label: "Training Certificates",
      description: "Relevant certificates of training, if applicable.",
    },
    {
      field: "employmentCertificate",
      label: "Employment / Service Record",
      description: "COE, contract of service, or signed service record.",
    },
    {
      field: "latestAppointment",
      label: "Latest Appointment",
      description: "Photocopy of latest appointment, if applicable.",
    },
    {
      field: "performanceRating",
      label: "Performance Rating",
      description: "Rating for the required/latest rating period, if applicable.",
    },
    {
      field: "cavDataPrivacy",
      label: "CAV / Omnibus / Data Privacy Form",
      description: "Notarized certification and Data Privacy Consent Form.",
    },
    {
      field: "otherDocuments",
      label: "Other Supporting Documents",
      description: "MOVs and other documents required for assessment.",
    },
  ];

  const showPositionList =
    positionCategory === "Teaching" || positionCategory === "Non-Teaching";

  const showAttachments =
    positionCategory === "Non-Teaching"
      ? positionType !== ""
      : teacherPromotionPositions.includes(positionType);

  const currentUploadRequirements =
    positionCategory === "Non-Teaching"
      ? nonTeachingUploadRequirements
      : teacherUploadRequirements;

  const syncData = (updated) => {
    onChange &&
      onChange({
        positionCategory,
        positionType,
        files,
        ...updated,
      });
  };

  const resetFiles = (category) => {
    const updatedFiles =
      category === "Non-Teaching"
        ? { ...nonTeachingRequirements }
        : { ...teachingRequirements };

    setFiles(updatedFiles);
    return updatedFiles;
  };

  const handleCategoryChange = (value) => {
    setPositionCategory(value);
    setPositionType("");
    setError("");
    setPositionError("");
    setFileErrors({});

    const updatedFiles = resetFiles(value);

    syncData({
      positionCategory: value,
      positionType: "",
      files: updatedFiles,
    });
  };

  const handlePositionChange = (value) => {
    setPositionType(value);
    setError("");
    setPositionError("");
    setFileErrors({});

    const updatedFiles = resetFiles(positionCategory);

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

  const handleRemoveFile = (field) => {
    const updatedFiles = {
      ...files,
      [field]: null,
    };

    setFiles(updatedFiles);

    syncData({
      files: updatedFiles,
    });
  };

  const validateFiles = () => {
    const errors = {};

    if (showAttachments) {
      currentUploadRequirements.forEach((requirement) => {
        if (!files[requirement.field]) {
          errors[requirement.field] = `${requirement.label} is required`;
        }
      });
    }

    setFileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!positionCategory) {
      setError("Position applied for is required");
      return;
    }

    if (showPositionList && !positionType) {
      setPositionError("Position is required");
      return;
    }

    if (!validateFiles()) return;

    onNext &&
      onNext({
        positionCategory,
        positionType,
        files,
      });
  };

  const FileUpload = ({ label, description, field }) => (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          {label} <span className="text-red-500">*</span>
        </label>

        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>

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

      {files[field] && (
        <button
          type="button"
          onClick={() => handleRemoveFile(field)}
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          Remove Attachment
        </button>
      )}

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Position Applied For <span className="text-red-500">*</span>
          </label>

          <select
            value={positionCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`w-full h-11 px-4 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
              error ? "border-red-500" : "border-slate-300"
            }`}
          >
            <option value="">Select position type</option>
            <option value="Teaching">Teaching</option>
            <option value="Non-Teaching">Non-Teaching</option>
          </select>

          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        {showPositionList && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              {positionCategory === "Teaching"
                ? "Teaching Position"
                : "Non-Teaching Position"}{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              value={positionType}
              onChange={(e) => handlePositionChange(e.target.value)}
              className={`w-full h-11 px-4 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 ${
                positionError ? "border-red-500" : "border-slate-300"
              }`}
            >
              <option value="">
                {positionCategory === "Teaching"
                  ? "Select teaching position"
                  : "Select non-teaching position"}
              </option>

              {(positionCategory === "Teaching"
                ? teachingPositions
                : nonTeachingPositions
              ).map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>

            {positionError && (
              <p className="text-red-500 text-xs mt-1">{positionError}</p>
            )}
          </div>
        )}
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
                Unique Application Number generated through this link:
                https://tinyurl.com/DepEdCSJDM-UAN
              </li>
              <li>
                Letter of intent addressed to the SDS with statement of purpose
                and learning area/subject group, if applicable.
              </li>
              <li>
                Fully accomplished Personal Data Sheet with Work Experience
                Sheet and recent picture.
              </li>
              <li>Photocopy of Voter's ID and/or proof of residency.</li>
              <li>Photocopy of valid and updated PRC License/ID.</li>
              <li>Photocopy of Certificate of Board Rating.</li>
              <li>Photocopy of TOR and Diploma.</li>
              <li>
                Photocopy of Service Record or Certificate of Employment.
              </li>
              <li>Photocopy of latest appointment, if applicable.</li>
              <li>
                Photocopy of relevant specialized trainings or professional
                development programs, if any.
              </li>
              <li>
                Photocopy of TESDA NC II or Trainers Methodology Certificate, if
                applicable.
              </li>
              <li>
                Photocopy of required Performance Ratings with at least Very
                Satisfactory rating.
              </li>
              <li>
                Checklist of Requirements, Omnibus Sworn Statement, CAV, and
                Data Privacy Consent Form.
              </li>
              <li>
                Other HRMPSB requirements, including PPST portfolio, if
                applicable.
              </li>
            </ol>
          </div>
        </div>
      )}

      {showAttachments && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700">
            Attachments / Requirements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUploadRequirements.map((requirement) => (
              <FileUpload
                key={requirement.field}
                label={requirement.label}
                description={requirement.description}
                field={requirement.field}
              />
            ))}
          </div>

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