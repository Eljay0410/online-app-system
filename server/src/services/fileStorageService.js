import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  uploadDiskWarnPercent,
  uploadImageMaxHeight,
  uploadImageMaxWidth,
  uploadImageQuality,
  uploadRoot,
} from "../config/env.js";

export const allowedUploadMimeTypes = new Map([
  ["image/jpeg", { extension: ".jpg", previewType: "image" }],
  ["image/png", { extension: ".png", previewType: "image" }],
  ["image/webp", { extension: ".webp", previewType: "image" }],
  ["image/gif", { extension: ".gif", previewType: "image" }],
  ["application/pdf", { extension: ".pdf", previewType: "pdf" }],
  ["text/plain", { extension: ".txt", previewType: "text" }],
  ["application/msword", { extension: ".doc", previewType: "download" }],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    { extension: ".docx", previewType: "download" },
  ],
  ["application/vnd.ms-excel", { extension: ".xls", previewType: "download" }],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    { extension: ".xlsx", previewType: "download" },
  ],
  [
    "application/vnd.ms-powerpoint",
    { extension: ".ppt", previewType: "download" },
  ],
  [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    { extension: ".pptx", previewType: "download" },
  ],
]);

let sharpModulePromise;

function toPosixPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function sanitizePathPart(value, fallback = "item") {
  const cleaned = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  return cleaned || fallback;
}

function getDateParts(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return { year, month, day };
}

