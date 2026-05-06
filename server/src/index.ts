import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateUniqueUAN } from "./services/uanService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* ================= UAN LOGIC ================= */
const usedUANs: string[] = [];

app.post("/generate-uan", async (_req, res) => {
  try {
    const uan = await generateUniqueUAN(async (candidate) => {
      return usedUANs.includes(candidate);
    });

    usedUANs.push(uan);

    res.json({
      success: true,
      uan,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
/* =========================================== */

app.get("/", (_req, res) => {
  res.send("Server is working 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});