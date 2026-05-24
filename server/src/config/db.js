import pg from "pg";
import "./env.js";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: Number.parseInt(process.env.DB_POOL_MAX || "20", 10),
  idleTimeoutMillis: Number.parseInt(
    process.env.DB_POOL_IDLE_TIMEOUT_MS || "30000",
    10
  ),
  connectionTimeoutMillis: Number.parseInt(
    process.env.DB_POOL_CONNECTION_TIMEOUT_MS || "5000",
    10
  ),
  query_timeout: Number.parseInt(process.env.DB_QUERY_TIMEOUT_MS || "30000", 10),
  statement_timeout: Number.parseInt(
    process.env.DB_STATEMENT_TIMEOUT_MS || "30000",
    10
  ),
});

export default pool;
