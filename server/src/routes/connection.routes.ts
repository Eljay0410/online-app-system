import express, { Request, Response } from "express";
import pool from "../config/db";

const router = express.Router();

router.get("/connection", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT current_database(), current_user, NOW()"
    );

    res.json({
      success: true,
      message: "Database connected successfully",
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);
  
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;