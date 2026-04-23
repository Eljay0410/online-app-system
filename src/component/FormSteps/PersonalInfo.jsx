import { useState } from "react";

const PersonalInfo = ({ onNext }) => {
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState({});

  const [sex, setSex] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalityInput, setNationalityInput] = useState("");
  const [religion, setReligion] = useState("");
  const [religionInput, setReligionInput] = useState("");
  const [ethnicGroup, setEthnicGroup] = useState("");
  const [disability, setDisability] = useState("");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const ethnicGroupOptions = [
    "Not Applicable",
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

  const disabilityOptions = [
    "Not Applicable",
    "Visual Disability",
    "Hearing Disability",
    "Speech Disability",
    "Physical Disability",
    "Psychosocial Disability",
    "Intellectual Disability",
    "Learning Disability",
    "Mental Disability",
    "Others",
  ];

  const finalReligion = religion === "Others" ? religionInput : religion;

  const finalNationality =
    nationality === "Dual Citizen" || nationality === "Others"
      ? `${nationality} - ${nationalityInput}`
      : nationality;

  const inputClass = (fieldName) =>
    `w-full h-11 px-4 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldName] ? "border-red-500" : "border-slate-300"
    }`;

  const selectClass = (fieldName) =>
    `w-full h-11 px-3 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldName] ? "border-red-500" : "border-slate-300"
    }`;

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

  const handleDOBChange = (e) => {
    const value = e.target.value;
    setDob(value);

    if (errors.dob) {
      setErrors((prev) => ({ ...prev, dob: "" }));
    }

    if (value) {
      setAge(calculateAge(value));
    } else {
      setAge("");
    }
  };

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!middleName.trim()) newErrors.middleName = "Middle name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!address.trim()) newErrors.address = "Address is required";

    if (!contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    }

    if (!emailAddress.trim()) {
      newErrors.emailAddress = "Email address is required";
    }

    if (!dob) newErrors.dob = "Date of birth is required";
    if (!sex) newErrors.sex = "Sex is required";
    if (!civilStatus) newErrors.civilStatus = "Civil status is required";

    if (!nationality) {
      newErrors.nationality = "Nationality is required";
    }

    if (
      (nationality === "Dual Citizen" || nationality === "Others") &&
      !nationalityInput.trim()
    ) {
      newErrors.nationality = "Please specify nationality";
    }

    if (!religion) {
      newErrors.religion = "Religion is required";
    }

    if (religion === "Others" && !religionInput.trim()) {
      newErrors.religion = "Please specify religion";
    }

    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = {
      firstName,
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
      nationality: finalNationality,
      religion: finalReligion,
      ethnicGroup,
      disability,
    };

   if (onNext) {
  onNext(formData);
}
  };

  return (
    <form
      onSubmit={handleNext}
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError("firstName");
            }}
            className={inputClass("firstName")}
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Middle Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Middle name"
            value={middleName}
            onChange={(e) => {
              setMiddleName(e.target.value);
              clearFieldError("middleName");
            }}
            className={inputClass("middleName")}
          />
          {errors.middleName && (
            <p className="text-red-500 text-xs mt-1">{errors.middleName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError("lastName");
            }}
            className={inputClass("lastName")}
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* Suffix */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Suffix (Optional)
          </label>
          <input
            type="text"
            placeholder="Jr., Sr., III"
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              clearFieldError("address");
            }}
            className={inputClass("address")}
          />
          {errors.address && (
            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* Contact Number */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Contact Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contact Number"
            value={contactNumber}
            onChange={(e) => {
              setContactNumber(e.target.value);
              clearFieldError("contactNumber");
            }}
            className={inputClass("contactNumber")}
          />
          {errors.contactNumber && (
            <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Email Address"
            value={emailAddress}
            onChange={(e) => {
              setEmailAddress(e.target.value);
              clearFieldError("emailAddress");
            }}
            className={inputClass("emailAddress")}
          />
          {errors.emailAddress && (
            <p className="text-red-500 text-xs mt-1">{errors.emailAddress}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={handleDOBChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full h-11 px-3 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dob ? "border-red-500" : "border-slate-300"
            }`}
          />
          {errors.dob && (
            <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
          )}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Age
          </label>
          <input
            type="text"
            value={age}
            readOnly
            placeholder="Auto"
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 bg-slate-100"
          />
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Sex <span className="text-red-500">*</span>
          </label>
          <select
            value={sex}
            onChange={(e) => {
              setSex(e.target.value);
              clearFieldError("sex");
            }}
            className={selectClass("sex")}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {errors.sex && (
            <p className="text-red-500 text-xs mt-1">{errors.sex}</p>
          )}
        </div>

        {/* Civil Status */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Civil Status <span className="text-red-500">*</span>
          </label>
          <select
            value={civilStatus}
            onChange={(e) => {
              setCivilStatus(e.target.value);
              clearFieldError("civilStatus");
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
          {errors.civilStatus && (
            <p className="text-red-500 text-xs mt-1">{errors.civilStatus}</p>
          )}
        </div>

        {/* Nationality + Religion + Ethnic Group */}
        <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Nationality <span className="text-red-500">*</span>
            </label>
            <select
              value={nationality}
              onChange={(e) => {
                const value = e.target.value;
                setNationality(value);
                clearFieldError("nationality");

                if (value !== "Dual Citizen" && value !== "Others") {
                  setNationalityInput("");
                }
              }}
              className={selectClass("nationality")}
            >
              <option value="">Select</option>
              <option value="Filipino">Filipino</option>
              <option value="Dual Citizen">Dual Citizen</option>
              <option value="Others">Others</option>
            </select>

            {errors.nationality && (
              <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>
            )}

            {(nationality === "Dual Citizen" || nationality === "Others") && (
              <input
                type="text"
                value={nationalityInput}
                onChange={(e) => {
                  setNationalityInput(e.target.value);
                  clearFieldError("nationality");
                }}
                placeholder={
                  nationality === "Dual Citizen"
                    ? "e.g. Filipino-American"
                    : "Specify nationality"
                }
                className={`mt-2 w-full h-11 px-3 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nationality ? "border-red-500" : "border-slate-300"
                }`}
              />
            )}
          </div>

          {/* Religion */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Religion <span className="text-red-500">*</span>
            </label>
            <select
              value={religion}
              onChange={(e) => {
                const value = e.target.value;
                setReligion(value);
                clearFieldError("religion");

                if (value !== "Others") {
                  setReligionInput("");
                }
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

            {errors.religion && (
              <p className="text-red-500 text-xs mt-1">{errors.religion}</p>
            )}

            {religion === "Others" && (
              <input
                type="text"
                value={religionInput}
                onChange={(e) => {
                  setReligionInput(e.target.value);
                  clearFieldError("religion");
                }}
                placeholder="Specify religion"
                className={`mt-2 w-full h-11 px-3 text-sm rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.religion ? "border-red-500" : "border-slate-300"
                }`}
              />
            )}
          </div>

          {/* Ethnic Group */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Ethnic Group 
            </label>
            <select
              value={ethnicGroup}
              onChange={(e) => {
                setEthnicGroup(e.target.value);
                clearFieldError("ethnicGroup");
              }}
              className={selectClass("ethnicGroup")}
            >
              <option value="">Select</option>
              {ethnicGroupOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {errors.ethnicGroup && (
              <p className="text-red-500 text-xs mt-1">{errors.ethnicGroup}</p>
            )}
          </div>
        </div>

        {/* Disability */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Disability 
          </label>
          <select
            value={disability}
            onChange={(e) => {
              setDisability(e.target.value);
              clearFieldError("disability");
            }}
            className={selectClass("disability")}
          >
            <option value="">Select</option>
            {disabilityOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {errors.disability && (
            <p className="text-red-500 text-xs mt-1">{errors.disability}</p>
          )}
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4">
      <p className="text-slate-500">
        Please make sure all the information is correct before proceeding to the
        next step.
      </p>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 rounded-xl bg-[#0056b3] text-white hover:bg-blue-700 transition"
        >
          Next Step
        </button>
        </div>
      </div>
    </form>
  );
};

export default PersonalInfo;