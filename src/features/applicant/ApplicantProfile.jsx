import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Save,
  Upload,
  User,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { normalizeRole, useAuth } from "../auth/auth";

const emptyProfile = {
  personalInfo: {
    firstName: "",
    middleName: "",
    noMiddleName: false,
    lastName: "",
    contactNumber: "",
    emailAddress: "",
    address: "",
    dob: "",
    sex: "",
    civilStatus: "",
    nationality: "Filipino",
    religion: "",
  },
  applicationDetails: {
    schoolAssignment: "",
    preferredPosition: "",
    highestEducation: "",
    course: "",
    eligibility: "",
    workExperience: "",
    learningDevelopment: "",
    remarks: "",
    completedAt: "",
  },
  uploads: {
    resume: "",
    pds: "",
    tor: "",
    certificate: "",
  },
};

const steps = [
  {
    id: 1,
    title: "Applicant Details",
    caption: "Remaining personal details",
    icon: User,
  },
  {
    id: 2,
    title: "Education",
    caption: "Education, eligibility, work",
    icon: GraduationCap,
  },
  {
    id: 3,
    title: "Position & Uploads",
    caption: "Job preference and files",
    icon: Upload,
  },
  {
    id: 4,
    title: "Review",
    caption: "Confirm and submit",
    icon: FileText,
  },
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "No deadline";

const displayValue = (value) => value || "Not provided";

export default function ApplicantProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [selectedJob, setSelectedJob] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [message, setMessage] = useState("");

  const jobId = searchParams.get("jobId") || "";
  const applicationReady = Boolean(profile.applicationDetails.completedAt);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const result = await apiRequest("/api/applicant/profile");

        if (!isMounted) return;

        const data = result.profile?.data || {};
        const personalInfo = data.personalInfo || {};

        updateUser({
          role: normalizeRole(result.user?.role || "applicant"),
          profileComplete: Boolean(result.profileComplete),
          uan: result.profile?.uan || result.user?.uan,
        });

        setProfile({
          personalInfo: {
            ...emptyProfile.personalInfo,
            ...personalInfo,
            firstName: personalInfo.firstName || result.user?.firstName || "",
            middleName: personalInfo.middleName || result.user?.middleName || "",
            noMiddleName: Boolean(
              personalInfo.noMiddleName ||
                result.user?.noMiddleName
            ),
            lastName: personalInfo.lastName || result.user?.lastName || "",
            contactNumber:
              personalInfo.contactNumber ||
              result.user?.contactNumber ||
              "",
            emailAddress: result.user?.email || personalInfo.emailAddress || "",
          },
          applicationDetails: {
            ...emptyProfile.applicationDetails,
            ...(data.applicationDetails || {}),
          },
          uploads: {
            ...emptyProfile.uploads,
            ...(data.uploads || {}),
          },
        });
      } catch (error) {
        if (isMounted) {
          setMessage(error.message || "Failed to load your profile.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    async function loadJob() {
      if (!jobId) return;

      try {
        const result = await apiRequest(`/api/job-openings/${jobId}`);
        if (isMounted) {
          const job = result.job || null;
          setSelectedJob(job);

          if (job) {
            setProfile((current) => ({
              ...current,
              applicationDetails: {
                ...current.applicationDetails,
                preferredPosition:
                  current.applicationDetails.preferredPosition || job.title || "",
                schoolAssignment:
                  current.applicationDetails.schoolAssignment || job.location || "",
              },
            }));
          }
        }
      } catch {
        if (isMounted) {
          setSelectedJob(null);
        }
      }
    }

    loadProfile().then(loadJob);

    return () => {
      isMounted = false;
    };
  }, [jobId, updateUser]);

  const fullName = useMemo(() => {
    const pieces = [
      profile.personalInfo.firstName,
      profile.personalInfo.noMiddleName ? "" : profile.personalInfo.middleName,
      profile.personalInfo.lastName,
    ].filter(Boolean);

    return pieces.join(" ");
  }, [profile.personalInfo]);

  const setPersonalInfo = (field, value) => {
    setProfile((current) => ({
      ...current,
      personalInfo: {
        ...current.personalInfo,
        [field]: value,
      },
    }));
  };

  const setApplicationDetails = (field, value) => {
    setProfile((current) => ({
      ...current,
      applicationDetails: {
        ...current.applicationDetails,
        [field]: value,
      },
    }));
  };

  const setUpload = (field, file) => {
    setProfile((current) => ({
      ...current,
      uploads: {
        ...current.uploads,
        [field]: file ? file.name : "",
      },
    }));
  };

  const getStepErrors = (stepId) => {
    const errors = [];

    if (stepId === 1) {
      if (!profile.personalInfo.firstName.trim()) errors.push("first name");
      if (!profile.personalInfo.lastName.trim()) errors.push("last name");
      if (!profile.personalInfo.contactNumber.trim()) errors.push("contact number");
      if (!profile.personalInfo.emailAddress.trim()) errors.push("email");
      if (!profile.personalInfo.address.trim()) errors.push("address");
      if (!profile.personalInfo.dob) errors.push("date of birth");
      if (!profile.personalInfo.sex) errors.push("sex");
      if (!profile.personalInfo.civilStatus) errors.push("civil status");
    }

    if (stepId === 2) {
      if (!profile.applicationDetails.highestEducation.trim()) {
        errors.push("highest education");
      }
      if (!profile.applicationDetails.course.trim()) errors.push("course / degree");
      if (!profile.applicationDetails.eligibility.trim()) {
        errors.push("eligibility / license");
      }
    }

    if (stepId === 3) {
      if (!profile.applicationDetails.schoolAssignment.trim()) {
        errors.push("school / location assignment");
      }
      if (!profile.applicationDetails.preferredPosition.trim()) {
        errors.push("preferred position");
      }
      if (!profile.uploads.resume) errors.push("resume");
      if (!profile.uploads.pds) errors.push("PDS");
      if (!profile.uploads.tor) errors.push("TOR / transcript");
    }

    return errors;
  };

  const validateStep = (stepId) => {
    const errors = getStepErrors(stepId);

    if (errors.length > 0) {
      setMessage(`Please complete: ${errors.join(", ")}.`);
      return false;
    }

    setMessage("");
    return true;
  };

  const validateAllSteps = () => {
    for (const step of steps.slice(0, 3)) {
      const errors = getStepErrors(step.id);
      if (errors.length > 0) {
        setCurrentStep(step.id);
        setMessage(`Please complete: ${errors.join(", ")}.`);
        return false;
      }
    }

    setMessage("");
    return true;
  };

  const saveProfile = async (markReady = false) => {
    if (markReady && !validateAllSteps()) return false;

    setIsSaving(true);
    setMessage("");

    try {
      const payload = {
        personalInfo: profile.personalInfo,
        applicationDetails: {
          ...profile.applicationDetails,
          ...(markReady ? { completedAt: new Date().toISOString() } : {}),
        },
        uploads: profile.uploads,
      };

      const result = await apiRequest("/api/applicant/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      updateUser({
        firstName: payload.personalInfo.firstName,
        middleName: payload.personalInfo.middleName,
        noMiddleName: payload.personalInfo.noMiddleName,
        lastName: payload.personalInfo.lastName,
        contactNumber: payload.personalInfo.contactNumber,
        email: payload.personalInfo.emailAddress || user?.email,
        role: "applicant",
        profileComplete: Boolean(result.profileComplete),
        uan: result.uan || result.profile?.uan || user?.uan,
      });

      setProfile({
        personalInfo: {
          ...emptyProfile.personalInfo,
          ...(result.profile?.data?.personalInfo || payload.personalInfo),
        },
        applicationDetails: {
          ...emptyProfile.applicationDetails,
          ...(result.profile?.data?.applicationDetails || payload.applicationDetails),
        },
        uploads: {
          ...emptyProfile.uploads,
          ...(result.profile?.data?.uploads || payload.uploads),
        },
      });

      setMessage(
        markReady
          ? "Profile saved and marked ready for application."
          : "Draft saved successfully."
      );
      return true;
    } catch (error) {
      setMessage(error.message || "Failed to save profile.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  };

  const handleBack = () => {
    setMessage("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handleFinish = async () => {
    const saved = await saveProfile(true);
    if (!saved || !selectedJob) return;

    setIsApplying(true);
    setMessage("");

    try {
      const result = await apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify({ jobOpeningId: selectedJob.id }),
      });

      setMessage(`Application submitted. UAN: ${result.application?.uan || "N/A"}`);
      navigate("/applications", { replace: true });
    } catch (error) {
      setMessage(error.message || "Failed to submit application.");
    } finally {
      setIsApplying(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReadonlyField label="First Name" value={profile.personalInfo.firstName} />
            <ReadonlyField
              label="Middle Name"
              value={
                profile.personalInfo.noMiddleName
                  ? "No middle name"
                  : profile.personalInfo.middleName
              }
            />
            <ReadonlyField label="Last Name" value={profile.personalInfo.lastName} />
            <ReadonlyField label="Contact Number" value={profile.personalInfo.contactNumber} />
            <ReadonlyField label="Email" value={profile.personalInfo.emailAddress} wide />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Address"
                value={profile.personalInfo.address}
                onChange={(value) => setPersonalInfo("address", value)}
                placeholder="Complete address"
              />
            </div>
            <TextField
              label="Date of Birth"
              type="date"
              value={profile.personalInfo.dob}
              onChange={(value) => setPersonalInfo("dob", value)}
            />
            <SelectField
              label="Sex"
              value={profile.personalInfo.sex}
              onChange={(value) => setPersonalInfo("sex", value)}
              options={[
                ["", "Select sex"],
                ["male", "Male"],
                ["female", "Female"],
              ]}
            />
            <SelectField
              label="Civil Status"
              value={profile.personalInfo.civilStatus}
              onChange={(value) => setPersonalInfo("civilStatus", value)}
              options={[
                ["", "Select civil status"],
                ["single", "Single"],
                ["married", "Married"],
                ["widowed", "Widowed"],
                ["separated", "Separated"],
              ]}
            />
            <SelectField
              label="Nationality"
              value={profile.personalInfo.nationality}
              onChange={(value) => setPersonalInfo("nationality", value)}
              options={[
                ["Filipino", "Filipino"],
                ["Dual Citizen", "Dual Citizen"],
                ["Others", "Others"],
              ]}
            />
            <TextField
              label="Religion"
              value={profile.personalInfo.religion}
              onChange={(value) => setPersonalInfo("religion", value)}
              placeholder="Religion"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Highest Education"
            value={profile.applicationDetails.highestEducation}
            onChange={(value) => setApplicationDetails("highestEducation", value)}
            options={[
              ["", "Select highest education"],
              ["Bachelor's Degree", "Bachelor's Degree"],
              ["Master's Degree", "Master's Degree"],
              ["Doctorate Degree", "Doctorate Degree"],
              ["Vocational / TESDA", "Vocational / TESDA"],
              ["Others", "Others"],
            ]}
          />
          <TextField
            label="Course / Degree"
            value={profile.applicationDetails.course}
            onChange={(value) => setApplicationDetails("course", value)}
            placeholder="Course or degree"
          />
          <TextField
            label="Eligibility / License"
            value={profile.applicationDetails.eligibility}
            onChange={(value) => setApplicationDetails("eligibility", value)}
            placeholder="LET, CSC, PRC, or other eligibility"
          />
          <TextArea
            label="Work Experience"
            value={profile.applicationDetails.workExperience}
            onChange={(value) => setApplicationDetails("workExperience", value)}
            placeholder="Relevant role, office/school, dates"
          />
          <div className="sm:col-span-2">
            <TextArea
              label="Learning and Development"
              value={profile.applicationDetails.learningDevelopment}
              onChange={(value) =>
                setApplicationDetails("learningDevelopment", value)
              }
              placeholder="Relevant training, seminars, or certifications"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          {selectedJob && (
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 text-[#0056b3]" />
                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    {selectedJob.title}
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    {selectedJob.location} | Deadline {formatDate(selectedJob.deadline)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="School / Location Assignment"
              value={profile.applicationDetails.schoolAssignment}
              onChange={(value) => setApplicationDetails("schoolAssignment", value)}
              placeholder="Preferred school or location"
            />
            <TextField
              label="Preferred Position"
              value={profile.applicationDetails.preferredPosition}
              onChange={(value) => setApplicationDetails("preferredPosition", value)}
              placeholder="Position applied for"
            />
            <div className="sm:col-span-2">
              <TextArea
                label="Remarks"
                value={profile.applicationDetails.remarks}
                onChange={(value) => setApplicationDetails("remarks", value)}
                placeholder="Optional notes for HR"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FileField
              label="Resume"
              value={profile.uploads.resume}
              onChange={(file) => setUpload("resume", file)}
            />
            <FileField
              label="PDS"
              value={profile.uploads.pds}
              onChange={(file) => setUpload("pds", file)}
            />
            <FileField
              label="TOR / Transcript"
              value={profile.uploads.tor}
              onChange={(file) => setUpload("tor", file)}
            />
            <FileField
              label="Eligibility Certificate"
              value={profile.uploads.certificate}
              onChange={(file) => setUpload("certificate", file)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ReviewSection
          title="Applicant"
          rows={[
            ["Name", fullName],
            ["Email", profile.personalInfo.emailAddress],
            ["Contact", profile.personalInfo.contactNumber],
            ["Address", profile.personalInfo.address],
            ["Date of Birth", profile.personalInfo.dob],
            ["Sex", profile.personalInfo.sex],
            ["Civil Status", profile.personalInfo.civilStatus],
          ]}
        />
        <ReviewSection
          title="Education and Experience"
          rows={[
            ["Highest Education", profile.applicationDetails.highestEducation],
            ["Course / Degree", profile.applicationDetails.course],
            ["Eligibility / License", profile.applicationDetails.eligibility],
            ["Work Experience", profile.applicationDetails.workExperience],
            ["Learning and Development", profile.applicationDetails.learningDevelopment],
          ]}
        />
        <ReviewSection
          title="Position and Uploads"
          rows={[
            ["School / Location", profile.applicationDetails.schoolAssignment],
            ["Preferred Position", profile.applicationDetails.preferredPosition],
            ["Resume", profile.uploads.resume],
            ["PDS", profile.uploads.pds],
            ["TOR / Transcript", profile.uploads.tor],
            ["Eligibility Certificate", profile.uploads.certificate],
          ]}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pt-24">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading applicant profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-24 pb-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#0056b3]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0056b3]">
                Applicant Profile
              </p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                {fullName || user?.email || "Your profile"}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Complete the reduced application form saved to your profile.
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                applicationReady
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {applicationReady ? "Ready for application" : "Profile incomplete"}
            </span>
          </div>
        </section>

        {message && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-28 lg:self-start">
            <div className="flex gap-3 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isDone = currentStep > step.id || applicationReady;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex min-w-[210px] items-center gap-3 rounded-lg border p-3 text-left transition lg:w-full lg:min-w-0 ${
                      isActive
                        ? "border-[#0056b3] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isActive
                          ? "bg-[#0056b3] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {step.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {step.caption}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Step {currentStep} of {steps.length}
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#003a78]">
                  {steps.find((step) => step.id === currentStep)?.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => saveProfile(false)}
                disabled={isSaving || isApplying}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </button>
            </div>

            {renderStepContent()}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || isSaving || isApplying}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving || isApplying}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0056b3] px-5 font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isSaving || isApplying}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-5 font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving || isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : selectedJob ? (
                    <Briefcase className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {selectedJob ? "Save and Apply" : "Mark Ready"}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function ReadonlyField({ label, value, wide = false }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 ${
        wide ? "sm:col-span-2 xl:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
        {displayValue(value)}
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-blue-100"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0056b3] focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function FileField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
      />
      {value && (
        <p className="mt-1 text-xs text-slate-500">
          Selected: <span className="font-medium">{value}</span>
        </p>
      )}
    </label>
  );
}

function ReviewSection({ title, rows }) {
  return (
    <section className="rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <dl className="grid gap-0 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-slate-100 px-4 py-3 last:border-b-0 sm:odd:border-r">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {label}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-800">
              {displayValue(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
