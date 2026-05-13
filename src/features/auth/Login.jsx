import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import imageSample from "../../assets/imagesample.svg";
import { apiRequest } from "../../lib/api";
import { getRoleHomePath, storeUser } from "./auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateForgotPassword = () => {
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!validateLogin()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const user = storeUser(result.user);
      const nextPath = searchParams.get("next");

      if (user.role === "applicant" && !user.profileComplete) {
        navigate("/apply", { replace: true });
        return;
      }

      navigate(
        nextPath?.startsWith("/") ? nextPath : getRoleHomePath(user.role),
        { replace: true }
      );
    } catch (err) {
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

    if (!validateForgotPassword()) return;

    setIsSubmitting(true);

    try {
      const result = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage(result.message || "Password setup instructions were sent.");
      setPassword("");
    } catch (err) {
      setErrors({
        form:
          err.message ||
          "Could not process password reset. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setMessage("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex pt-10">
      <div className="w-full max-w-md bg-white flex flex-col justify-center px-10 py-12 shadow-md">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-slate-900">
            {mode === "login" ? "Welcome" : "Reset Password"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Log in with your account credentials."
              : "Enter your email to receive a password setup link."}
          </p>
        </div>

        <form
          onSubmit={mode === "login" ? handleLogin : handleForgotPassword}
          className="space-y-5"
          noValidate
        >
          <div>
            <label className="text-sm font-medium text-slate-600">
              Email <span className="text-red-500">*</span>
            </label>
            <div className={fieldClass("email")}>
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  clearFieldError("email");
                }}
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                autoComplete="email"
              />
            </div>
            {errorText("email")}
          </div>

          {mode === "login" && (
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
                  autoComplete="current-password"
                />
              </div>
              {errorText("password")}
            </div>
          )}

          {errors.form && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errors.form}
            </div>
          )}

          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] font-semibold text-white transition hover:bg-[#003a78] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Login" : "Send Password Link"}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === "login" ? (
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Back to login
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-6 text-center">
          New applicant? Complete the first-time application form{" "}
          <Link
            to="/apply"
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            here
          </Link>
          .
        </p>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-blue-600">
        <img
          src={imageSample}
          alt="Login Illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
