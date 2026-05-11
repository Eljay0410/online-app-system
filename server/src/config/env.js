import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

export const PORT = process.env.SERVER_PORT || process.env.API_PORT || 5000;

export const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  process.env.CLIENT_URL ||
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
