import { io } from "socket.io-client";

// Use env variable or fallback for local dev
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";

let socket;

// Lazily create a single socket instance
const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,                 // keep your autoConnect behavior
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
  }
  return socket;
};

export default getSocket();
