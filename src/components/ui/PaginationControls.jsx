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
      className={`flex min-w-0 flex-col items-center gap-2 border-t border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 sm:gap-3 sm:px-5 sm:py-4 sm:text-sm md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center md:justify-start md:text-left">
        <p className="whitespace-nowrap font-bold text-slate-600">
          Page <span className="text-slate-900">{currentPage}</span> /{" "}
          <span className="text-slate-900">{totalPages}</span>
        </p>
        <p className="whitespace-nowrap font-medium">
          Showing{" "}
          <span className="font-bold text-slate-900">{startEntry}-{endEntry}</span>{" "}
          of <span className="font-bold text-slate-900">{totalItems}</span>{" "}
          {itemLabel}
        </p>
      </div>

      <div className="flex w-full min-w-0 flex-col items-center gap-3 md:w-auto md:flex-row md:items-center md:justify-end md:gap-4">
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2 md:flex-nowrap md:justify-start">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canGoBack}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-slate-50 disabled:text-slate-300 sm:h-12 sm:gap-1 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Prev
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {pageItems.map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2.5 text-xs font-bold transition sm:h-12 sm:min-w-12 sm:rounded-xl sm:px-4 sm:text-sm ${
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
                  className="grid h-9 place-items-center px-0.5 text-xs font-bold text-slate-400 sm:h-12 sm:px-1 sm:text-sm"
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
            className="inline-flex h-9 shrink-0 items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-slate-50 disabled:text-slate-300 sm:h-12 sm:gap-1 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 sm:rounded-xl sm:p-2 md:shrink-0">
          <label className="flex h-8 shrink-0 items-center gap-1.5 px-1.5 sm:h-10 sm:gap-2 sm:px-2">
            <span className="whitespace-nowrap text-xs font-bold text-slate-600 sm:text-sm">
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
              className="h-8 w-14 rounded-lg border border-slate-200 bg-slate-50 px-1 text-center text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 sm:h-10 sm:w-20 sm:rounded-xl sm:px-2 sm:text-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => submitJump(jumpInputRef.current?.value)}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg bg-[#0056b3] px-3 text-xs font-bold text-white transition hover:bg-[#003a78] sm:h-10 sm:rounded-xl sm:px-4 sm:text-sm"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
