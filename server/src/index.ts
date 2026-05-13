import dotenv from "dotenv";
import app from "./app.js";
import { PORT } from "./config/env.js";
import { ensureDatabaseSchema } from "./config/schema.js";

dotenv.config();

async function startServer() {
  await ensureDatabaseSchema();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error?.message || error);
  process.exit(1);
});
