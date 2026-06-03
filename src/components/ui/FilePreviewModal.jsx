import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocViewer, { MSDocRenderer } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import { renderAsync } from "docx-preview";
import { ArrowLeft, Download, ExternalLink, Loader2, X } from "lucide-react";
import { API_BASE_URL, getAuthToken } from "../../lib/api";

const DOCUMENT_PREVIEW_FALLBACK =
  "Preview is not available for this document. You may download the file instead.";

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

function buildAbsoluteApiUrl(path = "") {
  const apiUrl = buildApiUrl(path);
  if (!apiUrl || apiUrl.startsWith("data:") || apiUrl.startsWith("blob:")) {
    return apiUrl;
  }

  try {
    return new URL(apiUrl, window.location.origin).href;
  } catch {
    return apiUrl;
  }
}

function canPreviewType(type) {
  return (
    type.startsWith("image/") ||
    type === "application/pdf" ||
    type === "text/plain"
  );
}

function getFileExtension(fileName = "") {
  const normalizedName = String(fileName || "").toLowerCase();
  const lastDotIndex = normalizedName.lastIndexOf(".");

  return lastDotIndex >= 0 ? normalizedName.slice(lastDotIndex) : "";
}

function isWordDocument(fileName = "", fileType = "") {
  const normalizedName = String(fileName || "").toLowerCase();

  return (
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalizedName.endsWith(".doc") ||
    normalizedName.endsWith(".docx")
  );
}

function isDocxDocument(fileName = "", fileType = "") {
  return (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    getFileExtension(fileName) === ".docx"
  );
}

function isLegacyDocDocument(fileName = "", fileType = "") {
  if (isDocxDocument(fileName, fileType)) return false;

  return fileType === "application/msword" || getFileExtension(fileName) === ".doc";
}

function getWordViewerFileType(fileName = "", fileType = "") {
  if (fileType) return fileType;
  if (isDocxDocument(fileName, fileType)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/msword";
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

function DocxPreview({ blob, fileName, onPreviewError }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!blob || !container) return () => {};

    let isActive = true;
    container.innerHTML = "";

    renderAsync(blob, container, undefined, {
      breakPages: true,
      ignoreHeight: false,
      ignoreLastRenderedPageBreak: false,
      ignoreWidth: false,
      inWrapper: true,
      renderAltChunks: true,
      renderComments: false,
      renderEndnotes: true,
      renderFooters: true,
      renderFootnotes: true,
      renderHeaders: true,
      useBase64URL: true,
    }).catch(() => {
      if (isActive) onPreviewError();
    });

    return () => {
      isActive = false;
      container.innerHTML = "";
    };
  }, [blob, onPreviewError]);

  return (
    <div
      className="oas-docx-preview min-h-[68vh] overflow-auto rounded-lg border border-slate-200 bg-white"
      aria-label={`Preview of ${fileName}`}
    >
      <div ref={containerRef} />
    </div>
  );
}

