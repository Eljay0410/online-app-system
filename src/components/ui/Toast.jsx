import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./toastContext";

const toneClass = {
  success: "border-emerald-200 bg-white text-slate-800",
  error: "border-red-200 bg-white text-slate-800",
  info: "border-blue-200 bg-white text-slate-800",
  warning: "border-amber-200 bg-white text-slate-800",
};

const accentClass = {
  success: "bg-emerald-500",
  error: "bg-red-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
};

const titleClass = {
  success: "Success",
  error: "Error",
  info: "Notice",
  warning: "Warning",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", message, duration = 3600 }) => {
      if (!message) return null;

      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setToasts((current) => [
        ...current.slice(-3),
        {
          id,
          type,
          message,
        },
      ]);

      window.setTimeout(() => dismissToast(id), duration);

      return id;
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-[112px] z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-[toastSlideIn_0.35s_ease-out] overflow-hidden rounded-xl border shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${
              toneClass[toast.type] || toneClass.info
            }`}
          >
            <div className="flex bg-white">
              <div
                className={`w-1.5 shrink-0 ${
                  accentClass[toast.type] || accentClass.info
                }`}
              />

              <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {titleClass[toast.type] || titleClass.info}
                  </p>

                  <p className="mt-0.5 break-words text-sm font-semibold leading-5 text-slate-800 [overflow-wrap:anywhere]">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Dismiss notification"
                >
                  &times;
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(32px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
