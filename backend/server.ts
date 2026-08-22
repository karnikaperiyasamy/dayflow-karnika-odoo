import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDb } from "./db";
import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import attendanceRoutes from "./routes/attendance";
import leaveRoutes from "./routes/leave";
import payrollRoutes from "./routes/payroll";
import reportsRoutes from "./routes/reports";
import notificationRoutes from "./routes/notifications";

dotenv.config();
initDb();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "dayflow-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`DAYFLOW backend running on http://localhost:${PORT}`));
