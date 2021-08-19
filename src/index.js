require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const app = express();
const cors = require("cors");
// const server = require("http").createServer(app);
// const io = require("socket.io")(server, {
//   cors: {
//     origin: "http://localhost:3000",
//   },
// });

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

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

const authRoutes = require("./routes/Auth/AuthManager");
const dataRoutes = require("./routes/Data/HotelManager");
const clientRoutes = require("./routes/Data/ClientManager");

// express routing
app.get("/", (req, res) => {
  res.send("hello");
});

app.use("/auth", authRoutes);
app.use("/hotel", dataRoutes);
app.use("/client", clientRoutes);

// socket.io handlers
// io.on("connection", (socket) => {
//   socket.on("pass", (data) => {
//     console.log(data);
//   });

//   socket.on("disconnect", () => {
//     socket.leave("hotel");
//   });
// });

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
