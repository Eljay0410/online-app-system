import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectionRoutes from "./routes/connection.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

app.use("/", connectionRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});