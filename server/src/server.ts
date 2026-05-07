import dotenv from "dotenv";
import express from "express";
import connectionRoutes from "./routes/connection.routes";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/", connectionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});