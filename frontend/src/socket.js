import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // ✅ FIXED
});

// ✅ DEBUG (MUST HAVE)
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connect Error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Disconnected:", reason);
});