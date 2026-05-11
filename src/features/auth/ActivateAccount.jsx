import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { apiRequest } from "../../lib/api";

const ActivateAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const clearFieldError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors((current) => ({ ...current, [fieldName]: "" }));
    }
  };

  const fieldClass = (fieldName) =>
    `mt-1 flex h-11 items-center rounded-xl border bg-slate-100 px-3 focus-within:ring-2 focus-within:ring-blue-500 ${
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

  const validateForm = () => {
    const nextErrors = {};

    if (!token) {
      nextErrors.form = "Invalid or missing activation link.";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await apiRequest("/api/activate", {
        method: "POST",
        body: JSON.stringify({
          token,
          password,
        }),
      });
      setIsDone(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setErrors({
        form: err.message || "Could not set password. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 pt-32">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {isDone ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              Password Set
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Your account is ready. Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                Set Your Password
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Create a password to activate or recover your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className={fieldClass("password")}>
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      clearFieldError("password");
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                    autoComplete="new-password"
                  />
                </div>
                {errorText("password")}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className={fieldClass("confirmPassword")}>
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                    autoComplete="new-password"
                  />
                </div>
                {errorText("confirmPassword")}
              </div>

              {errors.form && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Set Password
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Already active?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-700 hover:underline"
              >
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default ActivateAccount;
