import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          "http://localhost:5173",
          "https://schedio-sable.vercel.app",
        ];

        // allow requests with no origin (like mobile apps / curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS not allowed"), false);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },

    // 🔥 IMPORTANT: polling first for Render
    transports: ["polling", "websocket"],
  });

  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("❌ Client disconnected:", socket.id, "| Reason:", reason);
    });

    socket.on("error", (err) => {
      console.error("🔥 Socket error:", err);
    });
  });

  return io;
};

// use anywhere in project
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};