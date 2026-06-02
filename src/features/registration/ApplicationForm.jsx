import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  MailCheck,
  Loader2,
  Mail,
  Send,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import {
  getApplicationSubmissionRule,
  getFixedApplicationRequirements,
} from "../../lib/applicationRequirements";

const acceptedRequirementFileTypesText =
  ".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx";
const uploadMaxFileSize = 15 * 1024 * 1024;
const maxRequirementFilesPerField = 5;
const maxRequirementUploadBatch = 3;
const acceptedRequirementFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function normalizeRequirementList(
  requirements = [],
  positionCategory = "",
  positionType = ""
) {
  const source =
    Array.isArray(requirements) && requirements.length > 0
      ? requirements
      : getFixedApplicationRequirements(positionCategory, positionType);

  return source
    .map((requirement, index) => {
      const field = String(requirement?.field || "").trim();
      const label = String(requirement?.label || "").trim();

      if (!field && !label) return null;

      return {
        field: field || `requirement_${index + 1}`,
        label: label || field || `Requirement ${index + 1}`,
        description: String(requirement?.description || "").trim(),
        required: requirement?.required !== false,
      };
    })
    .filter(Boolean);
}

function getVacancyRequirements(vacancy, positionCategory = "", positionType = "") {
  return normalizeRequirementList(
    vacancy?.requirements,
    positionCategory,
    positionType
  );
}

function buildRequirementFileMap(
  positionCategory = "",
  positionType = "",
  requirements = []
) {
  return Object.fromEntries(
    normalizeRequirementList(requirements, positionCategory, positionType).map(
      (requirement) => [requirement.field, []]
    )
  );
}

