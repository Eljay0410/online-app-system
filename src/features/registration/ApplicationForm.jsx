import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  MailCheck,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
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
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^09\d{9}$/.test(contactNumber)) {
      newErrors.contactNumber =
        "Contact number must start with 09 and be exactly 11 digits";
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
      (nationality === "Dual Citizen" || nationality === "Others") &&
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
            <option value="Others">Others</option>
          </select>

          {(nationality === "Dual Citizen" || nationality === "Others") && (
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

const EducationalBackground = ({ data, onChange, onBack, onNext }) => {
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

      <div className="flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
        >
          Back
        </button>

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

const Eligibility = ({ data, onChange, onBack, onNext }) => {
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

      <div className="flex justify-between items-center pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
        >
          Back
        </button>

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

const LearningDevelopment = ({ data, onChange, onBack, onNext }) => {
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

const Attachment = ({ data, onChange, onBack, onNext }) => {
  const teachingRequirements = {
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
                Unique Application Number generated on the review step after
                submitting this application.
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

const emptyText = "N/A";

const Review = ({ data, onBack, onSubmit }) => {
  const [uan, setUan] = useState(data?.uan || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(Boolean(data?.uan));
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
    if (isSubmitting || isLocked) return;

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
      };

      const result = await apiRequest("/api/submit-application", {
        method: "POST",
        body: JSON.stringify(applicationData),
      });

      setUan(result.uan);
      setIsLocked(true);
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
              application, generate your UAN, and lock this form.
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

                  <div className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <ShieldCheck className="h-4 w-4" />
                    Locked
                  </div>
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
            Job Position and Attachments
          </h2>
          <div className="border-b border-slate-300" />
          <p className="text-sm text-slate-700">
            <strong>Position Applied For:</strong>{" "}
            {jobPosition.positionType || jobPosition.positionCategory || emptyText}
          </p>

          {jobPosition.positionType === "Teacher I" && (
            <div className="border-l-4 border-blue-600 pl-4 text-sm text-slate-700">
              <p className="font-semibold text-blue-900">
                Teacher I applicants must personally submit hard copies of
                required attachments to the Human Resource Office. Include the
                generated UAN shown after submission.
              </p>
            </div>
          )}

          <div>
            <p className="font-semibold text-slate-800">Attached Files:</p>
            <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
              {Object.entries(jobPosition.files || {}).map(([key, file]) => (
                <li key={key}>
                  <strong>{key}:</strong> {file?.name || "Not uploaded"}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="border-t border-slate-200 pt-5 text-sm text-amber-800">
          <div className="flex gap-3 rounded-lg bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Once submitted, your application will be locked and can no longer
              be edited. Make sure all details are correct before proceeding.
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

      <div className="no-print flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isLocked || isSubmitting}
          className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-5 py-2.5 text-sm font-bold transition-all ${
            isLocked || isSubmitting
              ? "cursor-not-allowed border-gray-300 text-gray-400"
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={submitApplication}
          disabled={isSubmitting || isLocked}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isLocked ? "Submitted" : "Submit"}
        </button>
      </div>
    </div>
  );
};

import { getStoredUser, storeUser } from "../auth/auth";

const ApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    personalInfo: {},
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
      positionCategory: "",
      positionType: "",
      jobOpeningId: "",
      files: {},
    },
  });

  const storedUser = getStoredUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const selectedJob = location?.state?.job;
    const params = new URLSearchParams(location.search);
    const routeJobId = selectedJob?.id || params.get("jobId") || "";
    const routePosition =
      selectedJob?.title || params.get("position") || "";

    if (storedUser?.role === "applicant" && storedUser.profileComplete) {
      navigate(
        routeJobId ? `/jobs/${routeJobId}` : "/applications",
        { replace: true }
      );
      return;
    }

    if (routeJobId || routePosition) {
      setFormData((prev) => ({
        ...prev,
        jobPosition: {
          ...prev.jobPosition,
          jobOpeningId: routeJobId || prev.jobPosition.jobOpeningId || "",
          positionType:
            routePosition || prev.jobPosition.positionType || "",
        },
      }));
    }

    if (!storedUser) return;

    // Prefill basic account details
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        firstName: storedUser.firstName || prev.personalInfo.firstName || "",
        lastName: storedUser.lastName || prev.personalInfo.lastName || "",
        emailAddress: storedUser.email || prev.personalInfo.emailAddress || "",
      },
    }));

    // If applicant profile exists in localStorage (full contact info), merge it
    try {
      const saved = localStorage.getItem("applicantProfile");
      if (saved) {
        const profile = JSON.parse(saved || "{}");
        setFormData((prev) => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            contactNumber: profile.phone || prev.personalInfo.contactNumber || "",
            address: profile.address || prev.personalInfo.address || "",
            dob: profile.birthDate || prev.personalInfo.dob || "",
            sex: profile.sex || prev.personalInfo.sex || "",
            civilStatus: profile.civilStatus || prev.personalInfo.civilStatus || "",
            nationality: profile.nationality || prev.personalInfo.nationality || "",
            religion: profile.religion || prev.personalInfo.religion || "",
          },
        }));
      }
    } catch (e) {
      // ignore parsing errors
    }
  }, []);

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
    { id: 5, title: "JOB POSITION" },
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
            onBack={() => setCurrentStep(1)}
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
            onBack={() => setCurrentStep(2)}
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
            onBack={() => setCurrentStep(3)}
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
            onBack={() => setCurrentStep(4)}
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
          onBack={() => setCurrentStep(5)}
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

