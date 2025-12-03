import { io } from "socket.io-client";

// Connect to your backend server
const socket = io("http://localhost:7000", {
  transports: ["websocket"],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  autoConnect: true,
});

// Ensure socket connects
if (!socket.connected) {
  socket.connect();
}

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("reconnect", (attemptNumber) => {
  console.log("Socket reconnected after", attemptNumber, "attempts");
});

export default socket;
