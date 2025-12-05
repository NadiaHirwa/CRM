import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { initDb } from "./db";
import authRoutes from "./routes/authRoutes";
import customersRoutes from "./routes/customersRoutes";
import retailersRoutes from "./routes/retailersRoutes";
import productsRoutes from "./routes/productsRoutes";
import ordersRoutes from "./routes/ordersRoutes";
import complaintsRoutes from "./routes/complaintsRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import transactionsRoutes from "./routes/transactionsRoutes";
import notificationsRoutes from "./routes/notificationsRoutes";

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
app.use("/api/customers", customersRoutes);
app.use("/api/retailers", retailersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/complaints", complaintsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/notifications", notificationsRoutes);

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
});


