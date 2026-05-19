import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

export const nodeEnv = process.env.NODE_ENV || "development";
export const isProduction = nodeEnv === "production";

export const PORT =
  Number(process.env.SERVER_PORT || process.env.API_PORT) || 5000;

function splitCsv(value = "") {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function normalizeOrigin(origin) {
  if (origin === "*") return origin;

  try {
    return new URL(origin).origin;
  } catch {
    return origin.replace(/\/$/, "");
  }
}

const configuredOrigins = splitCsv(
  process.env.CORS_ORIGIN || process.env.CLIENT_URL || ""
).map(normalizeOrigin);

const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export const allowedOrigins = (
  configuredOrigins.length || isProduction
    ? configuredOrigins
    : developmentOrigins
);

export const clientUrl = (
  process.env.CLIENT_URL ||
  allowedOrigins[0] ||
  "http://localhost:5173"
).replace(/\/$/, "");

export const jsonBodyLimit = process.env.JSON_BODY_LIMIT || "10mb";

export const trustProxy = (() => {
  const rawValue = String(
    process.env.TRUST_PROXY || (isProduction ? "1" : "false")
  ).trim();

  if (rawValue === "true") return true;
  if (rawValue === "false" || rawValue === "0") return false;

  const numericValue = Number.parseInt(rawValue, 10);
  return Number.isInteger(numericValue) ? numericValue : rawValue;
})();

export const allowAnyCorsOrigin =
  !isProduction && allowedOrigins.includes("*");

export const normalizedAllowedOrigins = unique(
  allowedOrigins.filter((origin) => origin !== "*")
);
