require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

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

let managerSockets = [];

let clientSockets = [];

// socket.io handlers
io.on("connection", (socket) => {
  const { shopName, tableID } = socket.handshake.query;
  const id = socket.id;
  const user = { shopName, tableID, items: [], id };

  if (!tableID) {
    if (!managerSockets.filter((s) => s.shopName === shopName).length)
      managerSockets.push(user);
    else {
      const index = managerSockets.findIndex((s) => s.shopName === shopName);
      managerSockets[index].id = id;
    }

    const clients = clientSockets.filter((s) => s.shopName === shopName);
    io.to(id).emit("managerOrder", clients);
  }

  if (tableID) {
    if (
      !clientSockets.filter(
        (s) => s.shopName === shopName && s.tableID === tableID
      ).length
    )
      clientSockets.push(user);
    else {
      const index = clientSockets.findIndex(
        (s) => s.shopName === shopName && s.tableID === tableID
      );
      clientSockets[index].id = id;
    }

    const manager = managerSockets.find((s) => s.shopName === shopName);
    const clients = clientSockets.filter((s) => s.shopName === shopName);
    const client = clients.find(
      (s) => s.shopName === shopName && s.tableID === tableID
    );
    try {
      socket.to(manager.id).emit("managerOrder", clients);
      io.to(id).emit("orders", client.items);
    } catch (e) {
      console.log(e);
    }
  }

  // socket.emit("message", "connected");

  socket.on("clientOrder", (data, client) => {
    const manager = managerSockets.find((s) => s.shopName === shopName);

    const customer = clientSockets.find(
      (s) => s.shopName === shopName && s.tableID === tableID
    );
    customer.items = [...customer.items, ...data];

    const clients = clientSockets.filter((s) => s.shopName === shopName);
    socket.to(manager.id).emit("managerOrder", clients);
    socket.to(customer.id).emit("orders", customer.items);
    socket.to(manager.id).emit("managerNewOrder", data, client);
    io.to(id).emit("orders", customer.items);
  });

  socket.on("removeItem", (data, client) => {
    const manager = managerSockets.find((s) => s.shopName === shopName);

    const customer = clientSockets.find(
      (s) => s.shopName === shopName && s.tableID === client
    );

    customer.items = customer.items.filter((i) => i.id !== data.id);

    const clients = clientSockets.filter((s) => s.shopName === shopName);
    io.to(manager.id).emit("managerOrder", clients);
  });

  socket.on("removeConn", (table) => {
    const client = clientSockets.find(
      (s) => s.shopName === shopName && s.tableID === table
    );
    socket.to(client.id).emit("complete");
    socket.emit("message", `${table} disconnected`);
    clientSockets = clientSockets.filter(
      (c) => c.shopName !== shopName && c.tableID !== table
    );
    const clients = clientSockets.filter((s) => s.shopName === shopName);
    io.to(id).emit("managerOrder", clients);
  });

  // socket.on("disconnect", () => {
  //   socket.leave("hotel");
  // });
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
