import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactPattern = /^\+?[0-9\s().-]{7,20}$/;

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    noMiddleName: false,
    lastName: "",
    contactNumber: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const validate = () => {
    const next = {};

    if (!form.firstName.trim()) next.firstName = "First name is required.";
    if (!form.noMiddleName && !form.middleName.trim()) {
      next.middleName = "Middle name is required.";
    }
    if (!form.lastName.trim()) next.lastName = "Last name is required.";
    if (!form.contactNumber.trim()) {
      next.contactNumber = "Contact number is required.";
    } else if (!contactPattern.test(form.contactNumber.trim())) {
      next.contactNumber = "Please enter a valid contact number.";
    }
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          middleName: form.noMiddleName ? "" : form.middleName,
        }),
      });

      setSuccess(true);
      setMessage(
        result.message ||
          "Account created. Please verify your email before logging in."
      );
    } catch (error) {
      setMessage(error.message || "Failed to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 pt-24 pb-8 sm:px-6 sm:pt-24 sm:pb-10">
      <section className="w-full max-w-[640px] rounded-[20px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0056b3] text-white transition hover:bg-[#003a78]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mt-6">
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            Create Account
          </h1>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-7 text-slate-600">
            Complete the form below to register your account. Verify your email
            first, then finish your applicant profile inside the dashboard.
          </p>
        </div>

        {message && (
          <div
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {message}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-left" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="First Name"
                error={errors.firstName}
                value={form.firstName}
                onChange={(value) => setField("firstName", value)}
                autoComplete="given-name"
                placeholder="Enter first name"
              />
              <TextField
                label="Last Name"
                error={errors.lastName}
                value={form.lastName}
                onChange={(value) => setField("lastName", value)}
                autoComplete="family-name"
                placeholder="Enter last name"
              />
            </div>

            <TextField
              label="Middle Name"
              error={errors.middleName}
              value={form.middleName}
              onChange={(value) => setField("middleName", value)}
              disabled={form.noMiddleName}
              autoComplete="additional-name"
              placeholder={form.noMiddleName ? "No middle name" : "Enter middle name"}
            />

            <label className="inline-flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.noMiddleName}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setField("noMiddleName", checked);
                  if (checked) {
                    setField("middleName", "");
                  }
                }}
                className="h-4 w-4 rounded border-slate-300 text-[#0056b3] focus:ring-[#0056b3]"
              />
              I don&apos;t have a middle name
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Contact Number"
                error={errors.contactNumber}
                value={form.contactNumber}
                onChange={(value) => setField("contactNumber", value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Enter contact number"
              />
              <TextField
                label="Email Address"
                error={errors.email}
                value={form.email}
                onChange={(value) => setField("email", value)}
                type="email"
                autoComplete="email"
                placeholder="ex: myname@example.com"
              />
            </div>

            <TextField
              label="Password"
              error={errors.password}
              value={form.password}
              onChange={(value) => setField("password", value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a password"
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 text-[15px] font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Create Account
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#0056b3] px-4 text-[15px] font-semibold text-white transition hover:bg-[#003a78]"
            >
              Go to Login
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setMessage("");
              }}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Register another account
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#0056b3]">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  error,
  type = "text",
  disabled = false,
  inputMode,
  placeholder,
  autoComplete,
  rightElement,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-900">
        {label}
      </span>
      <div
        className={`flex h-11 items-center rounded-xl border bg-white px-3.5 transition focus-within:ring-2 ${
          error
            ? "border-red-500 ring-1 ring-red-100"
            : "border-slate-300 focus-within:border-[#0056b3] focus-within:ring-blue-100"
        } ${disabled ? "bg-slate-100" : ""}`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
        {rightElement}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
