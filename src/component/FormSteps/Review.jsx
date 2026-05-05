import { useState } from "react";

const Review = ({ data, onBack, onSubmit }) => {
  const [uan, setUan] = useState(data?.uan || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLocked, setIsLocked] = useState(Boolean(data?.uan));

  const personalInfo = data?.personalInfo || {};
  const education = data?.educationalBackground || {};
  const eligibility = data?.eligibility || {};
  const learningDevelopment = data?.learningDevelopment || {};
  const jobPosition = data?.jobPosition || {};

  const handleGenerateUAN = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch("http://localhost:5000/generate-uan", {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message || "Failed to generate UAN");
        return;
      }

      setUan(result.uan);
      setIsLocked(true);
    } catch (error) {
      console.error(error);
      alert("Server error while generating UAN");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitApplication = () => {
    if (!uan) {
      alert("Please generate UAN first.");
      return;
    }

    const applicationData = {
      uan,
      personalInfo,
      education,
      eligibility,
      learningDevelopment,
      jobPosition,
    };

    console.log("Submitted Application:", applicationData);

    if (onSubmit) {
      onSubmit(applicationData);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            #print-section,
            #print-section * {
              visibility: visible;
            }

            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              color: black;
              background: white;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div id="print-section" className="space-y-8">
        <p className="text-slate-600">
          Please review all the information before submitting your application.
        </p>

        

        {uan && (
          <>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-slate-600">
                Unique Application Number
              </p>
              <p className="text-2xl font-bold tracking-widest text-green-700">
                {uan}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              🔒 Your application is now locked. You can no longer edit your
              data. Please proceed to submit your application.
            </div>
          </>
        )}

        {/* PERSONAL INFO */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Personal Information
          </h2>
          <div className="border-b border-slate-300" />

          <div className="text-sm text-slate-700 space-y-1">
            <p>
              <strong>Name:</strong> {personalInfo.firstName}{" "}
              {personalInfo.middleName} {personalInfo.lastName}{" "}
              {personalInfo.suffix}
            </p>
            <p>
              <strong>Address:</strong> {personalInfo.address}
            </p>
            <p>
              <strong>Contact Number:</strong> {personalInfo.contactNumber}
            </p>
            <p>
              <strong>Email:</strong> {personalInfo.emailAddress}
            </p>
            <p>
              <strong>Date of Birth:</strong> {personalInfo.dob}
            </p>
            <p>
              <strong>Age:</strong> {personalInfo.age}
            </p>
            <p>
              <strong>Sex:</strong> {personalInfo.sex}
            </p>
            <p>
              <strong>Civil Status:</strong> {personalInfo.civilStatus}
            </p>
            <p>
              <strong>Nationality:</strong> {personalInfo.nationality}
            </p>
            <p>
              <strong>Religion:</strong> {personalInfo.religion}
            </p>
            <p>
              <strong>Ethnic Group:</strong> {personalInfo.ethnicGroup}
            </p>
            <p>
              <strong>Disability:</strong> {personalInfo.disability}
            </p>
          </div>
        </div>

        {/* EDUCATION */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Educational Background
          </h2>
          <div className="border-b border-slate-300" />

          <h3 className="text-sm font-semibold text-slate-800">
            Bachelor&apos;s Degree
          </h3>

          {education.bachelors?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>School:</strong> {item.school}
              </p>
              <p>
                <strong>Course:</strong> {item.course}
              </p>
              <p>
                <strong>Year Graduated:</strong> {item.year}
              </p>
              <p>
                <strong>Award:</strong> {item.award || "N/A"}
              </p>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-800 pt-3">
            Post Graduate Degree
          </h3>

          {education.postGraduate?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>School:</strong> {item.school || "N/A"}
              </p>
              <p>
                <strong>Course:</strong> {item.course || "N/A"}
              </p>
              <p>
                <strong>Year Graduated:</strong> {item.year || "N/A"}
              </p>
              <p>
                <strong>Award:</strong> {item.award || "N/A"}
              </p>
            </div>
          ))}
        </div>

        {/* ELIGIBILITY */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">Eligibility</h2>
          <div className="border-b border-slate-300" />

          {eligibility.eligibilities?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>Type:</strong> {item.type}
              </p>
              <p>
                <strong>Rating:</strong> {item.rating}
              </p>
              <p>
                <strong>Date of Examination:</strong> {item.examDate}
              </p>
              <p>
                <strong>License Number:</strong>{" "}
                {item.licenseNumber || "N/A"}
              </p>
              <p>
                <strong>Valid Until:</strong> {item.validUntil || "N/A"}
              </p>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-800 pt-3">
            Work Experience
          </h3>

          {eligibility.workExperiences?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>Position:</strong> {item.position}
              </p>
              <p>
                <strong>Agency / Office:</strong> {item.agency}
              </p>
              <p>
                <strong>Status:</strong> {item.status}
              </p>
              <p>
                <strong>Inclusive Date:</strong> {item.fromYear} -{" "}
                {item.toYear}
              </p>
            </div>
          ))}
        </div>

        {/* LEARNING DEVELOPMENT */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Learning & Development
          </h2>
          <div className="border-b border-slate-300" />

          {learningDevelopment.trainings?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p>
                <strong>Title:</strong> {item.title}
              </p>
              <p>
                <strong>Inclusive Date:</strong> {item.fromDate} -{" "}
                {item.toDate}
              </p>
              <p>
                <strong>Hours:</strong> {item.hours}
              </p>
              <p>
                <strong>Conducted By:</strong> {item.conductedBy}
              </p>
            </div>
          ))}
        </div>

        {/* JOB POSITION & ATTACHMENTS */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Job Position & Attachments
          </h2>
          <div className="border-b border-slate-300" />

          <div className="text-sm text-slate-700 space-y-2">
            <p>
              <strong>Position Applied For:</strong>{" "}
              {jobPosition.positionType || "N/A"}
            </p>

            {jobPosition.positionType === "Teacher I" && (
              <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
                <p className="font-semibold text-blue-800">
                  If you are applying for Teacher I, you are required to
                  personally submit the hard copies of your attachments to the
                  Human Resource Office.
                </p>

                <div>
                  <p className="font-semibold mb-2">Required documents:</p>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>
                      Unique Application Number (UAN) generated at the review
                      section.
                    </li>
                    <li>
                      Letter of intent addressed to the Schools Division
                      Superintendent.
                    </li>
                    <li>Fully accomplished Personal Data Sheet (PDS).</li>
                    <li>
                      Photocopy of Voter’s ID and/or any proof of residency.
                    </li>
                    <li>Photocopy of valid and updated PRC License/ID.</li>
                    <li>Photocopy of Certificate of Board Rating.</li>
                    <li>Photocopy of Transcript of Records and Diploma.</li>
                    <li>
                      Photocopy of Service Record or Certificate of Employment.
                    </li>
                    <li>Photocopy of latest appointment, if applicable.</li>
                    <li>Photocopy of relevant training certificates, if any.</li>
                    <li>Photocopy of TESDA NC II and TMC, if applicable.</li>
                    <li>Photocopy of required Performance Ratings.</li>
                    <li>
                      Checklist of Requirements and Omnibus Sworn Statement.
                    </li>
                    <li>Other documents as may be required by the HRMPSB.</li>
                  </ol>
                </div>
              </div>
            )}

            <div>
              <p className="font-semibold text-slate-800">Attached Files:</p>

              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Transcript of Records:</strong>{" "}
                  {jobPosition.files?.tor?.name || "Not uploaded"}
                </li>
                <li>
                  <strong>Diploma:</strong>{" "}
                  {jobPosition.files?.diploma?.name || "Not uploaded"}
                </li>
                <li>
                  <strong>Certificate of Employment:</strong>{" "}
                  {jobPosition.files?.coe?.name || "Not uploaded"}
                </li>
                <li>
                  <strong>PRC License / Eligibility:</strong>{" "}
                  {jobPosition.files?.prc?.name || "Not uploaded"}
                </li>
              </ul>
            </div>
          </div>
        </div>

        

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          ⚠️ Once you generate your Unique Application Number (UAN), you will no
          longer be able to go back and edit your information. Please make sure
          all details are correct before proceeding.
        </div>
      </div>

      {/* BUTTONS */}
      <div className="no-print flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isLocked}
          className={`px-6 py-2 border-2 rounded-xl font-bold transition-all ${
            isLocked
              ? "border-gray-300 text-gray-400 cursor-not-allowed"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Print
          </button>

          {!uan ? (
            <button
              type="button"
              onClick={handleGenerateUAN}
              disabled={isGenerating}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-60"
            >
              {isGenerating ? "Generating..." : "Generate UAN"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApplication}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;