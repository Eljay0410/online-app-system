import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* CREATE JOB */
app.post("/api/jobs", async (req, res) => {
  try {
    const { title, location, vacancy, deadline } = req.body;

    const result = await pool.query(
      `
      INSERT INTO jobs (
        title,
        location,
        vacancy,
        deadline
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [title, location, vacancy, deadline]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create job",
    });
  }
});

/* GET ALL JOBS */
app.get("/api/jobs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM jobs
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch jobs",
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});