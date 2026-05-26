import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "../../lib/api";
import BackButton from "../../components/ui/BackButton";
import { getAuthenticatedHomePath, normalizeRole, useAuth } from "./auth";
import imageSample from "../../assets/imagesample.svg";
import { useToast } from "../../components/ui/toastContext";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const guestRoutes = ["/login", "/register", "/activate"];

function canUseNextPath(user, nextRoute) {
  if (!nextRoute || guestRoutes.includes(nextRoute)) return false;

  const role = normalizeRole(user?.role);

  if (role === "superadmin") {
    return nextRoute === "/superadmin" || nextRoute === "/profile";
  }

  if (role === "admin") {
    return nextRoute === "/admin" || nextRoute === "/profile";
  }

  return role === "applicant";
}

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
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendKind, setResendKind] = useState("verify");
  const [formStartedAt] = useState(() => Date.now());

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
  };

  const goToStep = (nextStep) => {
    setStep(nextStep);
    setShowPassword(false);
    setErrors({});

    if (nextStep !== "resend") {
      setResendKind("verify");
    }

    if (nextStep !== "password") {
      setPassword("");
    }
  };

  const goToEmailStep = () => {
    setStep("email");
    setShowPassword(false);
    setPassword("");
    setResendKind("verify");
    resetFeedback();
  };

  const handleEmailCheck = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!validateEmailOnly()) {
      showToast({
        type: "warning",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/email-check", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (!result.exists) {
        navigate("/register", { state: { email } });
        return;
      }

      if (!result.isActive) {
        if (!result.hasPassword) {
          setResendKind("setup");
          goToStep("resend");
          showToast({
            type: "info",
            message:
              "Finish setting up your account by creating a password. We'll email you the setup link.",
          });
          return;
        }

        setResendKind("verify");
        goToStep("resend");
        showToast({
          type: "warning",
          message:
            "Please verify your email before logging in. You can resend the verification link below.",
        });
        return;
      }

      if (!result.hasPassword) {
        setResendKind("setup");
        goToStep("resend");
        showToast({
          type: "info",
          message:
            "This account does not have a password yet. We'll email you a secure setup link.",
        });
        return;
      }

      goToStep("password");
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Could not verify the email address.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!validateLogin()) {
      showToast({
        type: "warning",
        message: "Please complete the highlighted login fields.",
      });
      return;
    }

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

      navigate(
        canUseNextPath(user, nextRoute)
          ? safeNextPath
          : getAuthenticatedHomePath(user),
        { replace: true }
      );
    } catch (err) {
      const errorMessage = String(err?.message || "");
      const normalizedMessage = errorMessage.toLowerCase();

      if (normalizedMessage.includes("verify")) {
        setResendKind("verify");
        goToStep("resend");
        showToast({
          type: "warning",
          message: errorMessage || "Please verify your email before logging in.",
        });
        return;
      }

      if (
        normalizedMessage.includes("password") &&
        normalizedMessage.includes("reset")
      ) {
        goToStep("forgot");
        showToast({
          type: "warning",
          message: errorMessage || "Please reset your password to continue.",
        });
        return;
      }

      showToast({
        type: "error",
        message: errorMessage || "Login failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    if (!validateEmailOnly()) {
      showToast({
        type: "warning",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          formStartedAt,
          website: "",
        }),
      });

      showToast({
        type: "success",
        message: result.message || "Password reset instructions were sent.",
      });
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Could not process password reset.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendActivation = async (event) => {
    event.preventDefault();

    if (!validateEmailOnly()) {
      showToast({
        type: "warning",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/resend-activation", {
        method: "POST",
        body: JSON.stringify({
          email,
          formStartedAt,
          website: "",
        }),
      });

      showToast({
        type: "success",
        message: result.message || "Verification email was sent.",
      });
    } catch (err) {
      showToast({
        type: "error",
        message: err.message || "Could not resend verification email.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitHandler =
    step === "email"
      ? handleEmailCheck
      : step === "password"
      ? handleLogin
      : step === "forgot"
      ? handleForgotPassword
      : handleResendActivation;

  const isLoginStep = step === "email" || step === "password";
  const heading = isLoginStep
    ? "Enter your email to continue"
    : step === "forgot"
    ? "Forgot your password?"
    : resendKind === "setup"
    ? "Set up your account"
    : "Resend verification email";

  return (
    <main className="min-h-screen overflow-x-hidden bg-white pt-[96px]">
      <div className="grid min-h-[calc(100dvh-96px)] grid-cols-1 lg:grid-cols-[30.5%_69.5%]">
        {/* LEFT LOGIN AREA */}
        <section className="min-w-0 bg-white">
          <div className="flex min-h-[calc(100dvh-96px)] w-full items-start justify-center px-5 py-7 sm:items-center">
            <div className="w-full max-w-[340px]">
              {step !== "email" && (
                <BackButton onClick={goToEmailStep} className="mb-6" />
              )}

              <div>
                <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-slate-950 sm:text-[30px]">
                  {heading}
                </h1>

                <div className="mt-6 space-y-2 text-[14px] leading-6 text-slate-600">
                  {isLoginStep ? (
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
                  ) : step === "forgot" ? (
                    <p>
                      Enter the email address associated with your account and
                      we&apos;ll send you a reset link.
                    </p>
                  ) : resendKind === "setup" ? (
                    <p>
                      We&apos;ll email a secure link so you can create your
                      password and activate your account.
                    </p>
                  ) : (
                    <p>
                      Enter the email address tied to your account and we&apos;ll
                      send a new verification link.
                    </p>
                  )}
                </div>
              </div>

              <form
                onSubmit={submitHandler}
                className="mt-7 space-y-4"
                noValidate
              >
                <TextField
                  label={isLoginStep ? "Email" : "Email address"}
                  value={email}
                  onChange={setEmail}
                  error={errors.email}
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  readOnly={step !== "email"}
                />

                {step === "password" && (
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
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                )}

                {step === "password" && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => goToStep("forgot")}
                      className="text-[14px] font-medium text-slate-500 transition hover:text-[#0056b3]"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 inline-flex h-[44px] w-auto min-w-[132px] items-center justify-center gap-2 rounded-lg bg-[#244a96] px-6 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#183978] disabled:cursor-not-allowed disabled:opacity-70 sm:w-full sm:px-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step === "resend" ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : null}

                  {step === "email"
                    ? "Proceed"
                    : step === "password"
                    ? "Login"
                    : step === "forgot"
                    ? "Send Reset Link"
                    : resendKind === "setup"
                    ? "Send Setup Link"
                    : "Resend Verification"}
                </button>
              </form>
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
  inputMode,
  rightElement,
  readOnly = false,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-slate-950">
        {label}
      </span>

      <div
        className={`flex h-[42px] w-full items-center rounded-lg border px-3 transition focus-within:ring-2 ${
          error
            ? "border-red-500 ring-1 ring-red-100"
            : "border-slate-300 focus-within:border-[#244a96] focus-within:ring-blue-100"
        } ${readOnly ? "bg-slate-50" : "bg-white"}`}
      >
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          readOnly={readOnly}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-slate-400 ${
            readOnly ? "text-slate-600" : "text-slate-950"
          }`}
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
