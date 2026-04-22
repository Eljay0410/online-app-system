const Review = ({
  personalInfo,
  education,
  eligibility,
  learningDevelopment,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <p className="text-slate-600">
        Please review all the information before submitting your application.
      </p>

      {/* ================= PERSONAL INFO ================= */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900">
          Personal Information
        </h2>

        <div className="border-b border-slate-300"></div>

        <div className="text-sm text-slate-700 space-y-1">
          <p><strong>Name:</strong> {personalInfo?.firstName} {personalInfo?.middleName} {personalInfo?.lastName}</p>
          <p><strong>Sex:</strong> {personalInfo?.sex}</p>
          <p><strong>Civil Status:</strong> {personalInfo?.civilStatus}</p>
          <p><strong>Nationality:</strong> {personalInfo?.nationality}</p>
          <p><strong>Religion:</strong> {personalInfo?.religion}</p>
        </div>
      </div>

      {/* ================= EDUCATION ================= */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900">
          Educational Background
        </h2>

        <div className="border-b border-slate-300"></div>

        {education?.bachelors?.map((item, index) => (
          <div key={index} className="text-sm text-slate-700">
            <p><strong>School:</strong> {item.school}</p>
            <p><strong>Course:</strong> {item.course}</p>
            <p><strong>Year:</strong> {item.year}</p>
          </div>
        ))}
      </div>

      {/* ================= ELIGIBILITY ================= */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900">
          Eligibility
        </h2>

        <div className="border-b border-slate-300"></div>

        {eligibility?.map((item, index) => (
          <div key={index} className="text-sm text-slate-700">
            <p><strong>Type:</strong> {item.type}</p>
            <p><strong>Rating:</strong> {item.rating}</p>
            <p><strong>Date:</strong> {item.examDate}</p>
          </div>
        ))}
      </div>

      {/* ================= LEARNING ================= */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-blue-900">
          Learning & Development
        </h2>

        <div className="border-b border-slate-300"></div>

        {learningDevelopment?.map((item, index) => (
          <div key={index} className="text-sm text-slate-700">
            <p><strong>Title:</strong> {item.title}</p>
            <p><strong>Inclusive Date:</strong> {item.fromDate} - {item.toDate}</p>
            <p><strong>Hours:</strong> {item.hours}</p>
          </div>
        ))}
      </div>

      {/* ================= MESSAGE ================= */}
      <div className="mt-6 text-sm text-slate-600 italic">
        After submitting your application, you will receive your unique application number (UAN).
      </div>

      {/* ================= BUTTON ================= */}
      <div className="flex justify-end">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >
          Print
        </button>
      </div>

    </div>
  );
};

export default Review;