import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://schedio-sable.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"], // 🔥 fallback support
  });

  io.on("connection", (socket) => {
    console.log("⚡ Client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("❌ Client disconnected:", socket.id, "| Reason:", reason);
    });

    // 🔥 optional debug
    socket.on("error", (err) => {
      console.error("Socket error:", err);
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