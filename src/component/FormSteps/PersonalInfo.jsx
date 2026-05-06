import { useState } from "react";

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

export default PersonalInfo;