const express = require("express");

require("dotenv").config();

const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const server = require("http").createServer(app);
const onlineUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: "https://chat-flame-alpha.vercel.app",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
});

app.use(cors());
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log("Server is running on port " + port);
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "success" });
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("online", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online`);
    io.emit("isOnline", userId); // notify others

    // Optional: send current online users list to frontend
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });

  // Typing indicator
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);

    io.emit("typing", receiverId); // Optional: notify all users about typing

    if (receiverSocket) {
      io.to(receiverSocket).emit("typing", receiverId);
    }
  });

  socket.on("stop-typing", ({ senderId, receiverId }) => {
    const receiverSocket = onlineUsers.get(receiverId);
    io.emit("stop-typing", receiverId); // Optional: notify all users about stop typing
    if (receiverSocket) {
      io.to(receiverSocket).emit("stop-typing", senderId);
    }
  });

  // Chat message
  socket.on("message", (data) => {
    console.log(data, "data from the frontend");
    const receiverSocket = onlineUsers.get(data.reciverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit("messageReceived", data);
    }
    // Optionally also emit to sender so message reflects instantly
    socket.emit("messageReceived", data);
  });
  // Disconnect
  socket.on("disconnect", () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} went offline`);

        // Broadcast offline status with timestamp
        io.emit("userOffline", {
          userId,
          lastSeen: new Date().toISOString(),
        });

        break;
      }
    }
  });
});
