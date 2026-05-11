import app from "./app.js";
import { PORT } from "./config/env.js";
import { verifyMailer } from "./config/mailer.js";

verifyMailer();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
