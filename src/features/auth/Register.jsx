import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiRequest } from "../../lib/api";
import BackButton from "../../components/ui/BackButton";
import imageSample from "../../assets/imagesample.svg";
import { useToast } from "../../components/ui/toastContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactPattern = /^09\d{9}$/;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const prefilledEmail =
    typeof location.state?.email === "string" ? location.state.email : "";

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    noMiddleName: false,
    lastName: "",
    contactNumber: "",
    email: prefilledEmail,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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
      next.contactNumber =
        "Contact number must start with 09 and be 11 digits.";
    }

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast({
        type: "warning",
        message: "Please complete the highlighted registration fields.",
      });
      return;
    }

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
      showToast({
        type: "success",
        message:
          result.message ||
          "Account created. Please verify your email before logging in.",
      });
    } catch (error) {
      const errorMessage = error.message || "Failed to create account.";

      if (
        errorMessage
          .toLowerCase()
          .includes("account with this email already exists")
      ) {
        setErrors((current) => ({
          ...current,
          email: errorMessage,
        }));
      } else {
        setErrors({});
      }

      showToast({ type: "error", message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white pt-[96px]">
      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 lg:grid-cols-[30.5%_69.5%]">
        {/* LEFT REGISTER AREA */}
        <section className="min-w-0 bg-white">
          <div className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center px-5 py-7">
            <div className="w-full max-w-[340px]">
              <BackButton
                onClick={() => navigate("/login")}
                className="mb-6"
              />

              <div>
                <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-slate-950 sm:text-[30px]">
                  Create Account
                </h1>

                <div className="mt-6 space-y-2 text-[14px] leading-6 text-slate-600">
                  <p>
                    Register to receive a setup link by email. Already have an
                    account?{" "}
                    <Link
                      to="/login"
                      className="font-bold text-[#0056b3] hover:underline"
                    >
                      Sign in
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {!success ? (
                <form
                  onSubmit={handleSubmit}
                  className="mt-7 space-y-4"
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

                  <label className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600">
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
                    onChange={(value) =>
                      setField(
                        "contactNumber",
                        value.replace(/\D/g, "").slice(0, 11)
                      )
                    }
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="tel"
                    placeholder="09XXXXXXXXX"
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

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#244a96] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#183978] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Create Account
                  </button>
                </form>
              ) : (
                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login", { replace: true })}
                    className="inline-flex h-[44px] w-full items-center justify-center rounded-lg bg-[#244a96] text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#183978]"
                  >
                    Go to Login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                    }}
                    className="inline-flex h-[44px] w-full items-center justify-center rounded-lg bg-slate-100 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-200"
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
  maxLength,
  placeholder,
  autoComplete,
  rightElement,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-slate-950">
        {label}
      </span>

      <div
        className={`flex h-[42px] w-full items-center rounded-lg border bg-white px-3 transition focus-within:ring-2 ${
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
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
        />

        {rightElement}
      </div>

      {error && (
        <p className="mt-1.5 text-[12px] font-semibold text-red-600">
          {error}
        </p>
      )}
    </label>
  );
}
