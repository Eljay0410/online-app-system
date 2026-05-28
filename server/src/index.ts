import dotenv from "dotenv";
import app from "./app.js";
import { PORT, uploadRoot } from "./config/env.js";
import { verifyMailer } from "./config/mailer.js";
import { ensureDatabaseSchema } from "./config/schema.js";
import { ensureUploadRoot } from "./services/fileStorageService.js";

dotenv.config();

async function startServer() {
  await ensureDatabaseSchema();
  await ensureUploadRoot();
  verifyMailer();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Upload storage ready at ${uploadRoot}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error?.message || error);
  process.exit(1);
});
