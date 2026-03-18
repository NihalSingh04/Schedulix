import { io } from "socket.io-client";

const SOCKET_URL = "https://schedio-backend.onrender.com";

export const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"], // 🔥 IMPORTANT
  withCredentials: true,
});