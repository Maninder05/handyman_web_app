import { io } from "socket.io-client";

let socket;

const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000", {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

export default getSocket();
