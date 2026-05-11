import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./src/config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations() {
  const res = await pool.query('SELECT name FROM migrations');
  return new Set(res.rows.map(r => r.name));
}

async function applyMigrations() {
  const migrationsDir = path.resolve(__dirname, "migrations");
  let files;
  try {
    files = await fs.readdir(migrationsDir);
  } catch {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  files = files.filter((file) => file.endsWith(".sql")).sort();

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const fileName of files) {
    if (applied.has(fileName)) {
      console.log("Skipping", fileName);
      continue;
    }

    const filePath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(filePath, 'utf8');
    try {
      console.log("Applying", fileName);
      await pool.query(sql);
      await pool.query("INSERT INTO migrations (name) VALUES ($1)", [fileName]);
      console.log("Applied", fileName);
    } catch (err) {
      console.error("Failed to apply migration", fileName, err.message || err);
      process.exit(1);
    }
  }

  console.log("Migrations complete");
  await pool.end();
}

applyMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
