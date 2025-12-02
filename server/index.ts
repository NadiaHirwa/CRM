import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { initDb } from "./db";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

initDb();

app.get("/health", (_req, res) => {
  res.json({ status: "ok", app: "FLR Depot CRM" });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
});


