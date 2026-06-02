import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { API_BASE_URL, getAuthToken } from "../../lib/api";

function getFileName(file = {}) {
  return file.name || file.fileName || file.filename || "Uploaded file";
}

function getFileType(file = {}) {
  return String(file.type || file.mimeType || "").toLowerCase();
}

function buildApiUrl(path = "") {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;

  return `${API_BASE_URL}${path}`;
}

function canPreviewType(type) {
  return (
    type.startsWith("image/") ||
    type === "application/pdf" ||
    type === "text/plain"
  );
}

async function fetchProtectedBlob(path) {
  const token = getAuthToken();
  const response = await fetch(buildApiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Could not load this file.");
  }

  return response.blob();
}

export default function FilePreviewModal({ file, onClose }) {
  const [objectUrl, setObjectUrl] = useState(file?.dataUrl || "");
  const [isLoading, setIsLoading] = useState(
    Boolean(file?.previewUrl && !file?.dataUrl)
  );
  const [errorMessage, setErrorMessage] = useState("");
  const fileName = getFileName(file);
  const fileType = getFileType(file);
  const canPreview = file?.dataUrl || file?.canPreview || canPreviewType(fileType);
  const isImage = fileType.startsWith("image/") || file?.dataUrl?.startsWith("data:image/");
  const isPdf =
    fileType === "application/pdf" || file?.dataUrl?.startsWith("data:application/pdf");
  const isText = fileType === "text/plain";

  const downloadPath = useMemo(
    () => file?.downloadUrl || file?.previewUrl || "",
    [file]
  );

  useEffect(() => {
    let isMounted = true;
    let nextObjectUrl = "";

    if (!file?.previewUrl || file?.dataUrl) return () => {};

    fetchProtectedBlob(file.previewUrl)
      .then((blob) => {
        if (!isMounted) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error.message || "Could not load this file.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [file]);

  const downloadFile = async () => {
    try {
      const blob = file?.dataUrl
        ? await fetch(file.dataUrl).then((response) => response.blob())
        : await fetchProtectedBlob(downloadPath);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage(error.message || "Could not download this file.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-6">
      <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="break-words text-base font-bold text-slate-950 [overflow-wrap:anywhere]">
              {fileName}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {fileType || "file"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close file preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-[320px] flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
          {isLoading ? (
            <div className="flex h-[50vh] items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading preview...
            </div>
          ) : errorMessage ? (
            <div className="flex h-[50vh] items-center justify-center text-center text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          ) : canPreview && objectUrl && isImage ? (
            <img
              src={objectUrl}
              alt={fileName}
              className="mx-auto max-h-[68vh] max-w-full rounded-lg bg-white object-contain shadow-sm"
            />
          ) : canPreview && objectUrl && isPdf ? (
            <iframe
              title={fileName}
              src={objectUrl}
              className="h-[68vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : canPreview && objectUrl && isText ? (
            <iframe
              title={fileName}
              src={objectUrl}
              className="h-[68vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="flex h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
              <p className="text-sm font-semibold text-slate-800">
                Preview is not available for this document type.
              </p>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Word documents need PDF conversion for inline preview. For now,
                use the secure download fallback.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>

          <button
            type="button"
            onClick={downloadFile}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </section>
    </div>
  );
}
