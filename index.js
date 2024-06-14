const express = require("express");

require("dotenv").config();

const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const server = require("http").createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
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

  socket.on("message", (data) => {
    console.log(data, "data form the fronend");
    io.emit("messageReceived", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});
