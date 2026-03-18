import express from "express";
import dotenv from "dotenv";
import http from "http";

import connectDB from "./config/db.js";

import timetableRoutes from "./routes/timetableRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";

import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { generateTimetableJob } from "./inngest/function/generateTimetable.js";

import { initSocket } from "./socket/socketServer.js";

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();

    const app = express();
    const server = http.createServer(app);

    /* ===============================
       SOCKET INIT
    =============================== */
    initSocket(server);

    /* ===============================
       GLOBAL MIDDLEWARES
    =============================== */
    app.use(express.json());

    /* ===============================
       CORS (FINAL FIX)
    =============================== */
    app.use((req, res, next) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://schedio-sable.vercel.app",
      ];

      const origin = req.headers.origin;

      if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }

      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS"
      );

      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      res.setHeader("Access-Control-Allow-Credentials", "true");

      // ✅ Handle preflight
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }

      next();
    });

    /* ===============================
       HEALTH CHECK
    =============================== */
    app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        message: "CP-SAT Timetable Generator running",
      });
    });

    /* ===============================
       INNGEST ROUTE
    =============================== */
    app.use(
      "/api/inngest",
      serve({
        client: inngest,
        functions: [generateTimetableJob],
      })
    );

    app.use("/api/test", testRoutes);

    /* ===============================
       APP ROUTES
    =============================== */
    app.use("/api/auth", authRoutes);
    app.use("/api/timetable", timetableRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/faculty", facultyRoutes);

    /* ===============================
       404 HANDLER
    =============================== */
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: "Route not found",
      });
    });

    const PORT = process.env.PORT || 5001;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Server start failed:", error);
    process.exit(1);
  }
};

startServer();