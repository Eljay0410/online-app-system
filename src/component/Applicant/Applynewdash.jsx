import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Applynewdash() {
  // Example logged-in applicant data
  // Later, pwede ito manggaling sa database / API / localStorage / auth context
  const loggedInUser = {
    firstName: "Juan",
    middleName: "Santos",
    lastName: "Dela Cruz",
    email: "juan.delacruz@gmail.com",
    phone: "09171234567",
    address: "San Jose del Monte, Bulacan",
    birthDate: "2000-05-15",
    gender: "Male",
  };

  const [personalInfo, setPersonalInfo] = useState({
    firstName: loggedInUser.firstName,
    middleName: loggedInUser.middleName,
    lastName: loggedInUser.lastName,
    email: loggedInUser.email,
    phone: loggedInUser.phone,
    address: loggedInUser.address,
    birthDate: loggedInUser.birthDate,
    gender: loggedInUser.gender,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setPersonalInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitted application:", personalInfo);

    // dito mo na isasama yung submit to database / backend
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-blue-900">
              Application Form
            </h1>

            <p className="text-slate-600 mt-1">
              Your personal information is already filled out. You may still edit it before submitting.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-blue-900">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={personalInfo.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={personalInfo.middleName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={personalInfo.lastName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={personalInfo.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={personalInfo.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={personalInfo.address}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={personalInfo.birthDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={personalInfo.gender}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                to="/applicantdashboard"
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#0056b3] text-white font-medium hover:bg-[#003a78] transition"
              >
                Submit Application
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}