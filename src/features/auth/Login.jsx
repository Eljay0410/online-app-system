import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../lib/api";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "./auth";
import imageSample from "../../assets/imagesample.svg";

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

  return (
    <main className="min-h-screen overflow-hidden bg-white pt-[96px]">
      <div className="grid min-h-[calc(100vh-96px)] grid-cols-1 lg:grid-cols-[30.5%_69.5%]">
        {/* LEFT LOGIN AREA */}
        <section className="min-w-0 bg-[#eeeeee]">
          <div className="flex min-h-[calc(100vh-96px)] w-full items-center justify-center px-5 py-8">
            <div className="w-full max-w-[330px]">
              <div>
                <h1 className="text-[25px] font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-[28px]">
                  {heading}
                </h1>

                <div className="mt-7 space-y-2 text-[13px] leading-6 text-slate-600">
                  {mode === "login" ? (
                    <>
                      <p>
                        Log in to the Online Application System using your
                        email.
                      </p>

                      <p>
                        If you don&apos;t have an account yet,{" "}
                        <Link
                          to="/register"
                          className="font-bold text-[#0056b3] hover:underline"
                        >
                          create one here
                        </Link>
                        .
                      </p>
                    </>
                  ) : mode === "forgot" ? (
                    <p>
                      Enter the email address associated with your account and
                      we&apos;ll send you a reset link.
                    </p>
                  ) : (
                    <p>
                      Enter the email address tied to your account and we&apos;ll
                      send a new verification link.
                    </p>
                  )}
                </div>
              </div>

              {message && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  {message}
                </div>
              )}

              <form
                onSubmit={submitHandler}
                className="mt-8 space-y-5"
                noValidate
              >
                <TextField
                  label={mode === "login" ? "Email" : "Email address"}
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  type="email"
                  placeholder="Enter your email address"
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
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                )}

                {errors.form && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                    {errors.form}
                  </div>
                )}

                {mode === "login" && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[13px] font-medium text-slate-500 transition hover:text-[#0056b3]"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 inline-flex h-[43px] w-full items-center justify-center gap-2 rounded-lg bg-[#244a96] text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#183978] disabled:cursor-not-allowed disabled:opacity-70"
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

              {mode !== "login" && (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-xs font-semibold text-slate-600 transition hover:text-[#0056b3]"
                  >
                    Back to login
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
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-slate-950 outline-none placeholder:text-slate-400"
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