export default function FilePreviewModal({
  file,
  onClose,
  backLabel = "Back to details",
}) {
  const fileName = getFileName(file);
  const fileType = getFileType(file);
  const isWordFile = isWordDocument(fileName, fileType);
  const isDocxFile = isDocxDocument(fileName, fileType);
  const isLegacyDocFile = isLegacyDocDocument(fileName, fileType);
  const canInlinePreview =
    Boolean(file?.dataUrl) ||
    Boolean(file?.canPreview) ||
    canPreviewType(fileType) ||
    isWordFile;
  const [objectUrl, setObjectUrl] = useState(file?.dataUrl || "");
  const [isLoading, setIsLoading] = useState(
    Boolean(
      file?.previewUrl && !file?.dataUrl && canInlinePreview && !isLegacyDocFile
    )
  );
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewBlob, setPreviewBlob] = useState(null);
  const [previewFallbackMessage, setPreviewFallbackMessage] = useState("");
  const isImage = fileType.startsWith("image/") || file?.dataUrl?.startsWith("data:image/");
  const isPdf =
    fileType === "application/pdf" || file?.dataUrl?.startsWith("data:application/pdf");
  const isText = fileType === "text/plain";

  const downloadPath = useMemo(
    () => file?.downloadUrl || file?.previewUrl || "",
    [file]
  );
  const officeDocumentUrl = useMemo(
    () =>
      file?.previewUrl
        ? buildAbsoluteApiUrl(file.previewUrl)
        : objectUrl || file?.dataUrl || "",
    [file, objectUrl]
  );
  const wordViewerDocument = useMemo(
    () => [
      {
        uri: officeDocumentUrl,
        fileName,
        fileType: getWordViewerFileType(fileName, fileType),
      },
    ],
    [fileName, fileType, officeDocumentUrl]
  );
  const showDocumentPreviewFallback = useCallback(() => {
    setPreviewFallbackMessage(DOCUMENT_PREVIEW_FALLBACK);
  }, [setPreviewFallbackMessage]);

  useEffect(() => {
    let isMounted = true;
    let nextObjectUrl = "";
    const shouldLoadPreview = Boolean(
      file?.previewUrl && !file?.dataUrl && canInlinePreview && !isLegacyDocFile
    );
    const shouldLoadDataUrlBlob = Boolean(
      file?.dataUrl && isDocxFile && canInlinePreview
    );

    queueMicrotask(() => {
      if (!isMounted) return;
      setObjectUrl(file?.dataUrl || "");
      setPreviewBlob(null);
      setErrorMessage("");
      setPreviewFallbackMessage("");
      setIsLoading(shouldLoadPreview || shouldLoadDataUrlBlob);
    });

    if (!shouldLoadPreview && !shouldLoadDataUrlBlob) return () => {};

    const loadPreview = async () => {
      const blob = shouldLoadPreview
        ? await fetchProtectedBlob(file.previewUrl)
        : await fetch(file.dataUrl).then((response) => {
            if (!response.ok) throw new Error("Could not load this file.");
            return response.blob();
          });

      if (!isMounted) return;

      if (isDocxFile) {
        setPreviewBlob(blob);
      }

      if (!isDocxFile) {
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      }
    };

    loadPreview()
      .catch((error) => {
        if (!isMounted) return;

        if (isWordFile) {
          setPreviewFallbackMessage(DOCUMENT_PREVIEW_FALLBACK);
        } else {
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
  }, [canInlinePreview, file, isDocxFile, isLegacyDocFile, isWordFile]);

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

  const openInNewTab = async () => {
    if (!file?.dataUrl && !downloadPath) return;

    setIsOpening(true);
    setErrorMessage("");

    try {
      const url = file?.dataUrl
        ? file.dataUrl
        : URL.createObjectURL(await fetchProtectedBlob(downloadPath));
      const openedWindow = window.open(url, "_blank", "noopener,noreferrer");

      if (!openedWindow) {
        if (!file?.dataUrl) URL.revokeObjectURL(url);
        throw new Error("Your browser blocked the new tab.");
      }

      if (!file?.dataUrl) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      }
    } catch (error) {
      setErrorMessage(error.message || "Could not open this file.");
    } finally {
      setIsOpening(false);
    }
  };

  const fallbackMessage = isWordFile
    ? DOCUMENT_PREVIEW_FALLBACK
    : "Preview is not available for this file type.";

  const renderFallbackPanel = (message) => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center sm:px-6">
      <p className="text-sm font-semibold text-slate-800">{message}</p>
      <dl className="mt-4 grid w-full max-w-md gap-2 rounded-lg bg-slate-50 p-3 text-left text-sm">
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
          <dt className="font-semibold text-slate-500">File</dt>
          <dd className="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">
            {fileName}
          </dd>
        </div>
        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
          <dt className="font-semibold text-slate-500">Type</dt>
          <dd className="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">
            {fileType || "Unknown"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex w-full max-w-md flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={downloadFile}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0056b3] px-4 text-sm font-semibold text-white hover:bg-[#003a78]"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        {(downloadPath || file?.dataUrl) && (
          <button
            type="button"
            onClick={openInNewTab}
            disabled={isOpening}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {isOpening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Open in new tab
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-6"
      onClick={(event) => event.stopPropagation()}
    >
      <section className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              aria-label={backLabel}
              title={backLabel}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <h2 className="break-words text-base font-bold text-slate-950 [overflow-wrap:anywhere]">
                {fileName}
              </h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {fileType || "file"}
              </p>
            </div>
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
          ) : previewFallbackMessage ? (
            renderFallbackPanel(previewFallbackMessage)
          ) : canInlinePreview && objectUrl && isImage ? (
            <img
              src={objectUrl}
              alt={fileName}
              className="mx-auto max-h-[68vh] max-w-full rounded-lg bg-white object-contain shadow-sm"
            />
          ) : canInlinePreview && objectUrl && isPdf ? (
            <iframe
              title={fileName}
              src={objectUrl}
              className="h-[68vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : canInlinePreview && objectUrl && isText ? (
            <iframe
              title={fileName}
              src={objectUrl}
              className="h-[68vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : canInlinePreview && isDocxFile && previewBlob ? (
            <DocxPreview
              blob={previewBlob}
              fileName={fileName}
              onPreviewError={showDocumentPreviewFallback}
            />
          ) : canInlinePreview && isLegacyDocFile && officeDocumentUrl ? (
            <div className="h-[68vh] overflow-hidden rounded-lg border border-slate-200 bg-white">
              <DocViewer
                key={officeDocumentUrl}
                documents={wordViewerDocument}
                pluginRenderers={[MSDocRenderer]}
                config={{
                  header: {
                    disableHeader: true,
                  },
                  noRenderer: {
                    overrideComponent: () => (
                      <div className="flex h-full items-center justify-center p-6 text-center text-sm font-semibold text-slate-700">
                        {DOCUMENT_PREVIEW_FALLBACK}
                      </div>
                    ),
                  },
                }}
                style={{ height: "100%" }}
              />
            </div>
          ) : (
            renderFallbackPanel(fallbackMessage)
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {backLabel}
          </button>

          {(downloadPath || file?.dataUrl) && (
            <button
              type="button"
              onClick={openInNewTab}
              disabled={isOpening}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {isOpening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Open in new tab
            </button>
          )}

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
