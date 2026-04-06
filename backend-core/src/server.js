const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows any frontend in dev
    methods: ["GET", "POST"]
  }
});

// In-memory mapping of socket to users
const users = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // -- Member 3: CORE ROOM EVENTS --
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    users[socket.id] = { roomId, userId };
    
    console.log(`User ${userId} joined room ${roomId}`);
    
    // Broadcast to others in the room
    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
  });

  // -- Member 3: POMODORO TIMER SYNC --
  socket.on("timer:state-change", (data) => {
    socket.to(data.roomId).emit("timer:sync", data);
  });

  // -- Member 3: WEBRTC SIGNALING (Voice) --
  socket.on("voice-offer", ({ offer, to }) => {
    socket.to(to).emit("voice-offer", { offer, from: socket.id });
  });

  socket.on("voice-answer", ({ answer, to }) => {
    socket.to(to).emit("voice-answer", { answer, from: socket.id });
  });

  socket.on("voice-ice-candidate", ({ candidate, to }) => {
    socket.to(to).emit("voice-ice-candidate", { candidate, from: socket.id });
  });

  // -- Disconnect Logic --
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = users[socket.id];
    if (user) {
      socket.to(user.roomId).emit("user-left", { userId: user.userId, socketId: socket.id });
      delete users[socket.id];
    }
  });

  // -- Note for Member 2 & 4 --
  // Do not modify the room joining or signaling above.
  // Add your poll/whiteboard events below or in a separate handler file and require it here.
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Socket server running on port ${PORT}`));

