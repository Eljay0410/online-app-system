import multer from "multer";
import { uploadMaxFileSizeBytes } from "../config/env.js";
import { allowedUploadMimeTypes } from "../services/fileStorageService.js";

function fileFilter(_req, file, callback) {
  const mimeType = String(file?.mimetype || "").toLowerCase();

  if (!allowedUploadMimeTypes.has(mimeType)) {
    return callback(
      Object.assign(
        new Error(
          "Unsupported file type. Upload images, PDFs, or common Office documents only."
        ),
        { statusCode: 415 }
      )
    );
  }

  return callback(null, true);
}

export const requirementUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: uploadMaxFileSizeBytes,
    files: 1,
    fields: 6,
    fieldSize: 10 * 1024,
  },
});
