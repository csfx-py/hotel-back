require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.json());
app.use(cors());

const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(
  MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  (err) => {
    if (err) return console.error(err);
    console.log("Connected to DB");
  }
);

// express routing
app.get("/", (req, res) => {
  res.send("hello");
});

// socket.io handlers
io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on("pass", (data) => {
    console.log(data);
  });
  socket.on("disconnect", () => {
    socket.leave("hotel");
  });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
