const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  // Member 2: Poll events here
  // Member 3: Room / WebRTC events here
  // Member 4: Whiteboard events here
});

server.listen(3001, () => console.log("Socket server running on port 3001"));
