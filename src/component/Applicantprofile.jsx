"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

const defaultProfile = {
  firstName: "Juan",
  middleName: "Santos",
  lastName: "Dela Cruz",
  email: "juan.delacruz@email.com",
  phone: "09123456789",
  sex: "Male",
  civilStatus: "Single",
  nationality: "Filipino",
  religion: "Roman Catholic",
  birthDate: "2000-01-01",
  address: "City of San Jose Del Monte, Bulacan",
  applicantNumber: "OAS-2026-0001",
  accountStatus: "Active",
};

export default function ApplicantProfile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [formData, setFormData] = useState(defaultProfile);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem("applicantProfile");

    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setProfile(parsedProfile);
      setFormData(parsedProfile);
    }
  }, []);

  const fullName = useMemo(() => {
    return `${profile.firstName} ${profile.middleName} ${profile.lastName}`;
  }, [profile]);

  const initials = useMemo(() => {
    const firstInitial = profile.firstName?.charAt(0) || "";
    const lastInitial = profile.lastName?.charAt(0) || "";

    return `${firstInitial}${lastInitial}`.toUpperCase();
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setFormData(profile);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    setProfile(formData);
    localStorage.setItem("applicantProfile", JSON.stringify(formData));
    setIsEditing(false);
  };

  const displayData = isEditing ? formData : profile;

  return (
    <div className="min-h-screen bg-slate-50 pt-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          to="/applicantdashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#0056b3] h-32"></div>

          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 -mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-800">
                      {initials}
                    </span>
                  </div>
                </div>

                <div className="mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {fullName}
                  </h1>

                  <p className="text-slate-500 mt-1">Applicant Profile</p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                      <ShieldCheck size={14} />
                      {profile.accountStatus}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
                      <IdCard size={14} />
                      {profile.applicantNumber}
                    </span>
                  </div>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 transition"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-slate-700 font-semibold hover:bg-slate-200 transition"
                  >
                    <X size={18} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="profileForm"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-blue-700 transition"
                  >
                    <Save size={18} />
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form
          id="profileForm"
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Side */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="text-blue-700 mt-1" size={19} />

                  <div className="w-full">
                    <p className="text-xs text-slate-500">Email Address</p>

                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={displayData.email}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">
                        {displayData.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="text-blue-700 mt-1" size={19} />

                  <div className="w-full">
                    <p className="text-xs text-slate-500">Phone Number</p>

                    {isEditing ? (
                      <input
                        type="text"
                        name="phone"
                        value={displayData.phone}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">
                        {displayData.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="text-blue-700 mt-1" size={19} />

                  <div className="w-full">
                    <p className="text-xs text-slate-500">Address</p>

                    {isEditing ? (
                      <textarea
                        name="address"
                        value={displayData.address}
                        onChange={handleChange}
                        rows="3"
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-800">
                        {displayData.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Account Details
              </h2>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Unique Application Number</p>
                  <p className="font-medium text-slate-800">
                    {profile.applicantNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">Account Status</p>
                  <p className="font-medium text-green-700">
                    {profile.accountStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="text-blue-700" size={22} />

              <h2 className="text-lg font-semibold text-blue-900">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-sm font-medium text-slate-600">
                  First Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={displayData.firstName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Middle Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="middleName"
                    value={displayData.middleName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.middleName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Last Name
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={displayData.lastName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Sex
                </label>

                {isEditing ? (
                  <select
                    name="sex"
                    value={displayData.sex}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.sex}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Civil Status
                </label>

                {isEditing ? (
                  <select
                    name="civilStatus"
                    value={displayData.civilStatus}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Civil Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Separated">Separated</option>
                  </select>
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.civilStatus}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Nationality
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="nationality"
                    value={displayData.nationality}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.nationality}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Religion
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="religion"
                    value={displayData.religion}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.religion}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                  <CalendarDays size={16} />
                  Birth Date
                </label>

                {isEditing ? (
                  <input
                    type="date"
                    name="birthDate"
                    value={displayData.birthDate}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                    {displayData.birthDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}