import { io } from "socket.io-client";

// Connect to your backend server
const socket = io("http://localhost:7000", {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
