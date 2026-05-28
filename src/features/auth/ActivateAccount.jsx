import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { apiRequest } from "../../lib/api";
import BackButton from "../../components/ui/BackButton";
import { useToast } from "../../components/ui/toastContext";

const passwordResetPurpose = "password_reset";
const passwordSetupPurpose = "password_setup";
const passwordPolicyText =
  "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
const hasPasswordStrength = (value) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [purpose, setPurpose] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadToken() {
      if (!token) {
        showToast({ type: "error", message: "Missing activation token." });
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiRequest(`/api/activate?token=${encodeURIComponent(token)}`);
        if (!isMounted) return;
        setPurpose(result.purpose || "");
        setExpiresAt(result.expiresAt || "");
        setAlreadyActive(Boolean(result.alreadyActive));
      } catch (error) {
        if (!isMounted) return;
        showToast({
          type: "error",
          message: error.message || "Invalid or expired link.",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadToken();

    return () => {
      isMounted = false;
    };
  }, [token, showToast]);

  const validate = () => {
    const next = {};

    if (!token) {
      next.form = "Missing activation token.";
    }

    if (requiresPassword) {
      if (!password) {
        next.password = "Password is required.";
      } else if (!hasPasswordStrength(password)) {
        next.password = passwordPolicyText;
      }

      if (!confirmPassword) {
        next.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        next.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const requiresPassword =
    purpose === passwordResetPurpose || purpose === passwordSetupPurpose;
  const isAccountSetup =
    purpose === passwordSetupPurpose ||
    (purpose === passwordResetPurpose && !alreadyActive);
  const isPasswordReset = purpose === passwordResetPurpose && !isAccountSetup;
  const successTitle = isAccountSetup
    ? "Account activated"
    : isPasswordReset
    ? "Password updated"
    : "Email verified";
  const pageTitle = isAccountSetup
    ? "Create your password"
    : isPasswordReset
    ? "Set a new password"
    : "Verify your email";
  const pageDescription = isAccountSetup
    ? "Choose a password to activate your account."
    : isPasswordReset
    ? "Choose a new password to finish the reset."
    : "Confirm your account to start using the system.";
  const primaryLabel = isAccountSetup
    ? "Set Password"
    : isPasswordReset
    ? "Update Password"
    : "Verify Email";
  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast({
        type: "warning",
        message: "Please complete the highlighted activation fields.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("/api/activate", {
        method: "POST",
        body: JSON.stringify({
          token,
          ...(requiresPassword ? { password } : {}),
        }),
      });

      setIsDone(true);
      showToast({
        type: "success",
        message: `${successTitle}.`,
      });
      window.setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (error) {
      showToast({
        type: "error",
        message: error.message || "Verification failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking activation link...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 pt-24 pb-8">
      <div className="w-full max-w-[460px] rounded-[20px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:px-8 sm:py-8">
        {isDone ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <div className="mt-3 flex justify-start">
              <BackButton to="/login" ariaLabel="Back to login" />
            </div>
            <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-slate-900">
              {successTitle}
            </h1>
            <p className="mt-2 text-[14px] text-slate-500">
              Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="flex justify-start">
                <BackButton to="/login" ariaLabel="Back to login" />
              </div>
              <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                {pageTitle}
              </h1>
              <p className="mx-auto mt-2 max-w-[36ch] text-[14px] leading-6 text-slate-500">
                {pageDescription}
              </p>
              {expiryText && (
                <p className="mx-auto mt-2 max-w-[36ch] text-[12px] font-medium text-slate-400">
                  This secure link expires on {expiryText}.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
              {requiresPassword && (
                <>
                  <Field
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    rightElement={
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition-all duration-200 ${
                          showPassword
                            ? "bg-blue-50 text-[#244a96] hover:bg-blue-100"
                            : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-[#244a96]"
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
                  <Field
                    label="Confirm Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={errors.confirmPassword}
                    rightElement={
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((current) => !current)
                        }
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition-all duration-200 ${
                          showConfirmPassword
                            ? "bg-blue-50 text-[#244a96] hover:bg-blue-100"
                            : "bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-[#244a96]"
                        }`}
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        aria-pressed={showConfirmPassword}
                        title={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="oas-mobile-full inline-flex h-[44px] w-auto min-w-[132px] items-center justify-center gap-2 rounded-xl bg-[#244a96] px-6 text-[14px] font-semibold text-white transition hover:bg-[#183978] disabled:cursor-not-allowed disabled:opacity-70 sm:w-full sm:px-4"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {primaryLabel}
              </button>
            </form>

          </>
        )}
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  rightElement,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-bold text-slate-950">
        {label}
      </span>
      <div
        className={`flex h-[42px] items-center gap-2 rounded-xl border px-3 ${
          error ? "border-red-500" : "border-slate-300"
        } bg-white focus-within:ring-2 focus-within:ring-blue-100`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-slate-950 outline-none placeholder:text-slate-400"
          autoComplete="new-password"
        />
        {rightElement}
      </div>
      {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </label>
  );
}
