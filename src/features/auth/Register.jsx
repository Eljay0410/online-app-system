import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import imageSample from "../../assets/imagesample.svg";

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
    <main className="min-h-screen overflow-hidden bg-white pt-[96px]">
      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 lg:grid-cols-[30.5%_69.5%]">
        {/* LEFT REGISTER AREA */}
        <section className="min-w-0 bg-white">
          <div className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center px-5 py-8">
            <div className="w-full max-w-[345px]">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mb-7 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0056b3] text-white transition hover:bg-[#003a78]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <div>
                <h1 className="text-[25px] font-medium leading-[1.12] tracking-tight text-slate-950 sm:text-[28px]">
                  Create Account
                </h1>

                <div className="mt-7 space-y-2 text-[13px] leading-6 text-slate-600">
                  <p>Complete the form below to register your account.</p>

                  <p>
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-bold text-[#0056b3] hover:underline"
                    >
                      Sign in here
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {message && (
                <div
                  className={`mt-5 rounded-lg border px-3 py-2 text-xs font-medium ${
                    success
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {message}
                </div>
              )}

              {!success ? (
                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-4"
                  noValidate
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label="First Name"
                      error={errors.firstName}
                      value={form.firstName}
                      onChange={(value) => setField("firstName", value)}
                      autoComplete="given-name"
                      placeholder="First name"
                    />

                    <TextField
                      label="Last Name"
                      error={errors.lastName}
                      value={form.lastName}
                      onChange={(value) => setField("lastName", value)}
                      autoComplete="family-name"
                      placeholder="Last name"
                    />
                  </div>

                  <TextField
                    label="Middle Name"
                    error={errors.middleName}
                    value={form.middleName}
                    onChange={(value) => setField("middleName", value)}
                    disabled={form.noMiddleName}
                    autoComplete="additional-name"
                    placeholder={
                      form.noMiddleName
                        ? "No middle name"
                        : "Enter middle name"
                    }
                  />

                  <label className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.noMiddleName}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        setField("noMiddleName", checked);

                        if (checked) {
                          setField("middleName", "");
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#0056b3] focus:ring-[#0056b3]"
                    />
                    I don&apos;t have a middle name
                  </label>

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
                        className={`ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base transition-all duration-200 ${
                          showPassword
                            ? "bg-blue-50 text-[#0056b3] hover:bg-blue-100"
                            : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-[#0056b3]"
                        }`}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "👀" : "🙈"}
                      </button>
                    }
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 inline-flex h-[43px] w-full items-center justify-center gap-2 rounded-lg bg-[#244a96] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#183978] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Create Account
                  </button>
                </form>
              ) : (
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login", { replace: true })}
                    className="inline-flex h-[43px] w-full items-center justify-center rounded-lg bg-[#244a96] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#183978]"
                  >
                    Go to Login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setMessage("");
                    }}
                    className="inline-flex h-[43px] w-full items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Register another account
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT IMAGE FULL */}
        <section className="hidden min-w-0 overflow-hidden bg-[#0056d6] lg:block">
          <img
            src={imageSample}
            alt="Online Application System"
            className="h-[calc(100vh-96px)] w-full object-cover object-center"
          />
        </section>
      </div>
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
      <span className="mb-2 block text-[12px] font-bold text-slate-950">
        {label}
      </span>

      <div
        className={`flex h-[39px] w-full items-center rounded-lg border bg-white px-3 transition focus-within:ring-2 ${
          error
            ? "border-red-500 ring-1 ring-red-100"
            : "border-slate-300 focus-within:border-[#244a96] focus-within:ring-blue-100"
        } ${disabled ? "bg-slate-100" : ""}`}
      >
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          inputMode={inputMode}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />

        {rightElement}
      </div>

      {error && (
        <p className="mt-1.5 text-[11px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </label>
  );
}