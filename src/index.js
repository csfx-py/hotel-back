require("dotenv").config();
const PORT = process.env.PORT || 5000;

const express = require("express");
const app = express();
const cors = require("cors");
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://hotel-engine.herokuapp.com"],
  },
});

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://hotel-engine.herokuapp.com"],
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

let tempOrders = [];

let clientSockets = [];

// socket.io handlers
io.on("connection", (socket) => {
  const { shopName, tableID } = socket.handshake.query;
  const id = socket.id;
  const user = tableID
    ? { shopName, tableID, items: [], id }
    : { shopName, id };

  if (!tableID) {
    if (!managerSockets.filter((s) => s.shopName === shopName).length)
      managerSockets.push(user);
    else {
      const index = managerSockets.findIndex((s) => s.shopName === shopName);
      managerSockets[index].id = id;
    }

    const clients = clientSockets.filter((s) => s.shopName === shopName);
    try {
      io.to(id).emit("managerOrder", clients);
    } catch (err) {
      console.log(err);
    }
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

  socket.on("clientOrder", (data) => {
    const manager = managerSockets.find((s) => s.shopName === shopName);

    const customer = clientSockets.find(
      (s) => s.shopName === shopName && s.tableID === tableID
    );
    customer.items = [...customer.items, ...data];

    tempOrders = [
      ...tempOrders,
      ...data.map((d) => {
        return { ...d, tableID, shopName };
      }),
    ];

    const clients = clientSockets.filter((s) => s.shopName === shopName);
    try {
      socket.to(manager.id).emit("managerOrder", clients);
      socket.to(manager.id).emit("managerNewOrder", tempOrders);
      io.to(id).emit("orders", customer.items);
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("removeTempItem", (data) => {
    tempOrders = tempOrders.filter((i) => i.id !== data.id);
    const newOrders = tempOrders.filter((i) => i.shopName === shopName);
    try {
      io.to(id).emit("managerNewOrder", newOrders);
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("removeItem", (data, table) => {
    const customer = clientSockets.find(
      (s) => s.shopName === shopName && s.tableID === table
    );

    const index = customer.items.findIndex((i) => i.id === data.id);
    customer.items.splice(index, 1);

    const clients = clientSockets.filter((s) => s.shopName === shopName);

    io.to(id).emit("managerOrder", clients);
    socket.to(customer.id).emit("orders", customer.items);
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
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
