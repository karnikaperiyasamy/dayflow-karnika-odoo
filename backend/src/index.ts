import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth";
import employeeRoutes from "./routes/employees";
import attendanceRoutes from "./routes/attendance";
import leaveRoutes from "./routes/leave";
import payrollRoutes from "./routes/payroll";
import dashboardRoutes from "./routes/dashboard";
import notificationRoutes from "./routes/notifications";
import reportRoutes from "./routes/reports";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "dayflow-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: "Route not found." }));

// Generic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dayflow backend running on port ${PORT}`);
});
