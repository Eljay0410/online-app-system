import express from "express";
import cors from "cors";
import { allowedOrigins } from "./config/env.js";
import activationRoutes from "./routes/activationRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import jobOpeningRoutes from "./routes/jobOpeningRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";

const app = express();

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/", (_req, res) => {
  res.send("Server is working");
});

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", jobOpeningRoutes);
app.use("/api", applicationRoutes);
app.use("/api", superAdminRoutes);
app.use("/api", activationRoutes);

export default app;
