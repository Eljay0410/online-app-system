const Review = ({ data, onBack, onSubmit }) => {
  const personalInfo = data?.personalInfo || {};
  const education = data?.educationalBackground || {};
  const eligibility = data?.eligibility || {};
  const learningDevelopment = data?.learningDevelopment || {};
  const jobPosition = data?.jobPosition || {};

  const handleSubmitApplication = () => {
    const applicationData = {
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
            <p><strong>Address:</strong> {personalInfo.address}</p>
            <p><strong>Contact Number:</strong> {personalInfo.contactNumber}</p>
            <p><strong>Email:</strong> {personalInfo.emailAddress}</p>
            <p><strong>Date of Birth:</strong> {personalInfo.dob}</p>
            <p><strong>Age:</strong> {personalInfo.age}</p>
            <p><strong>Sex:</strong> {personalInfo.sex}</p>
            <p><strong>Civil Status:</strong> {personalInfo.civilStatus}</p>
            <p><strong>Nationality:</strong> {personalInfo.nationality}</p>
            <p><strong>Religion:</strong> {personalInfo.religion}</p>
            <p><strong>Ethnic Group:</strong> {personalInfo.ethnicGroup}</p>
            <p><strong>Disability:</strong> {personalInfo.disability}</p>
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
              <p><strong>School:</strong> {item.school}</p>
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Year Graduated:</strong> {item.year}</p>
              <p><strong>Award:</strong> {item.award}</p>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-800 pt-3">
            Post Graduate Degree
          </h3>

          {education.postGraduate?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p><strong>School:</strong> {item.school}</p>
              <p><strong>Course:</strong> {item.course}</p>
              <p><strong>Year Graduated:</strong> {item.year}</p>
              <p><strong>Award:</strong> {item.award}</p>
            </div>
          ))}
        </div>

        {/* ELIGIBILITY */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">Eligibility</h2>
          <div className="border-b border-slate-300" />

          {eligibility.eligibilities?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p><strong>Type:</strong> {item.type}</p>
              <p><strong>Rating:</strong> {item.rating}</p>
              <p><strong>Date of Examination:</strong> {item.examDate}</p>
              <p><strong>License Number:</strong> {item.licenseNumber}</p>
              <p><strong>Valid Until:</strong> {item.validUntil}</p>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-800 pt-3">
            Work Experience
          </h3>

          {eligibility.workExperiences?.map((item, index) => (
            <div key={index} className="text-sm text-slate-700 space-y-1">
              <p><strong>Position:</strong> {item.position}</p>
              <p><strong>Agency / Office:</strong> {item.agency}</p>
              <p><strong>Status:</strong> {item.status}</p>
              <p>
                <strong>Inclusive Date:</strong> {item.fromYear} - {item.toYear}
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
              <p><strong>Title:</strong> {item.title}</p>
              <p>
                <strong>Inclusive Date:</strong> {item.fromDate} - {item.toDate}
              </p>
              <p><strong>Hours:</strong> {item.hours}</p>
              <p><strong>Conducted By:</strong> {item.conductedBy}</p>
            </div>
          ))}
        </div>

        {/* JOB POSITION */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-blue-900">
            Job Position
          </h2>
          <div className="border-b border-slate-300" />

          <div className="text-sm text-slate-700 space-y-1">
            <p>
              <strong>Position Applied For:</strong> {jobPosition.positionType}
            </p>
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-600 italic">
          After submitting your application, you will receive your unique
          application number (UAN).
        </div>
      </div>

      {/* BUTTONS */}
      <div className="no-print flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
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

          <button
            type="button"
            onClick={handleSubmitApplication}
            className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition"
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default Review;