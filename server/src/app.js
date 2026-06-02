import express from "express";
import cors from "cors";
import {
  allowedOrigins,
  isProduction,
  jsonBodyLimit,
  trustProxy,
} from "./config/env.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import activationRoutes from "./routes/activationRoutes.js";
import applicantManagementRoutes from "./routes/applicantManagementRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import jobOpeningRoutes from "./routes/jobOpeningRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import {
  corsOptions,
  errorHandler,
  notFoundHandler,
  requireJsonContent,
  securityHeaders,
} from "./middleware/security.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", trustProxy);

if (isProduction && allowedOrigins.length === 0) {
  console.warn(
    "CORS_ORIGIN is not configured. Production browser clients must be same-origin or explicitly allowed."
  );
}

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use("/api", requireJsonContent);
app.use(express.json({ limit: jsonBodyLimit, strict: true }));

app.get("/", (_req, res) => {
  res.send("Server is working");
});

app.use("/api", healthRoutes);
app.use("/api", apiLimiter);
app.use("/api", authRoutes);
app.use("/api", activityLogRoutes);
app.use("/api", fileRoutes);
app.use("/api", jobOpeningRoutes);
app.use("/api", applicantManagementRoutes);
app.use("/api", applicationRoutes);
app.use("/api", superAdminRoutes);
app.use("/api", activationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
