import express from "express";
import dotenv from "dotenv";
import cors from "cors";
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
       MIDDLEWARES
    =============================== */
    app.use(express.json());

    app.use(
      cors({
        origin: [
          "http://localhost:5173",
          process.env.FRONTEND_URL,
          "https://schedio-sable.vercel.app",
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // ✅ FIXED
      })
    );

    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "https://schedio-sable.vercel.app");
      res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    
      if (req.method === "OPTIONS") {
        return res.sendStatus(200);
      }
      next();
    });

    // ✅ IMPORTANT for prefligh

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