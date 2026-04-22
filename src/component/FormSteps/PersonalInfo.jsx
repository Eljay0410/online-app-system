import { useState } from "react";

const PersonalInfo = () => {
  const [dob, setDob] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState({});

  const [sex, setSex] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [ethnicGroup, setEthnicGroup] = useState("");
  const [religion, setReligion] = useState("");
  const [hasDisability, setHasDisability] = useState("");
  const [disabilityDetails, setDisabilityDetails] = useState("");

  const nationalityOptions = [
    "Afghan",
    "American",
    "Argentine",
    "Australian",
    "Bangladeshi",
    "Brazilian",
    "British",
    "Canadian",
    "Chinese",
    "Filipino",
    "French",
    "German",
    "Indian",
    "Indonesian",
    "Italian",
    "Japanese",
    "Korean",
    "Malaysian",
    "Mexican",
    "Nigerian",
    "Pakistani",
    "Singaporean",
    "Spanish",
    "Thai",
    "Vietnamese",
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

    if (value) {
      setAge(calculateAge(value));
    } else {
      setAge("");
    }
  };

  const handleDisabilityChange = (e) => {
    const value = e.target.value;
    setHasDisability(value);

    if (value === "no") {
      setDisabilityDetails("");
    }
  };

  const validateForm = () => {
    let newErrors = {};
  
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!sex) newErrors.sex = "Sex is required";
    if (!civilStatus) newErrors.civilStatus = "Civil status is required";
    if (!nationality) newErrors.nationality = "Nationality is required";
    if (!ethnicGroup) newErrors.ethnicGroup = "Ethnic group is required";
    if (!religion) newErrors.religion = "Religion is required";
    if (!hasDisability) newErrors.hasDisability = "Please select an option";
  
    if (hasDisability === "yes" && !disabilityDetails) {
      newErrors.disabilityDetails = "Please specify disability";
    }
  
    setErrors(newErrors);
  
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (validateForm()) {
      alert("Form submitted!");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            First Name
          </label>
          <input
            type="text"
            placeholder="First name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.dob && (
            <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
          )}
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Middle Name
          </label>
          <input
            type="text"
            placeholder="Middle name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Last Name
          </label>
          <input
            type="text"
            placeholder="Last name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Suffix */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Suffix (Optional)
          </label>
          <input
            type="text"
            placeholder="Jr., Sr., III"
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Address */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Address
          </label>
          <input
            type="text"
            placeholder="Address"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Contact Number */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Contact Number
          </label>
          <input
            type="text"
            placeholder="Contact Number"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Email Address */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Email Address"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={handleDOBChange}
            max={new Date().toISOString().split("T")[0]}
            required
            className="w-full h-11 px-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-slate-100"
          />
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Sex
          </label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {errors.sex && (
              <p className="text-red-500 text-xs mt-1">{errors.sex}</p>
            )}
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Civil Status */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Civil Status
          </label>
          <select
            value={civilStatus}
            onChange={(e) => setCivilStatus(e.target.value)}
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
            <option value="divorced">Divorced</option>
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Nationality
          </label>
          <input
            type="text"
            list="nationality-options"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Type or select nationality"
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nationality && (
          <p className="text-red-500 text-xs mt-1">{errors.nationality}</p>
          )}
          <datalist id="nationality-options">
            {nationalityOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        {/* Ethnic Group */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Ethnic Group
          </label>
          <input
            type="text"
            list="ethnic-group-options"
            value={ethnicGroup}
            onChange={(e) => setEthnicGroup(e.target.value)}
            placeholder="Type or select ethnic group"
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="ethnic-group-options">
            {ethnicGroupOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        {/* Religion */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Religion
          </label>
          <input
            type="text"
            list="religion-options"
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            placeholder="Type or select religion"
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.disabilityDetails && (
            <p className="text-red-500 text-xs mt-1">
              {errors.disabilityDetails}
            </p>
          )}
          <datalist id="religion-options">
            {religionOptions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        {/* Disabilities */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Do you have any disabilities?
          </label>
          <select
            value={hasDisability}
            onChange={handleDisabilityChange}
            required
            className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {hasDisability === "yes" && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Please specify disability
            </label>
            <input
              type="text"
              value={disabilityDetails}
              onChange={(e) => setDisabilityDetails(e.target.value)}
              placeholder="Enter disability details"
              required
              className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <p className="text-slate-500">
        Ito ang section para sa Personal Information...
      </p>
    </div>
  );
};

export default PersonalInfo;