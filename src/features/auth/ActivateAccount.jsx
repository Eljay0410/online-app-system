import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, LockKeyhole, MailCheck } from "lucide-react";
import { apiRequest } from "../../lib/api";

export default function ActivateAccount() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [purpose, setPurpose] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadToken() {
      if (!token) {
        setErrors({ form: "Missing activation token." });
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiRequest(`/api/activate?token=${encodeURIComponent(token)}`);
        if (!isMounted) return;
        setPurpose(result.purpose || "");
      } catch (error) {
        if (!isMounted) return;
        setErrors({ form: error.message || "Invalid or expired link." });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const validate = () => {
    const next = {};

    if (!token) {
      next.form = "Missing activation token.";
    }

    if (purpose === "password_reset") {
      if (!password) {
        next.password = "Password is required.";
      } else if (password.length < 8) {
        next.password = "Password must be at least 8 characters.";
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      await apiRequest("/api/activate", {
        method: "POST",
        body: JSON.stringify({
          token,
          ...(purpose === "password_reset" ? { password } : {}),
        }),
      });

      setIsDone(true);
      window.setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (error) {
      setErrors({ form: error.message || "Verification failed." });
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
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight text-slate-900">
              {purpose === "password_reset"
                ? "Password updated"
                : "Email verified"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0056b3]">
                {purpose === "password_reset" ? (
                  <LockKeyhole className="h-5 w-5" />
                ) : (
                  <MailCheck className="h-5 w-5" />
                )}
              </div>
              <h1 className="text-[26px] font-semibold tracking-tight text-slate-900">
                {purpose === "password_reset"
                  ? "Set a new password"
                  : "Verify your email"}
              </h1>
              <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-slate-500">
                {purpose === "password_reset"
                  ? "Choose a new password to finish the reset."
                  : "Confirm your account to start using the system."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
              {purpose === "password_reset" && (
                <>
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    error={errors.password}
                    icon={<LockKeyhole className="h-4 w-4" />}
                  />
                  <Field
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    error={errors.confirmPassword}
                    icon={<LockKeyhole className="h-4 w-4" />}
                  />
                </>
              )}

              {errors.form && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errors.form}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] px-4 font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {purpose === "password_reset" ? "Update Password" : "Verify Email"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              <Link to="/login" className="font-semibold text-[#0056b3]">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, error, icon, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <div
        className={`flex h-11 items-center gap-2 rounded-xl border bg-slate-50 px-3 ${
          error ? "border-red-500" : "border-slate-300"
        }`}
      >
        <span className="text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  );
}
