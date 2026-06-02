import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";

const emptyFilter = {
  date: "",
  dateFrom: "",
  dateTo: "",
};

function getActiveLabel(value = emptyFilter) {
  if (value.date) return `Date: ${value.date}`;
  if (value.dateFrom && value.dateTo) return `${value.dateFrom} to ${value.dateTo}`;
  if (value.dateFrom) return `From ${value.dateFrom}`;
  if (value.dateTo) return `Until ${value.dateTo}`;
  return "";
}

export default function DateFilterControl({
  value = emptyFilter,
  onChange,
  label = "Date Filter",
}) {
  const valueDate = value.date || "";
  const valueDateFrom = value.dateFrom || "";
  const valueDateTo = value.dateTo || "";
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState({
    date: valueDate,
    dateFrom: valueDateFrom,
    dateTo: valueDateTo,
  });
  const activeLabel = getActiveLabel(value);

  useEffect(() => {
    if (isOpen) return undefined;

    let isActive = true;
    const nextDraft = {
      date: valueDate,
      dateFrom: valueDateFrom,
      dateTo: valueDateTo,
    };

    queueMicrotask(() => {
      if (isActive) setDraft(nextDraft);
    });

    return () => {
      isActive = false;
    };
  }, [isOpen, valueDate, valueDateFrom, valueDateTo]);

  const updateDraft = (field, nextValue) => {
    setDraft((current) => ({
      ...current,
      ...(field === "date" && nextValue ? { dateFrom: "", dateTo: "" } : {}),
      ...((field === "dateFrom" || field === "dateTo") && nextValue
        ? { date: "" }
        : {}),
      [field]: nextValue,
    }));
  };

  const applyFilter = () => {
    onChange?.({
      date: draft.date || "",
      dateFrom: draft.date ? "" : draft.dateFrom || "",
      dateTo: draft.date ? "" : draft.dateTo || "",
    });
    setIsOpen(false);
  };

  const clearFilter = () => {
    setDraft(emptyFilter);
    onChange?.(emptyFilter);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">{label}</span>
        </button>

        {activeLabel && (
          <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
            <span className="truncate">{activeLabel}</span>
            <button
              type="button"
              onClick={clearFilter}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-md hover:bg-blue-100"
              aria-label="Clear date filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center overflow-y-auto bg-slate-950/55 p-3 sm:items-center sm:p-6">
          <section className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{label}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Filter records by a specific date or by a date range.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close date filter"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Specific date
                </span>
                <input
                  type="date"
                  value={draft.date || ""}
                  onChange={(event) => updateDraft("date", event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    Start date
                  </span>
                  <input
                    type="date"
                    value={draft.dateFrom || ""}
                    onChange={(event) =>
                      updateDraft("dateFrom", event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">
                    End date
                  </span>
                  <input
                    type="date"
                    value={draft.dateTo || ""}
                    onChange={(event) =>
                      updateDraft("dateTo", event.target.value)
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={clearFilter}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Clear Filter
              </button>
              <button
                type="button"
                onClick={applyFilter}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
              >
                Apply Filter
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
