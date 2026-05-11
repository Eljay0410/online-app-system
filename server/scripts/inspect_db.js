import pool from "../src/config/db.js";

async function inspect() {
  try {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;`);
    console.log("users columns:", res.rows);
  } catch (err) {
    console.error("inspect error:", err.message || err);
  } finally {
    await pool.end();
  }
}

inspect();
