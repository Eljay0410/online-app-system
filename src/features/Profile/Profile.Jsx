import { useEffect, useMemo, useState } from "react";
import { Lock, Mail, Pencil, User } from "lucide-react";
import { normalizeRole, useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";
import { apiRequest } from "../../lib/api";

const emptyAccountForm = {
  firstName: "",
  lastName: "",
  middleName: "",
  noMiddleName: false,
  email: "",
  contactNumber: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const primaryButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70";

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [collapsed, setCollapsed] = useState(false);

  const role = normalizeRole(user?.role);
  const isApplicant = role === "applicant";

  const [form, setForm] = useState(emptyAccountForm);
  const [accountNotice, setAccountNotice] = useState(null);
  const [passwordNotice, setPasswordNotice] = useState(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      middleName: user?.middleName || "",
      noMiddleName: Boolean(user?.noMiddleName),
      email: user?.email || "",
      contactNumber: user?.contactNumber || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  }, [
    user?.id,
    user?.firstName,
    user?.lastName,
    user?.middleName,
    user?.noMiddleName,
    user?.email,
    user?.contactNumber,
  ]);

  const summaryFirstName = form.firstName || user?.firstName;
  const summaryLastName = form.lastName || user?.lastName;

  const fullName = useMemo(() => {
    return (
      [summaryFirstName, summaryLastName].filter(Boolean).join(" ") ||
      user?.email ||
      "User"
    );
  }, [summaryFirstName, summaryLastName, user?.email]);

  const initials = useMemo(() => {
    const first = summaryFirstName?.charAt(0) || user?.email?.charAt(0) || "U";
    const last = summaryLastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  }, [summaryFirstName, summaryLastName, user?.email]);

  const roleLabel =
    role === "superadmin"
      ? "Super Administrator"
      : role === "admin"
      ? "Administrator"
      : "Applicant";

  const contentPadding = collapsed ? "lg:pl-20" : "lg:pl-72";
  const accountStatus = user?.isActive === false ? "Inactive" : "Active";
  const accountStatusClass =
    user?.isActive === false ? "text-red-600" : "text-green-600";
  const memberSince = formatDate(user?.createdAt) || "Not available";

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNoMiddleName = (checked) => {
    setForm((current) => ({
      ...current,
      noMiddleName: checked,
      middleName: checked ? "" : current.middleName,
    }));
  };

  const syncApplicantStorage = (updatedUser) => {
    if (!isApplicant || !updatedUser) return;

    try {
      const fullProfileRaw = localStorage.getItem("applicantFullProfile");
      if (fullProfileRaw) {
        const fullProfile = JSON.parse(fullProfileRaw);
        const nextFullProfile = {
          ...fullProfile,
          personalInfo: {
            ...(fullProfile.personalInfo || {}),
            firstName: updatedUser.firstName || "",
            middleName: updatedUser.noMiddleName
              ? ""
              : updatedUser.middleName || "",
            noMiddleName: Boolean(updatedUser.noMiddleName),
            lastName: updatedUser.lastName || "",
            contactNumber: updatedUser.contactNumber || "",
            emailAddress: updatedUser.email || "",
          },
        };
        localStorage.setItem(
          "applicantFullProfile",
          JSON.stringify(nextFullProfile)
        );
      }

      const profileRaw = localStorage.getItem("applicantProfile");
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        localStorage.setItem(
          "applicantProfile",
          JSON.stringify({
            ...profile,
            firstName: updatedUser.firstName || "",
            middleName: updatedUser.noMiddleName
              ? ""
              : updatedUser.middleName || "",
            noMiddleName: Boolean(updatedUser.noMiddleName),
            lastName: updatedUser.lastName || "",
            contactNumber: updatedUser.contactNumber || "",
            phone: updatedUser.contactNumber || "",
            email: updatedUser.email || "",
            emailAddress: updatedUser.email || "",
          })
        );
      }
    } catch (error) {
      console.error("Failed to sync applicant profile cache:", error);
    }
  };

  const handleSaveAccount = async () => {
    if (isSavingAccount) return;

    setAccountNotice(null);

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setAccountNotice({
        type: "error",
        text: "First name, last name, and email address are required.",
      });
      return;
    }

    setIsSavingAccount(true);

    try {
      const result = await apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: form.firstName,
          middleName: form.middleName,
          noMiddleName: form.noMiddleName,
          lastName: form.lastName,
          email: form.email,
          contactNumber: form.contactNumber,
        }),
      });

      updateUser?.(result.user);
      syncApplicantStorage(result.user);
      setAccountNotice({
        type: "success",
        text: result.message || "Account details updated.",
      });
    } catch (error) {
      setAccountNotice({
        type: "error",
        text: error.message || "Failed to update account details.",
      });
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (isChangingPassword) return;

    setPasswordNotice(null);

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setPasswordNotice({
        type: "error",
        text: "Current password, new password, and confirmation are required.",
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setPasswordNotice({
        type: "error",
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await apiRequest("/api/auth/password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        }),
      });

      setForm((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setPasswordNotice({
        type: "success",
        text: result.message || "Password changed successfully.",
      });
    } catch (error) {
      setPasswordNotice({
        type: "error",
        text: error.message || "Failed to change password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const accountSections = (
    <>
      <section className="oas-panel">
        <div className="oas-panel-header">
          <div className="flex items-center gap-2 text-slate-900">
            <Pencil className="h-4 w-4 text-blue-700" />
            <h2 className="oas-panel-title">Edit Profile</h2>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {accountNotice && (
            <Notice
              type={accountNotice.type}
              text={accountNotice.text}
              className="md:col-span-2"
            />
          )}

          <InputField
            label="First Name"
            required
            value={form.firstName}
            onChange={(value) => updateField("firstName", value)}
          />

          <InputField
            label="Last Name"
            required
            value={form.lastName}
            onChange={(value) => updateField("lastName", value)}
          />

          <div className="md:col-span-2">
            <InputField
              label="Middle Name"
              value={form.middleName}
              disabled={form.noMiddleName}
              onChange={(value) => updateField("middleName", value)}
            />

            <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <input
                type="checkbox"
                checked={form.noMiddleName}
                onChange={(event) => updateNoMiddleName(event.target.checked)}
              />
              I don&apos;t have a middle name
            </label>
          </div>

          <InputField
            label="Email Address"
            required
            type="email"
            value={form.email}
            onChange={(value) => updateField("email", value)}
          />

          <InputField
            label="Mobile Number"
            value={form.contactNumber}
            placeholder="09XXXXXXXXX"
            onChange={(value) => updateField("contactNumber", value)}
          />

          <div className="flex justify-end md:col-span-2">
            <button
              type="button"
              onClick={handleSaveAccount}
              disabled={isSavingAccount}
              className={primaryButtonClass}
            >
              {isSavingAccount ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      <section className="oas-panel">
        <div className="oas-panel-header">
          <div className="flex items-center gap-2 text-slate-900">
            <Lock className="h-4 w-4 text-blue-700" />
            <h2 className="oas-panel-title">Change Password</h2>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {passwordNotice && (
            <Notice
              type={passwordNotice.type}
              text={passwordNotice.text}
              className="md:col-span-2"
            />
          )}

          <div className="md:col-span-2">
            <InputField
              label="Current Password"
              required
              type="password"
              value={form.currentPassword}
              onChange={(value) => updateField("currentPassword", value)}
            />
          </div>

          <InputField
            label="New Password"
            required
            type="password"
            value={form.newPassword}
            onChange={(value) => updateField("newPassword", value)}
          />

          <InputField
            label="Confirm New Password"
            required
            type="password"
            value={form.confirmPassword}
            onChange={(value) => updateField("confirmPassword", value)}
          />

          <p className="-mt-3 text-xs text-slate-400 md:col-span-2">
            Min 8 chars, uppercase, lowercase, number
          </p>

          <div className="flex justify-end md:col-span-2">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className={primaryButtonClass}
            >
              {isChangingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      <SuperAdminSidebar
        activeTab="profile"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        role={role}
      />

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="oas-page-title">
              {isApplicant ? "My Profile" : "Account Settings"}
            </h1>
            <p className="oas-page-description">
              {isApplicant
                ? "Manage your applicant information and account details"
                : "Manage your personal information and password"}
            </p>
          </div>

          <section className="oas-panel">
            <div className="bg-blue-700 px-6 py-7 text-white">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/15 text-xl font-black">
                  {initials}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">{fullName}</h2>
                  <p className="truncate text-sm text-white/80">
                    {form.email || user?.email || "No email provided"}
                  </p>
                  <span className="mt-2 inline-flex rounded bg-white/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid border-t border-slate-200 md:grid-cols-2">
              <InfoItem label="Full Name" value={fullName} />
              <InfoItem
                label="Email Address"
                value={form.email || user?.email || "Not set"}
              />
              <InfoItem
                label="Mobile Number"
                value={form.contactNumber || "No number provided"}
              />
              <InfoItem
                label="Account Status"
                value={accountStatus}
                valueClassName={accountStatusClass}
              />
              <InfoItem label="Account Type" value={roleLabel} />
              <InfoItem label="Member Since" value={memberSince} />
            </div>
          </section>

          {accountSections}
        </div>
      </section>
    </main>
  );
}

function InfoItem({ label, value, valueClassName = "text-slate-900" }) {
  return (
    <div className="border-b border-slate-200 px-6 py-4 md:border-r">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function Notice({ type, text, className = "" }) {
  const isError = type === "error";

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      } ${className}`}
    >
      {text}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />

        {type === "email" && (
          <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        )}

        {type !== "password" && type !== "email" && value && (
          <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        )}
      </div>
    </div>
  );
}