function getMimeFromSignature(buffer) {
  if (!buffer || buffer.length < 4) return "";

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (buffer.slice(0, 4).toString("ascii") === "GIF8") return "image/gif";

  if (
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  if (buffer.slice(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "application/zip";
  }

  if (
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  ) {
    return "application/x-ole-storage";
  }

  return "";
}

function isOfficeZipMime(mimeType) {
  return [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ].includes(mimeType);
}

function isLegacyOfficeMime(mimeType) {
  return [
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
  ].includes(mimeType);
}

export function assertAllowedUpload(file) {
  const mimeType = String(file?.mimetype || "").toLowerCase();

  if (!allowedUploadMimeTypes.has(mimeType)) {
    const error = new Error(
      "Unsupported file type. Upload images, PDFs, or common Office documents only."
    );
    error.statusCode = 415;
    throw error;
  }

  const signatureMime = getMimeFromSignature(file.buffer);
  const signatureMatches =
    signatureMime === mimeType ||
    (signatureMime === "application/zip" && isOfficeZipMime(mimeType)) ||
    (signatureMime === "application/x-ole-storage" &&
      isLegacyOfficeMime(mimeType)) ||
    (mimeType === "text/plain" && !signatureMime);

  if (!signatureMatches) {
    const error = new Error("The uploaded file content does not match its type.");
    error.statusCode = 415;
    throw error;
  }
}

async function loadSharp() {
  if (!sharpModulePromise) {
    sharpModulePromise = import("sharp")
      .then((module) => module.default || module)
      .catch((error) => {
        console.warn("Image optimization is disabled:", error?.message || error);
        return null;
      });
  }

  return sharpModulePromise;
}

async function optimizeImage(file) {
  if (!String(file.mimetype || "").startsWith("image/")) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      extension: allowedUploadMimeTypes.get(file.mimetype)?.extension || "",
      width: null,
      height: null,
    };
  }

  if (file.mimetype === "image/gif") {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      extension: ".gif",
      width: null,
      height: null,
    };
  }

  const sharp = await loadSharp();
  if (!sharp) {
    return {
      buffer: file.buffer,
      mimeType: file.mimetype,
      extension: allowedUploadMimeTypes.get(file.mimetype)?.extension || "",
      width: null,
      height: null,
    };
  }

  let pipeline = sharp(file.buffer, { failOnError: false })
    .rotate()
    .resize({
      width: uploadImageMaxWidth,
      height: uploadImageMaxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (file.mimetype === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (file.mimetype === "image/webp") {
    pipeline = pipeline.webp({ quality: uploadImageQuality });
  } else {
    pipeline = pipeline.jpeg({
      quality: uploadImageQuality,
      mozjpeg: true,
    });
  }

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const outputMimeType =
    info.format === "png"
      ? "image/png"
      : info.format === "webp"
      ? "image/webp"
      : "image/jpeg";

  return {
    buffer: data,
    mimeType: outputMimeType,
    extension: allowedUploadMimeTypes.get(outputMimeType)?.extension || ".jpg",
    width: info.width || null,
    height: info.height || null,
  };
}

export function safeResolveUploadPath(relativePath) {
  const absolutePath = path.resolve(uploadRoot, relativePath || "");
  const rootWithSeparator = uploadRoot.endsWith(path.sep)
    ? uploadRoot
    : `${uploadRoot}${path.sep}`;

  if (absolutePath !== uploadRoot && !absolutePath.startsWith(rootWithSeparator)) {
    const error = new Error("Invalid upload path.");
    error.statusCode = 400;
    throw error;
  }

  return absolutePath;
}

export async function ensureUploadRoot() {
  await fs.mkdir(uploadRoot, { recursive: true });
}

export async function storeRequirementFile({
  file,
  ownerUserId,
  jobOpeningId,
  requirementField,
  destination = "library",
}) {
  assertAllowedUpload(file);
  await ensureUploadRoot();

  const now = new Date();
  const { year, month, day } = getDateParts(now);
  const safeField = sanitizePathPart(requirementField, "requirement");
  const safeJobId = jobOpeningId ? sanitizePathPart(jobOpeningId, "job") : "draft";
  const relativeDir =
    destination === "application"
      ? path.join(
          "applicants",
          sanitizePathPart(ownerUserId, "user"),
          "applications",
          safeJobId,
          year,
          month,
          day
        )
      : path.join(
          "applicants",
          sanitizePathPart(ownerUserId, "user"),
          "library",
          safeField,
          year,
          month,
          day
        );
  const absoluteDir = safeResolveUploadPath(relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });

  const processed = await optimizeImage(file);
  const id = crypto.randomUUID();
  const storedName = `${safeField}-${Date.now()}-${id.slice(0, 12)}${
    processed.extension || allowedUploadMimeTypes.get(file.mimetype)?.extension || ""
  }`;
  const relativePath = toPosixPath(path.join(relativeDir, storedName));
  const absolutePath = safeResolveUploadPath(relativePath);

  await fs.writeFile(absolutePath, processed.buffer, { flag: "wx" });

  return {
    id,
    originalName: file.originalname || "upload",
    storedName,
    relativePath,
    mimeType: processed.mimeType || file.mimetype,
    sizeBytes: processed.buffer.length,
    originalSizeBytes: file.size || file.buffer.length,
    checksumSha256: crypto
      .createHash("sha256")
      .update(processed.buffer)
      .digest("hex"),
    previewType:
      allowedUploadMimeTypes.get(processed.mimeType || file.mimetype)
        ?.previewType || "download",
    width: processed.width,
    height: processed.height,
  };
}

export async function copyUploadedFileSnapshot({
  sourceFile,
  ownerUserId,
  jobOpeningId,
  jobApplicationId,
  requirementField,
}) {
  await ensureUploadRoot();

  const now = new Date();
  const { year, month, day } = getDateParts(now);
  const safeField = sanitizePathPart(requirementField, "requirement");
  const safeJobId = jobOpeningId ? sanitizePathPart(jobOpeningId, "job") : "job";
  const safeApplicationId = jobApplicationId
    ? sanitizePathPart(jobApplicationId, "application")
    : "application";
  const relativeDir = path.join(
    "applicants",
    sanitizePathPart(ownerUserId, "user"),
    "applications",
    safeJobId,
    safeApplicationId,
    year,
    month,
    day
  );
  const absoluteDir = safeResolveUploadPath(relativeDir);
  await fs.mkdir(absoluteDir, { recursive: true });

  const extension =
    allowedUploadMimeTypes.get(sourceFile.mime_type)?.extension ||
    path.extname(sourceFile.stored_name || sourceFile.original_name || "") ||
    "";
  const id = crypto.randomUUID();
  const storedName = `${safeField}-${Date.now()}-${id.slice(0, 12)}${extension}`;
  const relativePath = toPosixPath(path.join(relativeDir, storedName));

  await fs.copyFile(
    safeResolveUploadPath(sourceFile.relative_path),
    safeResolveUploadPath(relativePath)
  );

  return {
    id,
    originalName: sourceFile.original_name || "upload",
    storedName,
    relativePath,
    mimeType: sourceFile.mime_type,
    sizeBytes: Number(sourceFile.size_bytes || 0),
    originalSizeBytes:
      sourceFile.original_size_bytes === null ||
      sourceFile.original_size_bytes === undefined
        ? Number(sourceFile.size_bytes || 0)
        : Number(sourceFile.original_size_bytes),
    checksumSha256: sourceFile.checksum_sha256 || null,
    width: sourceFile.image_width || null,
    height: sourceFile.image_height || null,
  };
}

export async function removeStoredFile(relativePath) {
  if (!relativePath) return;

  await fs.unlink(safeResolveUploadPath(relativePath)).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
}

export function toClientFile(row = {}) {
  const previewType =
    allowedUploadMimeTypes.get(row.mime_type)?.previewType || "download";

  return {
    id: row.id,
    name: row.original_name || row.stored_name || "Uploaded file",
    size: Number(row.size_bytes || 0),
    type: row.mime_type || "",
    requirementField: row.requirement_field || "",
    requirementLabel: row.requirement_label || "",
    status: row.status || "",
    previewType,
    canPreview: ["image", "pdf", "text"].includes(previewType),
    previewUrl: `/api/files/${row.id}/preview`,
    downloadUrl: `/api/files/${row.id}/download`,
    uploadedAt: row.created_at,
  };
}

export async function getUploadStorageStats() {
  await ensureUploadRoot();

  if (typeof fs.statfs !== "function") {
    return {
      root: uploadRoot,
      supported: false,
      warningThresholdPercent: uploadDiskWarnPercent,
    };
  }

  const stats = await fs.statfs(uploadRoot);
  const totalBytes = Number(stats.blocks) * Number(stats.bsize);
  const freeBytes = Number(stats.bavail) * Number(stats.bsize);
  const usedBytes = Math.max(totalBytes - freeBytes, 0);
  const usedPercent = totalBytes
    ? Math.round((usedBytes / totalBytes) * 10000) / 100
    : 0;

  return {
    root: uploadRoot,
    supported: true,
    totalBytes,
    freeBytes,
    usedBytes,
    usedPercent,
    warningThresholdPercent: uploadDiskWarnPercent,
    isWarning: usedPercent >= uploadDiskWarnPercent,
  };
}
