import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Lock,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { normalizeRole, useAuth } from "../auth/auth";
import SuperAdminSidebar from "../../components/layout/SuperAdminSidebar";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const role = normalizeRole(user?.role);
  const hasSidebar = role === "superadmin" || role === "admin";

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    middleName: "",
    email: user?.email || "",
    mobile: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fullName = useMemo(() => {
    return (
      [form.firstName, form.lastName].filter(Boolean).join(" ") ||
      user?.email ||
      "User"
    );
  }, [form.firstName, form.lastName, user?.email]);

  const initials = useMemo(() => {
    const first = form.firstName?.charAt(0) || user?.email?.charAt(0) || "U";
    const last = form.lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  }, [form.firstName, form.lastName, user?.email]);

  const roleLabel =
    role === "superadmin"
      ? "Super Administrator"
      : role === "admin"
      ? "Administrator"
      : "Applicant";

  const contentPadding = hasSidebar
    ? collapsed
      ? "lg:pl-20"
      : "lg:pl-72"
    : "";

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <main className={`min-h-screen bg-slate-100 pt-24 ${contentPadding}`}>
      {hasSidebar && (
        <SuperAdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      )}

      <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Account Settings
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your personal information and password
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-11 w-11 place-items-center rounded-full bg-blue-700 text-white shadow-sm transition hover:bg-blue-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-blue-700 px-6 py-7 text-white">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-white/40 bg-white/15 text-xl font-black">
                  {initials}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold">{fullName}</h2>
                  <p className="truncate text-sm text-white/80">
                    {user?.email || "No email provided"}
                  </p>
                  <span className="mt-2 inline-flex rounded bg-white/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid border-t border-slate-200 md:grid-cols-2">
              <InfoItem label="Full Name" value={fullName} />
              <InfoItem label="Email Address" value={user?.email || "Not set"} />
              <InfoItem
                label="Mobile Number"
                value={form.mobile || "No number provided"}
              />
              <InfoItem
                label="Account Status"
                value="Active"
                valueClassName="text-green-600"
              />
              <InfoItem label="Account Type" value={roleLabel} />
              <InfoItem label="Member Since" value="February 16, 2026" />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Pencil className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-bold">Edit Profile</h2>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
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
                  onChange={(value) => updateField("middleName", value)}
                />

                <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <input type="checkbox" defaultChecked />
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
                label="Mobile Optional"
                value={form.mobile}
                placeholder="09XXXXXXXXX"
                onChange={(value) => updateField("mobile", value)}
              />

              <div className="flex justify-end md:col-span-2">
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Lock className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-bold">Change Password</h2>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
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
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>
          </section>
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

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
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
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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