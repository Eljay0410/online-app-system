import { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const defaultPageSizeOptions = [10, 25, 50];

function clampPage(value, totalPages) {
  const page = Number.parseInt(value, 10);

  if (!Number.isInteger(page)) return 1;
  return Math.min(Math.max(page, 1), totalPages);
}

export default function PaginationControls({
  page,
  pageSize,
  totalItems,
  currentCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = defaultPageSizeOptions,
  itemLabel = "entries",
  className = "",
}) {
  const totalPages = Math.max(1, Math.ceil(Number(totalItems || 0) / pageSize));
  const currentPage = clampPage(page, totalPages);
  const jumpInputRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    const options = new Set([...pageSizeOptions, pageSize].filter(Boolean));
    return Array.from(options).sort((a, b) => a - b);
  }, [pageSize, pageSizeOptions]);

  const visibleCount = Number(currentCount || 0);
  const startEntry =
    totalItems > 0 && visibleCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endEntry =
    totalItems > 0 && visibleCount > 0
      ? Math.min(startEntry + visibleCount - 1, totalItems)
      : 0;
  const canGoBack = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const submitJump = (value) => {
    const nextPage = clampPage(value, totalPages);
    onPageChange(nextPage);
  };

  if (Number(totalItems || 0) <= Math.min(...normalizedOptions)) {
    return null;
  }

  const pageItems = [];
  if (totalPages <= 5) {
    for (let item = 1; item <= totalPages; item += 1) {
      pageItems.push(item);
    }
  } else {
    pageItems.push(1);
    if (currentPage > 3) pageItems.push("start-ellipsis");
    for (
      let item = Math.max(2, currentPage - 1);
      item <= Math.min(totalPages - 1, currentPage + 1);
      item += 1
    ) {
      pageItems.push(item);
    }
    if (currentPage < totalPages - 2) pageItems.push("end-ellipsis");
    pageItems.push(totalPages);
  }

  return (
    <div
      className={`flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 text-sm text-slate-600 sm:px-5 xl:flex-row xl:items-center xl:justify-between ${className}`}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <p className="font-bold text-slate-600">
          Page <span className="text-slate-900">{currentPage}</span> /{" "}
          <span className="text-slate-900">{totalPages}</span>
        </p>
        <p className="font-medium">
          Showing{" "}
          <span className="font-bold text-slate-900">{startEntry}-{endEntry}</span>{" "}
          of <span className="font-bold text-slate-900">{totalItems}</span>{" "}
          {itemLabel}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
        <label className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs font-semibold uppercase text-slate-500">
            Rows
          </span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            {normalizedOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoBack}
            className="inline-flex h-12 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-slate-50 disabled:text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            {pageItems.map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={`grid h-12 min-w-12 place-items-center rounded-2xl border px-4 text-sm font-bold transition ${
                    item === currentPage
                      ? "border-[#0056b3] bg-[#0056b3] text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              ) : (
                <span
                  key={item}
                  className="grid h-12 place-items-center px-1 text-sm font-bold text-slate-400"
                >
                  ...
                </span>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canGoNext}
            className="inline-flex h-12 items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-slate-50 disabled:text-slate-300"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>

          <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3">
            <span className="whitespace-nowrap text-sm font-bold text-slate-600">
              Jump to
            </span>
            <input
              ref={jumpInputRef}
              key={currentPage}
              type="number"
              min="1"
              max={totalPages}
              defaultValue={currentPage}
              onBlur={(event) => submitJump(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              className="h-9 w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 text-center text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={() => submitJump(jumpInputRef.current?.value)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0056b3] px-5 text-sm font-bold text-white transition hover:bg-[#003a78]"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
