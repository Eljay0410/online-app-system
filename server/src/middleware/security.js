import {
  allowAnyCorsOrigin,
  isProduction,
  normalizedAllowedOrigins,
} from "../config/env.js";

const jsonBodyMethods = new Set(["POST", "PUT", "PATCH"]);
const allowedCorsMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const allowedCorsHeaders = [
  "Accept",
  "Authorization",
  "Content-Type",
  "X-Requested-With",
];
const exposedCorsHeaders = [
  "RateLimit-Limit",
  "RateLimit-Remaining",
  "RateLimit-Reset",
  "Retry-After",
  "X-RateLimit-Limit",
  "X-RateLimit-Remaining",
  "X-RateLimit-Reset",
];

function requestUsesHttps(req) {
  return (
    req.secure ||
    String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim()
      .toLowerCase() === "https"
  );
}

export const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowAnyCorsOrigin ||
      normalizedAllowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    const error = new Error("Origin is not allowed by CORS policy.");
    error.statusCode = 403;
    return callback(error);
  },
  methods: allowedCorsMethods,
  allowedHeaders: allowedCorsHeaders,
  exposedHeaders: exposedCorsHeaders,
  maxAge: 600,
  optionsSuccessStatus: 204,
};

export function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Origin-Agent-Cluster", "?1");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
  );

  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
  }

  if (isProduction && requestUsesHttps(req)) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return next();
}

export function requireJsonContent(req, res, next) {
  if (!jsonBodyMethods.has(req.method)) {
    return next();
  }

  const contentLength = Number.parseInt(
    req.headers["content-length"] || "0",
    10
  );
  const hasTransferEncoding = Boolean(req.headers["transfer-encoding"]);

  if (!contentLength && !hasTransferEncoding) {
    return next();
  }

  if (!req.is("application/json") && !req.is("multipart/form-data")) {
    return res.status(415).json({
      success: false,
      message: "Requests with a body must use application/json or multipart/form-data.",
    });
  }

  return next();
}

export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: req.path.startsWith("/api")
      ? "API endpoint not found."
      : "Resource not found.",
  });
}

export function errorHandler(error, _req, res, _next) {
  void _next;

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request body is too large.",
    });
  }

  if (error?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "Uploaded file is too large.",
    });
  }

  if (error?.code?.startsWith?.("LIMIT_")) {
    return res.status(400).json({
      success: false,
      message: "Upload request exceeded the allowed limits.",
    });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON request body.",
    });
  }

  if (error?.statusCode === 403 && /cors/i.test(error.message || "")) {
    return res.status(403).json({
      success: false,
      message: "Origin is not allowed.",
    });
  }

  console.error("Unhandled server error:", error);
  return res.status(error?.statusCode || 500).json({
    success: false,
    message: error?.statusCode ? error.message : "Internal server error.",
  });
}
