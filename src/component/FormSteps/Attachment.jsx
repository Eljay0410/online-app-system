import { useState } from "react";

const Attachment = () => {
  const [positionType, setPositionType] = useState("");

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          Position Applied For
        </label>
        <select
          value={positionType}
          onChange={(e) => setPositionType(e.target.value)}
          className="w-full md:w-[420px] h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400"
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
      </div>

      {positionType === "Teacher I" && (
        <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-blue-800">
            If you are applying for Teacher I, you are required to personally
            submit the hard copies of your attachments to the Human Resource Office.
          </p>

          <div>
            <p className="font-semibold mb-2">Required documents:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Unique Application Number (UAN) generated at the review section of this application.
              </li>
              <li>
                Letter of intent addressed to the Schools Division Superintendent (SDS)
                containing the following:
                <div className="pl-5 mt-1 space-y-1">
                  <p>i. Statement of purpose / expression of interest</p>
                  <p>ii. Learning area / subject group they intend to teach, if applicable</p>
                </div>
              </li>
              <li>
                Fully accomplished Personal Data Sheet (PDS) with Work Experience Sheet
                and recent passport-sized or unfiltered digital picture (CS Form No. 212,
                Revised 2025), digitally signed or electronically signed
              </li>
              <li>Photocopy of Voter’s ID and/or any proof of residency</li>
              <li>Photocopy of valid and updated PRC License/ID</li>
              <li>Photocopy of Certificate of Board Rating</li>
              <li>
                Photocopy of scholastic/academic records, such as Transcript of Records
                (TOR) and Diploma, including completion of graduate and post-graduate
                units/degrees, if available
              </li>
              <li>
                Photocopy of duly signed Service Record or Certificate of Employment,
                whichever is applicable
              </li>
              <li>
                Photocopy of latest appointment, for those applying for promotion
              </li>
              <li>
                Photocopy of certificate/s of relevant specialized training or
                professional development programs, if any
              </li>
              <li>
                Photocopy of valid TESDA National Certificate (NC) II and Trainers
                Methodology Certificate (TMC), if applicable
              </li>
              <li>
                Photocopy of required Performance Ratings with at least a Very
                Satisfactory rating.
                <p className="mt-1">
                  Note: The applicant shall submit at most three (3) performance
                  ratings, depending on the performance requirements of the position
                  applied for. The latest performance rating shall cover one (1)
                  complete performance rating period in the current position.
                </p>
              </li>
              <li>
                Checklist of Requirements and Omnibus Sworn Statement on the
                Certification on the Authenticity and Veracity (CAV) of the documents
                submitted, and Data Privacy Consent Form pursuant to RA No. 10173
                (Data Privacy Act of 2012), sworn before a public officer authorized
                to administer oaths pursuant to Section 41 of EO No. 292, as amended
                by RA No. 6733 and further amended by RA No. 10755
              </li>
              <li>
                Other documents as may be required by the HRMPSB, including but not
                limited to a portfolio for the assessment of identified PPST
                non-classroom observable indicators
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
    </div>
  );
};

export default Attachment;