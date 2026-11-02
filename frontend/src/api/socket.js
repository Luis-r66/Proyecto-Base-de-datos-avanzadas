import { io } from "socket.io-client";
import { TOKEN_KEY } from "./client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const socketUrl = new URL(apiUrl).origin;

export function crearSocket() {
  return io(socketUrl, {
    auth: { token: localStorage.getItem(TOKEN_KEY) || "" },
    transports: ["websocket", "polling"],
  });
}
