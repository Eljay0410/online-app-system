import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "./auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const guestRoutes = ["/login", "/register", "/activate"];

function getSafeNextPath(nextPath) {
  if (!nextPath) return "";

  try {
    const nextUrl = new URL(nextPath, window.location.origin);

    if (nextUrl.origin !== window.location.origin) {
      return "";
    }

    return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  } catch {
    return "";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmailOnly = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateLogin = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetFeedback = () => {
    setErrors({});
    setMessage("");
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setShowPassword(false);
    resetFeedback();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateLogin()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(result.user, result.token);
      const user = result.user;
      const safeNextPath = getSafeNextPath(searchParams.get("next"));
      const nextRoute = safeNextPath.split("?")[0];
      const isGuestRoute = guestRoutes.includes(nextRoute);

      if (normalizeRole(user.role) === "applicant" && !user.profileComplete) {
        navigate("/profile", { replace: true });
        return;
      }

      navigate(
        safeNextPath && !isGuestRoute
          ? safeNextPath
          : getAuthenticatedHomePath(user),
        { replace: true }
      );
    } catch (err) {
      if (String(err?.message || "").toLowerCase().includes("verify")) {
        setMode("resend");
        setShowPassword(false);
      }

      setErrors({
        form: err.message || "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateEmailOnly()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(result.message || "Password reset instructions were sent.");
    } catch (err) {
      setErrors({
        form: err.message || "Could not process password reset.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendActivation = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateEmailOnly()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/resend-activation", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(result.message || "Verification email was sent.");
    } catch (err) {
      setErrors({
        form: err.message || "Could not resend verification email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHandler =
    mode === "login"
      ? handleLogin
      : mode === "forgot"
      ? handleForgotPassword
      : handleResendActivation;

  const heading =
    mode === "login"
      ? "Enter your email to continue"
      : mode === "forgot"
      ? "Forgot your password?"
      : "Resend verification email";

  const handleBack = () => {
    if (mode === "login") {
      navigate("/");
      return;
    }

    switchMode("login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 pt-24 pb-8 sm:px-6 sm:pt-24 sm:pb-10">
      <section className="w-full max-w-[520px] rounded-[20px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#0056b3] text-white transition hover:bg-[#003a78]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="mt-6">
          <h1 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[28px]">
            {heading}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-7 text-slate-600">
            {mode === "login" ? (
              <>
                Log in to the Online Application System using your email. If
                you don&apos;t have an account yet,{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[#0056b3] hover:underline"
                >
                  create one here
                </Link>
                .
              </>
            ) : mode === "forgot" ? (
              "Enter the email address associated with your account and we'll send you a reset link."
            ) : (
              "Enter the email address tied to your account and we'll send a new verification link."
            )}
          </p>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={submitHandler} className="mt-6 space-y-5 text-left" noValidate>
          <TextField
            label={mode === "login" ? "Email" : "Email address"}
            value={email}
            onChange={setEmail}
            error={errors.email}
            type="email"
            placeholder={
              mode === "login"
                ? "Enter your email address"
                : "ex: myname@example.com"
            }
            autoComplete="email"
          />

          {mode === "login" && (
            <TextField
              label="Password"
              value={password}
              onChange={setPassword}
              type={showPassword ? "text" : "password"}
              error={errors.password}
              placeholder="Enter your password"
              autoComplete="current-password"
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
          )}

          {errors.form && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  switchMode("forgot");
                }}
                className="text-sm font-medium text-slate-500 transition hover:text-[#0056b3]"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 text-[15px] font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "resend" ? (
              <RefreshCw className="h-4 w-4" />
            ) : null}
            {mode === "login"
              ? "Login"
              : mode === "forgot"
              ? "Send Reset Link"
              : "Resend Verification"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="font-medium text-slate-600 transition hover:text-[#0056b3]"
            >
              Back to login
            </button>
          )}
        </div>
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
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        {rightElement}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
