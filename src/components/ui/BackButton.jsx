import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const circleClassName =
  "grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#2f7df4_0%,#1f6fe5_52%,#155bd1_100%)] text-white";

export default function BackButton({
  to,
  onClick,
  label,
  type = "button",
  disabled = false,
  className = "",
  ariaLabel,
}) {
  const labelText = ariaLabel || label || "Go back";
  const content = (
    <>
      <span className={circleClassName}>
        <ArrowLeft className="h-5 w-5" />
      </span>

      {label && (
        <span className="text-sm font-semibold text-slate-600 transition group-hover:text-blue-700">
          {label}
        </span>
      )}
    </>
  );

  const baseClassName = `group inline-flex items-center gap-3 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    disabled ? "cursor-not-allowed opacity-45" : ""
  } ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClassName} aria-label={labelText}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClassName}
      aria-label={labelText}
    >
      {content}
    </button>
  );
}
