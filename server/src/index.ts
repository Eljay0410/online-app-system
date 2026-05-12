import dotenv from "dotenv";
import app from "./app.js";
import { PORT } from "./config/env.js";

dotenv.config();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});