function normalizeRequirementFiles(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function mergeRequirementFiles(current = [], incoming = []) {
  const files = [...normalizeRequirementFiles(current)];

  for (const file of normalizeRequirementFiles(incoming)) {
    if (!files.some((item) => String(item?.id || "") === String(file?.id || ""))) {
      files.push(file);
    }
  }

  return files.slice(0, maxRequirementFilesPerField);
}

function getRequirementFileIds(files = {}) {
  return Object.fromEntries(
    Object.entries(files)
      .map(([field, value]) => [
        field,
        normalizeRequirementFiles(value)
          .map((file) => file?.id)
          .filter(Boolean),
      ])
      .filter(([, fileIds]) => fileIds.length > 0)
  );
}

function inferPositionCategory(positionTitle = "") {
  const normalizedTitle = String(positionTitle || "").toLowerCase();

  if (!normalizedTitle) return "";
  if (normalizedTitle.includes("teacher")) return "Teaching";

  return "Non-Teaching";
}
const PersonalInfo = ({ data = {}, onChange, onNext }) => {
  const [errors, setErrors] = useState({});

  const [firstName, setFirstName] = useState(data.firstName || "");
  const [noMiddleName, setNoMiddleName] = useState(
    data.noMiddleName ?? false
  );
  const [middleName, setMiddleName] = useState(data.middleName || "");
  const [lastName, setLastName] = useState(data.lastName || "");
  const [suffix, setSuffix] = useState(data.suffix || "");
  const [address, setAddress] = useState(data.address || "");
  const [contactNumber, setContactNumber] = useState(data.contactNumber || "");
  const [emailAddress, setEmailAddress] = useState(data.emailAddress || "");
  const [dob, setDob] = useState(data.dob || "");
  const [age, setAge] = useState(data.age || "");
  const [sex, setSex] = useState(data.sex || "");
  const [civilStatus, setCivilStatus] = useState(data.civilStatus || "");
  const [nationality, setNationality] = useState(data.nationality || "");
  const [nationalityInput, setNationalityInput] = useState(
    data.nationalityInput || ""
  );
  const [religion, setReligion] = useState(data.religion || "");
  const [religionInput, setReligionInput] = useState(data.religionInput || "");

  const [hasEthnicGroup, setHasEthnicGroup] = useState(
    data.hasEthnicGroup ?? false
  );
  const [ethnicGroup, setEthnicGroup] = useState(data.ethnicGroup || "");

  const [hasDisability, setHasDisability] = useState(
    data.hasDisability ?? false
  );
  const [disability, setDisability] = useState(data.disability || "");

  const suffixOptions = [
    "Jr.",
    "Sr.",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ];

  const ethnicGroupOptions = [
    "Aeta",
    "Agta",
    "Bajau",
    "Bicolano",
    "Bisaya",
    "Cebuano",
    "Chavacano",
    "Hiligaynon",
    "Ifugao",
    "Igorot",
    "Ilocano",
    "Ivatan",
    "Kapampangan",
    "Lumad",
    "Maguindanaon",
    "Maranao",
    "Pangasinense",
    "Sama",
    "Tagalog",
    "Tausug",
    "Waray",
    "Yakan",
  ];

  const religionOptions = [
    "Roman Catholic",
    "Christian",
    "Islam",
    "Iglesia ni Cristo",
    "Protestant",
    "Born Again Christian",
    "Seventh-day Adventist",
    "Jehovah's Witness",
    "Buddhism",
    "Hinduism",
    "Aglipayan",
    "None",
    "Others",
  ];

  const syncData = (updated) => {
    onChange &&
      onChange({
        firstName,
        noMiddleName,
        middleName,
        lastName,
        suffix,
        address,
        contactNumber,
        emailAddress,
        dob,
        age,
        sex,
        civilStatus,
        nationality,
        nationalityInput,
        religion,
        religionInput,
        hasEthnicGroup,
        ethnicGroup,
        hasDisability,
        disability,
        ...updated,
      });
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let computedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      computedAge--;
    }

    return computedAge;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const inputClass = (fieldName) =>
    `w-full h-11 px-4 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldName] ? "border-red-500" : "border-slate-300"
    }`;

  const selectClass = (fieldName) =>
    `w-full h-11 px-3 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldName] ? "border-red-500" : "border-slate-300"
    }`;

  const errorText = (fieldName) =>
    errors[fieldName] ? (
      <div className="mt-1 flex items-center gap-2 text-xs text-red-500">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold leading-none text-white">
          !
        </span>
        <span>{errors[fieldName]}</span>
      </div>
    ) : null;

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleDOBChange = (e) => {
    const value = e.target.value;
    const computedAge = value ? calculateAge(value) : "";

    setDob(value);
    setAge(computedAge);
    clearFieldError("dob");

    syncData({
      dob: value,
      age: computedAge,
    });
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 11);

    setContactNumber(value);
    clearFieldError("contactNumber");
    syncData({ contactNumber: value });
  };

  const handleNoMiddleNameChange = (e) => {
    const checked = e.target.checked;

    setNoMiddleName(checked);
    clearFieldError("middleName");

    if (checked) {
      setMiddleName("");
      syncData({
        noMiddleName: checked,
        middleName: "",
      });
      return;
    }

    syncData({ noMiddleName: checked });
  };

  const handleHasEthnicGroupChange = (e) => {
    const checked = e.target.checked;

    setHasEthnicGroup(checked);
    clearFieldError("ethnicGroup");

    if (!checked) {
      setEthnicGroup("");
      syncData({
        hasEthnicGroup: checked,
        ethnicGroup: "",
      });
      return;
    }

    syncData({ hasEthnicGroup: checked });
  };

  const handleHasDisabilityChange = (e) => {
    const checked = e.target.checked;

    setHasDisability(checked);
    clearFieldError("disability");

    if (!checked) {
      setDisability("");
      syncData({
        hasDisability: checked,
        disability: "",
      });
      return;
    }

    syncData({ hasDisability: checked });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";

    if (!noMiddleName && !middleName.trim()) {
      newErrors.middleName = "Middle name is required";
    }

    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!address.trim()) newErrors.address = "Address is required";

    if (!contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required.";
    } else if (!/^09\d{9}$/.test(contactNumber)) {
      newErrors.contactNumber =
        "Contact number must start with 09 and be 11 digits.";
    }

    if (!emailAddress.trim()) {
      newErrors.emailAddress = "Email address is required";
    } else if (!isValidEmail(emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email address";
    }

    if (!dob) newErrors.dob = "Date of birth is required";
    if (!sex) newErrors.sex = "Sex is required";
    if (!civilStatus) newErrors.civilStatus = "Civil status is required";
    if (!nationality) newErrors.nationality = "Nationality is required";

    if (
      (nationality === "Dual Citizen" || nationality === "Foreigner") &&
      !nationalityInput.trim()
    ) {
      newErrors.nationality = "Please specify nationality";
    }

    if (!religion) newErrors.religion = "Religion is required";

    if (religion === "Others" && !religionInput.trim()) {
      newErrors.religion = "Please specify religion";
    }

    if (hasEthnicGroup && !ethnicGroup) {
      newErrors.ethnicGroup = "Ethnic group is required";
    }

    if (hasDisability && !disability.trim()) {
      newErrors.disability = "Disability is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const finalData = {
      firstName,
      noMiddleName,
      middleName: noMiddleName ? "" : middleName,
      lastName,
      suffix,
      address,
      contactNumber,
      emailAddress,
      dob,
      age,
      sex,
      civilStatus,
      nationality,
      nationalityInput,
      religion,
      religionInput,
      hasEthnicGroup,
      ethnicGroup: hasEthnicGroup ? ethnicGroup : "",
      hasDisability,
      disability: hasDisability ? disability : "",
    };

    onNext && onNext(finalData);
  };

  return (
    <form onSubmit={handleNext} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError("firstName");
              syncData({ firstName: e.target.value });
            }}
            className={inputClass("firstName")}
            placeholder="First name"
          />
          {errorText("firstName")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Middle Name{" "}
            {!noMiddleName && <span className="text-red-500">*</span>}
          </label>
          <input
            value={middleName}
            disabled={noMiddleName}
            onChange={(e) => {
              setMiddleName(e.target.value);
              clearFieldError("middleName");
              syncData({ middleName: e.target.value });
            }}
            className={`${inputClass("middleName")} ${
              noMiddleName
                ? "bg-slate-100 cursor-not-allowed text-slate-400"
                : ""
            }`}
            placeholder={noMiddleName ? "No middle name" : "Middle name"}
          />
          {errorText("middleName")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError("lastName");
              syncData({ lastName: e.target.value });
            }}
            className={inputClass("lastName")}
            placeholder="Last name"
          />
          {errorText("lastName")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Suffix
          </label>
          <select
            value={suffix}
            onChange={(e) => {
              setSuffix(e.target.value);
              syncData({ suffix: e.target.value });
            }}
            className={selectClass("suffix")}
          >
            <option value="">Not Applicable</option>
            {suffixOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 -mt-4">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <input
              type="checkbox"
              checked={noMiddleName}
              onChange={handleNoMiddleNameChange}
              className="h-4 w-4"
            />
            I don&apos;t have a middle name
          </label>
        </div>

        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearFieldError("address");
              syncData({ address: e.target.value });
            }}
            className={inputClass("address")}
            placeholder="Address"
          />
          {errorText("address")}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            value={contactNumber}
            onChange={handleContactNumberChange}
            className={inputClass("contactNumber")}
            placeholder="09XXXXXXXXX"
            maxLength={11}
            inputMode="numeric"
          />
          {errorText("contactNumber")}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={emailAddress}
            onChange={(e) => {
              setEmailAddress(e.target.value);
              clearFieldError("emailAddress");
              syncData({ emailAddress: e.target.value });
            }}
            className={inputClass("emailAddress")}
            placeholder="Email Address"
          />
          {errorText("emailAddress")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={handleDOBChange}
            max={new Date().toISOString().split("T")[0]}
            className={inputClass("dob")}
          />
          {errorText("dob")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Age
          </label>
          <input
            value={age}
            readOnly
            placeholder="Auto"
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Sex <span className="text-red-500">*</span>
          </label>
          <select
            value={sex}
            onChange={(e) => {
              setSex(e.target.value);
              clearFieldError("sex");
              syncData({ sex: e.target.value });
            }}
            className={selectClass("sex")}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errorText("sex")}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Civil Status <span className="text-red-500">*</span>
          </label>
          <select
            value={civilStatus}
            onChange={(e) => {
              setCivilStatus(e.target.value);
              clearFieldError("civilStatus");
              syncData({ civilStatus: e.target.value });
            }}
            className={selectClass("civilStatus")}
          >
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
            <option value="divorced">Divorced</option>
          </select>
          {errorText("civilStatus")}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Nationality <span className="text-red-500">*</span>
          </label>
          <select
            value={nationality}
            onChange={(e) => {
              setNationality(e.target.value);
              clearFieldError("nationality");
              syncData({ nationality: e.target.value });
            }}
            className={selectClass("nationality")}
          >
            <option value="">Select</option>
            <option value="Filipino">Filipino</option>
            <option value="Dual Citizen">Dual Citizen</option>
            <option value="Foreigner">Foreigner</option>
          </select>

          {(nationality === "Dual Citizen" || nationality === "Foreigner") && (
            <input
              value={nationalityInput}
              onChange={(e) => {
                setNationalityInput(e.target.value);
                clearFieldError("nationality");
                syncData({ nationalityInput: e.target.value });
              }}
              placeholder="Specify nationality"
              className="mt-2 w-full h-11 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {errorText("nationality")}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Religion <span className="text-red-500">*</span>
          </label>
          <select
            value={religion}
            onChange={(e) => {
              setReligion(e.target.value);
              clearFieldError("religion");
              syncData({ religion: e.target.value });
            }}
            className={selectClass("religion")}
          >
            <option value="">Select</option>
            {religionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {religion === "Others" && (
            <input
              value={religionInput}
              onChange={(e) => {
                setReligionInput(e.target.value);
                clearFieldError("religion");
                syncData({ religionInput: e.target.value });
              }}
              placeholder="Specify religion"
              className="mt-2 w-full h-11 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {errorText("religion")}
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
            <input
              type="checkbox"
              checked={hasEthnicGroup}
              onChange={handleHasEthnicGroupChange}
              className="h-4 w-4"
            />
            Do you belong to an ethnic group?
          </label>

          {hasEthnicGroup && (
            <>
              <select
                value={ethnicGroup}
                onChange={(e) => {
                  setEthnicGroup(e.target.value);
                  clearFieldError("ethnicGroup");
                  syncData({ ethnicGroup: e.target.value });
                }}
                className={selectClass("ethnicGroup")}
              >
                <option value="">Select ethnic group</option>
                {ethnicGroupOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              {errorText("ethnicGroup")}
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
            <input
              type="checkbox"
              checked={hasDisability}
              onChange={handleHasDisabilityChange}
              className="h-4 w-4"
            />
            Do you have a disability?
          </label>

          {hasDisability && (
            <>
              <input
                value={disability}
                onChange={(e) => {
                  setDisability(e.target.value);
                  clearFieldError("disability");
                  syncData({ disability: e.target.value });
                }}
                className={inputClass("disability")}
                placeholder="Specify disability"
              />
              {errorText("disability")}
            </>
          )}
        </div>
      </div>

      <div className="mt-10 flex justify-between items-center gap-4">
        <p className="text-slate-500">
          Please make sure all the information is correct before proceeding.
        </p>

        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0056b3] text-white hover:bg-[#003a78] transition"
        >
          Next Step
        </button>
      </div>
    </form>
  );
};

const EducationalBackground = ({ data, onChange, onNext }) => {
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

      <div className="flex justify-end items-center pt-6">
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

const Eligibility = ({ data, onChange, onNext }) => {
  const [eligibilities, setEligibilities] = useState(
    data?.eligibilities || [
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ]
  );

  const [workExperiences, setWorkExperiences] = useState(
    data?.workExperiences || [
      {
        position: "",
        agency: "",
        status: "",
        from: "",
        toYear: "",
      },
    ]
  );

  const [errors, setErrors] = useState({
    eligibilities: [],
  });

  const inputClass = (hasError) =>
    `w-full h-11 px-4 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      hasError ? "border-red-500" : "border-slate-300"
    }`;

  const syncData = (updated) => {
    onChange &&
      onChange({
        eligibilities,
        workExperiences,
        ...updated,
      });
  };

  const handleEligibilityChange = (index, field, value) => {
    const updated = [...eligibilities];
    updated[index][field] = value;
    setEligibilities(updated);
    syncData({ eligibilities: updated });

    setErrors((prev) => {
      const updatedErrors = { ...prev };

      if (updatedErrors.eligibilities?.[index]?.[field]) {
        updatedErrors.eligibilities[index][field] = "";
      }

      return updatedErrors;
    });
  };

  const handleWorkChange = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
    syncData({ workExperiences: updated });
  };

  const addEligibility = () => {
    const updated = [
      ...eligibilities,
      {
        type: "",
        rating: "",
        examDate: "",
        licenseNumber: "",
        validUntil: "",
      },
    ];

    setEligibilities(updated);
    syncData({ eligibilities: updated });
  };

  const removeLastEligibility = () => {
    if (eligibilities.length > 1) {
      const updated = eligibilities.slice(0, -1);
      setEligibilities(updated);
      syncData({ eligibilities: updated });

      setErrors((prev) => ({
        ...prev,
        eligibilities: prev.eligibilities.slice(0, -1),
      }));
    }
  };

  const addWorkExperience = () => {
    const updated = [
      ...workExperiences,
      {
        position: "",
        agency: "",
        status: "",
        from: "",
        toYear: "",
      },
    ];

    setWorkExperiences(updated);
    syncData({ workExperiences: updated });
  };

  const removeLastWorkExperience = () => {
    if (workExperiences.length > 1) {
      const updated = workExperiences.slice(0, -1);
      setWorkExperiences(updated);
      syncData({ workExperiences: updated });
    }
  };

  const validateEligibilities = () => {
    return eligibilities.map((item) => {
      const rowErrors = {};

      if (!item.type.trim()) {
        rowErrors.type = "Type is required";
      }

      if (!item.rating.trim()) {
        rowErrors.rating = "Rating is required";
      } else if (isNaN(Number(item.rating))) {
        rowErrors.rating = "Rating must be a number";
      }

      if (!item.examDate) {
        rowErrors.examDate = "Exam date is required";
      }

      if (!item.licenseNumber.trim()) {
        rowErrors.licenseNumber = "License number is required";
      }

      if (!item.validUntil) {
        rowErrors.validUntil = "Valid until is required";
      }

      if (
        item.examDate &&
        item.validUntil &&
        new Date(item.validUntil) < new Date(item.examDate)
      ) {
        rowErrors.validUntil = "Valid until cannot be before exam date";
      }

      return rowErrors;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const eligibilityErrors = validateEligibilities();

    setErrors({
      eligibilities: eligibilityErrors,
    });

    const hasEligibilityErrors = eligibilityErrors.some(
      (row) => Object.keys(row).length > 0
    );

    if (hasEligibilityErrors) return;

    onNext &&
      onNext({
        eligibilities,
        workExperiences,
      });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        {eligibilities.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  value={item.type}
                  onChange={(e) =>
                    handleEligibilityChange(index, "type", e.target.value)
                  }
                  className={inputClass(errors.eligibilities[index]?.type)}
                  placeholder="Type"
                />
                {errors.eligibilities[index]?.type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].type}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Rating <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  value={item.rating}
                  onChange={(e) =>
                    handleEligibilityChange(index, "rating", e.target.value)
                  }
                  className={inputClass(errors.eligibilities[index]?.rating)}
                  placeholder="Rating"
                />
                {errors.eligibilities[index]?.rating && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].rating}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="date"
                  value={item.examDate}
                  onChange={(e) =>
                    handleEligibilityChange(index, "examDate", e.target.value)
                  }
                  className={inputClass(errors.eligibilities[index]?.examDate)}
                />
                {errors.eligibilities[index]?.examDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].examDate}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    License Number <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  value={item.licenseNumber}
                  onChange={(e) =>
                    handleEligibilityChange(
                      index,
                      "licenseNumber",
                      e.target.value
                    )
                  }
                  className={inputClass(
                    errors.eligibilities[index]?.licenseNumber
                  )}
                  placeholder="License Number"
                />
                {errors.eligibilities[index]?.licenseNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].licenseNumber}
                  </p>
                )}
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                )}
                <input
                  type="date"
                  value={item.validUntil}
                  onChange={(e) =>
                    handleEligibilityChange(index, "validUntil", e.target.value)
                  }
                  className={inputClass(errors.eligibilities[index]?.validUntil)}
                />
                {errors.eligibilities[index]?.validUntil && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.eligibilities[index].validUntil}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addEligibility}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {eligibilities.length > 1 && (
            <button
              type="button"
              onClick={removeLastEligibility}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-blue-900 uppercase">
          Work Experience
        </h2>

        {workExperiences.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Position
                  </label>
                )}
                <input
                  value={item.position}
                  onChange={(e) =>
                    handleWorkChange(index, "position", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Position"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Agency
                  </label>
                )}
                <input
                  value={item.agency}
                  onChange={(e) =>
                    handleWorkChange(index, "agency", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Agency"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Status
                  </label>
                )}
                <input
                  value={item.status}
                  onChange={(e) =>
                    handleWorkChange(index, "status", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="Status"
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    From
                  </label>
                )}
                <input
                  type="month"
                  value={item.from}
                  onChange={(e) =>
                    handleWorkChange(index, "from", e.target.value)
                  }
                  className={inputClass()}
                />
              </div>

              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    To / Present
                  </label>
                )}
                <input
                  value={item.toYear}
                  onChange={(e) =>
                    handleWorkChange(index, "toYear", e.target.value)
                  }
                  className={inputClass()}
                  placeholder="To / Present"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addWorkExperience}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {workExperiences.length > 1 && (
            <button
              type="button"
              onClick={removeLastWorkExperience}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center pt-6">
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

const LearningDevelopment = ({ data, onChange, onNext }) => {
  const [trainings, setTrainings] = useState(
    data?.trainings || [
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ]
  );

  const inputClass = () =>
    "w-full h-11 px-4 rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 border-slate-300";

  const inputSmallClass = () =>
    "w-full h-11 px-3 text-sm rounded-xl border bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 border-slate-300";

  const syncData = (updatedTrainings) => {
    onChange &&
      onChange({
        trainings: updatedTrainings,
      });
  };

  const handleChange = (index, field, value) => {
    const updated = [...trainings];
    updated[index][field] = value;

    setTrainings(updated);
    syncData(updated);
  };

  const addTraining = () => {
    const updated = [
      ...trainings,
      {
        title: "",
        fromDate: "",
        toDate: "",
        hours: "",
        conductedBy: "",
      },
    ];

    setTrainings(updated);
    syncData(updated);
  };

  const removeTraining = () => {
    if (trainings.length > 1) {
      const updated = trainings.slice(0, -1);

      setTrainings(updated);
      syncData(updated);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = {
      trainings,
    };

    console.log("Learning Development Data:", formData);

    onNext && onNext(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="space-y-4">
        {trainings.map((item, index) => (
          <div key={index} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_2fr_0.7fr_1.4fr] gap-4">
              {/* Title */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Title
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Title"
                  value={item.title}
                  onChange={(e) =>
                    handleChange(index, "title", e.target.value)
                  }
                  className={inputClass()}
                  autoComplete="off"
                />
              </div>

              {/* Inclusive Date */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Inclusive Date
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={item.fromDate}
                    onChange={(e) =>
                      handleChange(index, "fromDate", e.target.value)
                    }
                    className={inputSmallClass()}
                    autoComplete="off"
                  />

                  <input
                    type="date"
                    value={item.toDate}
                    onChange={(e) =>
                      handleChange(index, "toDate", e.target.value)
                    }
                    className={inputSmallClass()}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Number of Hours */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    No. of Hours
                  </label>
                )}

                <input
                  type="number"
                  placeholder="Hours"
                  value={item.hours}
                  onChange={(e) =>
                    handleChange(index, "hours", e.target.value)
                  }
                  className={inputSmallClass()}
                  autoComplete="off"
                />
              </div>

              {/* Conducted / Sponsored By */}
              <div>
                {index === 0 && (
                  <label className="block text-sm font-medium text-slate-600 mb-1">
                    Conducted / Sponsored By
                  </label>
                )}

                <input
                  type="text"
                  placeholder="Conducted / Sponsored By"
                  value={item.conductedBy}
                  onChange={(e) =>
                    handleChange(index, "conductedBy", e.target.value)
                  }
                  className={inputClass()}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addTraining}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            + Add Row
          </button>

          {trainings.length > 1 && (
            <button
              type="button"
              onClick={removeTraining}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              - Remove Last
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center pt-6">
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

const Attachment = ({ data, onChange, onNext }) => {
  const selectedJob = data?.selectedJob || {};
  const positionType = data?.positionType || selectedJob.title || "";
  const positionCategory =
    data?.positionCategory ||
    selectedJob.positionCategory ||
    inferPositionCategory(positionType);
  const jobOpeningId = data?.jobOpeningId || selectedJob.id || "";
  const submissionRule = getApplicationSubmissionRule(positionType);
  const requiresPersonalSubmission = submissionRule.requiresPersonalSubmission;
  const currentUploadRequirements = getVacancyRequirements(
    selectedJob,
    positionCategory,
    positionType
  );
  const [files, setFiles] = useState(() => {
    const fileMap = buildRequirementFileMap(
      positionCategory,
      positionType,
      currentUploadRequirements
    );

    for (const [field, value] of Object.entries(data?.files || {})) {
      fileMap[field] = normalizeRequirementFiles(value);
    }

    return fileMap;
  });
  const [uploadingFields, setUploadingFields] = useState({});
  const [error, setError] = useState("");
  const [fileErrors, setFileErrors] = useState({});

  const syncData = (updated) => {
    onChange?.({
      ...(data || {}),
      selectedJob,
      jobOpeningId,
      positionCategory,
      positionType,
      requirements: currentUploadRequirements,
      files,
      personalSubmissionRequired: requiresPersonalSubmission,
      requirementSubmissionMode: requiresPersonalSubmission
        ? "personal"
        : "online",
      ...updated,
    });
  };

  const updateFiles = (updatedFiles) => {
    setFiles(updatedFiles);
    syncData({ files: updatedFiles });
  };

  const validateIncomingFiles = (field, incomingFiles) => {
    const nextErrors = {};

    if (incomingFiles.length > maxRequirementUploadBatch) {
      nextErrors[field] = `Upload up to ${maxRequirementUploadBatch} files at a time.`;
    } else if (
      normalizeRequirementFiles(files[field]).length + incomingFiles.length >
      maxRequirementFilesPerField
    ) {
      nextErrors[field] = `Each requirement can keep up to ${maxRequirementFilesPerField} files.`;
    } else if (incomingFiles.some((file) => file.size > uploadMaxFileSize)) {
      nextErrors[field] = "Please upload files smaller than 15 MB.";
    } else if (
      incomingFiles.some(
        (file) => !acceptedRequirementFileTypes.includes(file.type)
      )
    ) {
      nextErrors[field] = "Upload images, PDFs, TXT, DOC, or DOCX files only.";
    }

    setFileErrors((current) => ({ ...current, ...nextErrors }));
    return !nextErrors[field];
  };

  const handleFileChange = async (requirement, incomingFileList) => {
    const incomingFiles = Array.from(incomingFileList || []).filter(Boolean);

    if (incomingFiles.length === 0) return;
    if (!validateIncomingFiles(requirement.field, incomingFiles)) return;

    setFileErrors((current) => ({ ...current, [requirement.field]: "" }));
    setUploadingFields((current) => ({
      ...current,
      [requirement.field]: true,
    }));

    try {
      const uploadedFiles = [];

      for (const file of incomingFiles) {
        const payload = new FormData();
        payload.append("file", file);
        payload.append("requirementLabel", requirement.label);
        payload.append("positionCategory", positionCategory);
        payload.append("positionTitle", positionType);
        payload.append("positionType", positionType);

        const result = await apiRequest(
          `/api/applicant/requirement-files/${encodeURIComponent(
            requirement.field
          )}`,
          { method: "POST", body: payload }
        );

        uploadedFiles.push(result.file);
      }

      updateFiles({
        ...files,
        [requirement.field]: mergeRequirementFiles(
          files[requirement.field],
          uploadedFiles
        ),
      });
    } catch (uploadError) {
      setFileErrors((current) => ({
        ...current,
        [requirement.field]:
          uploadError.message || "Failed to upload requirement.",
      }));
    } finally {
      setUploadingFields((current) => ({
        ...current,
        [requirement.field]: false,
      }));
    }
  };

  const handleRemoveFile = (field, fileId) => {
    updateFiles({
      ...files,
      [field]: normalizeRequirementFiles(files[field]).filter(
        (file) => String(file.id || file.name) !== String(fileId)
      ),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!jobOpeningId || !positionType) {
      setError("Select a vacancy from the Vacancies page before continuing.");
      return;
    }

    setError("");
    onNext?.({
      ...(data || {}),
      selectedJob,
      jobOpeningId,
      positionCategory,
      positionType,
      requirements: currentUploadRequirements,
      files: requiresPersonalSubmission ? {} : files,
      requirementFiles: requiresPersonalSubmission
        ? {}
        : getRequirementFileIds(files),
      personalSubmissionRequired: requiresPersonalSubmission,
      requirementSubmissionMode: requiresPersonalSubmission
        ? "personal"
        : "online",
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Selected Vacancy
        </p>
        <h3 className="mt-2 break-words text-xl font-bold text-slate-950 [overflow-wrap:anywhere]">
          {positionType || "No vacancy selected"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {positionCategory || "Position category unavailable"}
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {requiresPersonalSubmission ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <p className="font-semibold">{submissionRule.notice?.title}</p>
          <p className="mt-1">
            Documentary requirements for this vacancy must be submitted
            personally to HR/Admin. You may continue your online application
            without uploading files here.
          </p>
        </div>
      ) : currentUploadRequirements.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-700">
              List of Requirements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload available documents for this vacancy. Missing documents
              will not stop submission.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {currentUploadRequirements.map((requirement) => {
              const uploadedFiles = normalizeRequirementFiles(
                files[requirement.field]
              );
              const isUploading = Boolean(uploadingFields[requirement.field]);

              return (
                <div
                  key={requirement.field}
                  className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <label
                      htmlFor={`requirement-${requirement.field}`}
                      className="block text-sm font-semibold text-slate-800"
                    >
                      {requirement.label}
                    </label>
                    {requirement.description && (
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {requirement.description}
                      </p>
                    )}
                  </div>

                  <input
                    type="file"
                    id={`requirement-${requirement.field}`}
                    accept={acceptedRequirementFileTypesText}
                    multiple
                    disabled={isUploading}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200 disabled:opacity-70"
                    onChange={(event) => {
                      handleFileChange(requirement, event.target.files);
                      event.target.value = "";
                    }}
                  />

                  <p className="text-xs leading-5 text-slate-500">
                    Images, PDF, TXT, DOC, or DOCX only. Max{" "}
                    {maxRequirementUploadBatch} files per upload and{" "}
                    {maxRequirementFilesPerField} files per requirement.
                  </p>

                  {isUploading && (
                    <p className="text-xs font-semibold text-blue-700">
                      Uploading...
                    </p>
                  )}

                  {fileErrors[requirement.field] && (
                    <p className="text-xs font-semibold text-red-600">
                      {fileErrors[requirement.field]}
                    </p>
                  )}

                  {uploadedFiles.length > 0 && (
                    <ul className="space-y-2">
                      {uploadedFiles.map((file) => (
                        <li
                          key={file.id || file.name}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 break-words text-slate-700 [overflow-wrap:anywhere]">
                            {file.name || file.originalName || "Uploaded file"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveFile(
                                requirement.field,
                                file.id || file.name
                              )
                            }
                            className="shrink-0 text-xs font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No online upload requirements are configured for this vacancy.
        </p>
      )}

      <div className="flex justify-end items-center pt-6">
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

const emptyText = "N/A";

const Review = ({ data, onSubmit }) => {
  const [uan, setUan] = useState(data?.uan || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState("done");
  const [modalMessage, setModalMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [copyLabel, setCopyLabel] = useState("Copy");

  const personalInfo = data?.personalInfo || {};
  const education = data?.educationalBackground || {};
  const eligibility = data?.eligibility || {};
  const learningDevelopment = data?.learningDevelopment || {};
  const jobPosition = data?.jobPosition || {};
  const submissionRule = getApplicationSubmissionRule(jobPosition.positionType);
  const requiresPersonalSubmission = submissionRule.requiresPersonalSubmission;

  const applicantName =
    [
      personalInfo.firstName,
      personalInfo.middleName,
      personalInfo.lastName,
      personalInfo.suffix,
    ]
      .filter(Boolean)
      .join(" ") || emptyText;
  const uanDisplay = String(uan || "").toUpperCase();

  const submitApplication = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setModalStage("saving");
    setModalMessage("Submitting your application and generating your UAN...");
    setShowModal(true);

    try {
      const applicationData = {
        personalInfo,
        educationalBackground: education,
        eligibility,
        learningDevelopment,
        jobPosition,
        requirementFiles:
          jobPosition.requirementFiles ||
          getRequirementFileIds(jobPosition.files || {}),
      };

      const result = await apiRequest("/api/submit-application", {
        method: "POST",
        body: JSON.stringify(applicationData),
      });

      setUan(result.uan);
      setEmailStatus(
        result.emailSent
          ? `Activation instructions were emailed to ${personalInfo.emailAddress}.`
          : result.emailMessage || "Your application was saved. Email delivery is pending."
      );
      setModalStage("done");
      setModalMessage("Your application has been saved successfully.");
    } catch (error) {
      setModalStage("error");
      setModalMessage(error.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUan = async () => {
    if (!uan) return;

    try {
      await navigator.clipboard.writeText(uanDisplay);
      setCopyLabel("Copied");
      window.setTimeout(() => setCopyLabel("Copy"), 1600);
    } catch {
      setCopyLabel("Copy failed");
      window.setTimeout(() => setCopyLabel("Copy"), 1600);
    }
  };

  const finish = () => {
    setShowModal(false);
    onSubmit?.({
      uan,
      personalInfo,
      educationalBackground: education,
      eligibility,
      learningDevelopment,
      jobPosition,
    });
  };

  const renderList = (items, renderItem) =>
    items?.length ? (
      items.map(renderItem)
    ) : (
      <p className="text-sm text-slate-500">No entries provided.</p>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-section, #print-section * { visibility: visible; }
            #print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 24px;
              color: black;
              background: white;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div id="print-section">
        <div className="space-y-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Application Receipt
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Review your details carefully. Submitting will save the
              application and generate your UAN. Updates after submission will
              only apply to new vacancy applications.
            </p>
          </div>

          {uan && (
            <div className="border-b border-slate-200 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-md bg-blue-50 px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-blue-700 uppercase">UAN</p>
                      <p className="mt-1 text-lg font-bold tracking-widest text-blue-800 break-all">{uanDisplay}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{applicantName || emptyText}</p>
                    <p className="text-xs text-slate-500">{jobPosition.positionType || jobPosition.positionCategory || ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyUan}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Print
                  </button>

                </div>
              </div>
            </div>
          )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">
            Personal Information
          </h2>
          <div className="border-b border-slate-300" />
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <p>
              <strong>Name:</strong> {applicantName}
            </p>
            <p>
              <strong>Email:</strong> {personalInfo.emailAddress || emptyText}
            </p>
            <p>
              <strong>Contact Number:</strong>{" "}
              {personalInfo.contactNumber || emptyText}
            </p>
            <p>
              <strong>Date of Birth:</strong> {personalInfo.dob || emptyText}
            </p>
            <p className="sm:col-span-2">
              <strong>Address:</strong> {personalInfo.address || emptyText}
            </p>
            <p>
              <strong>Age:</strong> {personalInfo.age || emptyText}
            </p>
            <p>
              <strong>Sex:</strong> {personalInfo.sex || emptyText}
            </p>
            <p>
              <strong>Civil Status:</strong>{" "}
              {personalInfo.civilStatus || emptyText}
            </p>
            <p>
              <strong>Nationality:</strong>{" "}
              {personalInfo.nationalityInput ||
                personalInfo.nationality ||
                emptyText}
            </p>
            <p>
              <strong>Religion:</strong>{" "}
              {personalInfo.religionInput || personalInfo.religion || emptyText}
            </p>
            <p>
              <strong>Ethnic Group:</strong>{" "}
              {personalInfo.ethnicGroup || emptyText}
            </p>
            <p>
              <strong>Disability:</strong>{" "}
              {personalInfo.disability || emptyText}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">
            Educational Background
          </h2>
          <div className="border-b border-slate-300" />

          <h3 className="text-sm font-semibold text-slate-800">
            Bachelor's Degree
          </h3>
          <div className="space-y-3">
            {renderList(education.bachelors, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                {item.school || emptyText} - {item.course || emptyText},{" "}
                {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </div>
            ))}
          </div>

          <h3 className="pt-3 text-sm font-semibold text-slate-800">
            Post Graduate Degree
          </h3>
          <div className="space-y-3">
            {renderList(education.postGraduate, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                {item.school || emptyText} - {item.course || emptyText},{" "}
                {item.year || emptyText}
                {item.award ? ` (${item.award})` : ""}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">Eligibility</h2>
          <div className="border-b border-slate-300" />
          <div className="space-y-3">
            {renderList(eligibility.eligibilities, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.type || emptyText}</strong> - Rating{" "}
                {item.rating || emptyText}, Exam{" "}
                {item.examDate || emptyText}, License{" "}
                {item.licenseNumber || emptyText}
              </div>
            ))}
          </div>

          <h3 className="pt-3 text-sm font-semibold text-slate-800">
            Work Experience
          </h3>
          <div className="space-y-3">
            {renderList(eligibility.workExperiences, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.position || emptyText}</strong> -{" "}
                {item.agency || emptyText}, {item.status || emptyText},{" "}
                {item.fromYear || emptyText} to {item.toYear || emptyText}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">
            Learning and Development
          </h2>
          <div className="border-b border-slate-300" />
          <div className="space-y-3">
            {renderList(learningDevelopment.trainings, (item, index) => (
              <div key={index} className="text-sm text-slate-700">
                <strong>{item.title || emptyText}</strong> -{" "}
                {item.fromDate || emptyText} to {item.toDate || emptyText},{" "}
                {item.hours || emptyText} hours,{" "}
                {item.conductedBy || emptyText}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-blue-900">
            Vacancy Position and List of Requirements
          </h2>
          <div className="border-b border-slate-300" />
          <p className="text-sm text-slate-700">
            <strong>Position Applied For:</strong>{" "}
            {jobPosition.positionType || jobPosition.positionCategory || emptyText}
          </p>

          {requiresPersonalSubmission && (
            <div className="border-l-4 border-amber-500 pl-4 text-sm text-slate-700">
              <p className="font-semibold text-amber-900">
                {submissionRule.notice?.title}
              </p>
              <p className="mt-1">{submissionRule.notice?.message}</p>
            </div>
          )}

          {!requiresPersonalSubmission && (
          <div>
            <p className="font-semibold text-slate-800">Attached Files:</p>
            {Object.entries(jobPosition.files || {}).some(
              ([, value]) => normalizeRequirementFiles(value).length > 0
            ) ? (
              <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                {Object.entries(jobPosition.files || {}).map(([key, value]) => {
                  const uploadedFiles = normalizeRequirementFiles(value);

                  if (uploadedFiles.length === 0) return null;

                  return (
                    <li key={key}>
                      <strong>{key}:</strong>{" "}
                      {uploadedFiles
                        .map(
                          (file) =>
                            file?.name || file?.originalName || "Uploaded file"
                        )
                        .join(", ")}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No files uploaded.
              </p>
            )}
          </div>
          )}
        </section>

        <div className="border-t border-slate-200 pt-5 text-sm text-amber-800">
          <div className="flex gap-3 rounded-lg bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Submitting saves a snapshot for this vacancy. Changes you make
              later will only apply to new applications.
            </p>
          </div>
        </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            {modalStage !== "saving" && (
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            {modalStage === "saving" && (
              <div className="flex flex-col items-center px-8 py-16 text-center">
                <Loader2 className="h-14 w-14 animate-spin text-blue-700" />
                <h3 className="mt-6 text-2xl font-extrabold text-slate-950">
                  Submitting application
                </h3>
                <p className="mt-2 text-sm text-slate-500">{modalMessage}</p>
              </div>
            )}

            {modalStage === "error" && (
              <div className="px-8 py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-center text-2xl font-extrabold text-slate-950">
                  Submission failed
                </h3>
                <p className="mt-3 text-center text-sm leading-6 text-slate-500">
                  {modalMessage}
                </p>
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {modalStage === "done" && (
              <div className="px-8 pb-10 pt-12 text-center sm:px-12">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.45)]">
                  <CheckCircle2 className="h-12 w-12" />
                  <span className="absolute -left-8 top-7 h-2 w-2 rounded-full bg-green-300" />
                  <span className="absolute -right-7 top-1 h-2 w-2 rounded-full bg-emerald-200" />
                  <span className="absolute -right-9 bottom-5 h-2 w-2 rounded-full border-2 border-green-400" />
                  <span className="absolute -left-4 -top-1 h-2 w-2 rotate-45 bg-emerald-400" />
                </div>

                <h3 className="mt-8 text-3xl font-extrabold tracking-tight text-slate-950">
                  Application submitted!
                </h3>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Your application has been saved successfully.
                </p>

                <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full items-center justify-center gap-3 rounded-md bg-blue-50 px-3 py-2 sm:w-auto">
                    <div>
                      <p className="text-xs font-semibold uppercase text-blue-700">UAN</p>
                      <p className="text-lg font-bold tracking-widest text-blue-800 break-all">{uanDisplay}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={copyUan}
                        className="inline-flex items-center gap-2 rounded-md border bg-white px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Copy className="h-4 w-4" />
                        {copyLabel === "Copy" ? "Copy" : copyLabel}
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-md border bg-white px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Print
                      </button>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto text-center sm:text-left">
                    <div className="mx-auto inline-flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-700">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <MailCheck className="h-4 w-4" />
                      </div>
                      <p className="leading-5">{emailStatus}</p>
                    </div>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={finish}
                        className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="no-print flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={submitApplication}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit
        </button>
      </div>
    </div>
  );
};

import { getStoredUser } from "../auth/auth";

const ApplicationForm = () => {
  const location = useLocation();
  const storedUser = getStoredUser();
  const selectedJob = location?.state?.job;
  const params = new URLSearchParams(location.search);
  const routeJobId = selectedJob?.id || params.get("jobId") || "";
  const routePosition = selectedJob?.title || params.get("position") || "";
  const routeCategory =
    selectedJob?.positionCategory ||
    params.get("category") ||
    inferPositionCategory(routePosition);
  let savedProfile = {};

  try {
    const saved = localStorage.getItem("applicantProfile");
    savedProfile = saved ? JSON.parse(saved || "{}") : {};
  } catch {
    savedProfile = {};
  }

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState(() => ({
    personalInfo: {
      firstName: storedUser?.firstName || "",
      lastName: storedUser?.lastName || "",
      emailAddress: storedUser?.email || "",
      contactNumber: savedProfile.phone || "",
      address: savedProfile.address || "",
      dob: savedProfile.birthDate || "",
      sex: savedProfile.sex || "",
      civilStatus: savedProfile.civilStatus || "",
      nationality: savedProfile.nationality || "",
      religion: savedProfile.religion || "",
    },
    educationalBackground: {
      bachelors: [{ school: "", course: "", year: "", award: "" }],
      postGraduate: [{ school: "", course: "", year: "", award: "" }],
    },
    eligibility: {
      eligibilities: [
        {
          type: "",
          rating: "",
          examDate: "",
          licenseNumber: "",
          validUntil: "",
        },
      ],
      workExperiences: [
        {
          position: "",
          agency: "",
          status: "",
          fromYear: "",
          toYear: "",
        },
      ],
    },
    learningDevelopment: {
      trainings: [
        { title: "", fromDate: "", toDate: "", hours: "", conductedBy: "" },
      ],
    },
    jobPosition: {
      selectedJob: selectedJob || null,
      positionCategory: routeCategory || "",
      positionType: routePosition || "",
      jobOpeningId: routeJobId || "",
      requirements: getVacancyRequirements(
        selectedJob || {},
        routeCategory,
        routePosition
      ),
      files: buildRequirementFileMap(
        routeCategory,
        routePosition,
        selectedJob?.requirements
      ),
    },
  }));

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const steps = [
    { id: 1, title: "PERSONAL INFORMATION" },
    { id: 2, title: "EDUCATIONAL BACKGROUND" },
    { id: 3, title: "ELIGIBILITY" },
    { id: 4, title: "LEARNING DEVELOPMENT" },
    { id: 5, title: "REQUIREMENTS" },
    { id: 6, title: "REVIEW" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfo
            data={formData.personalInfo}
            onChange={(data) => updateFormData("personalInfo", data)}
            onNext={(data) => {
              updateFormData("personalInfo", data);
              setCurrentStep(2);
            }}
          />
        );

      case 2:
        return (
          <EducationalBackground
            data={formData.educationalBackground}
            onChange={(data) => updateFormData("educationalBackground", data)}
            onNext={(data) => {
              updateFormData("educationalBackground", data);
              setCurrentStep(3);
            }}
          />
        );

      case 3:
        return (
          <Eligibility
            data={formData.eligibility}
            onChange={(data) => updateFormData("eligibility", data)}
            onNext={(data) => {
              updateFormData("eligibility", data);
              setCurrentStep(4);
            }}
          />
        );

      case 4:
        return (
          <LearningDevelopment
            data={formData.learningDevelopment}
            onChange={(data) => updateFormData("learningDevelopment", data)}
            onNext={(data) => {
              updateFormData("learningDevelopment", data);
              setCurrentStep(5);
            }}
          />
        );

      case 5:
        return (
          <Attachment
            data={formData.jobPosition}
            onChange={(data) => updateFormData("jobPosition", data)}
            onNext={(data) => {
              updateFormData("jobPosition", data);
              setCurrentStep(6);
            }}
          />
        );

      case 6:
       return (
        <Review
          data={formData}
          onSubmit={(applicationData) => {
            setFormData((prev) => ({ ...prev, ...applicationData }));
          }}
        />
      );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-12 px-4 font-['Poppins']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-light text-center mb-12 text-slate-800">
          Application <span className="font-bold text-[#0056b3]">Form</span>
        </h1>

        {storedUser && (
          <div className="max-w-3xl mx-auto mb-6 rounded-lg bg-blue-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-800 truncate">
                Signed in as {storedUser.email}
              </p>
              <p className="text-xs text-slate-600">
                Use your account details to prefill the application or continue
                as guest.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    personalInfo: {
                      ...prev.personalInfo,
                      firstName: storedUser.firstName || "",
                      lastName: storedUser.lastName || "",
                      emailAddress: storedUser.email || "",
                    },
                  }));
                  setCurrentStep(2);
                }}
                className="px-4 py-2 rounded-lg bg-[#0056b3] text-white text-sm font-semibold"
              >
                Use Account Details
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-lg border bg-white text-sm font-medium"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-start gap-8 items-start">
          <div className="w-full md:w-64 flex-shrink-0 sticky top-32 self-start mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center justify-end mb-10 relative"
              >
                <span
                  className={`mr-4 text-[10px] md:text-xs font-bold tracking-widest text-right max-w-[150px] ${
                    currentStep >= step.id
                      ? "text-slate-900"
                      : "text-slate-400"
                  }`}
                >
                  {step.title}
                </span>

                <div className="relative z-10">
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-9 h-9 text-green-500 bg-white rounded-full p-0.5" />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${
                        currentStep === step.id
                          ? "border-[#0056b3] text-[#0056b3] bg-white shadow-md"
                          : "border-slate-300 text-slate-400 bg-white"
                      }`}
                    >
                      {step.id}
                    </div>
                  )}
                </div>

                {index !== steps.length - 1 && (
                  <div
                    className={`absolute right-[17px] top-9 w-[1.5px] h-10 ${
                      currentStep > step.id ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 min-h-[500px]">
            <div className="border-l-[1.5px] border-slate-300 pl-10 h-full">
              <h2 className="text-2xl font-bold text-[#003a78] mb-8 tracking-tight uppercase">
                {steps.find((s) => s.id === currentStep)?.title}
              </h2>

              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;

