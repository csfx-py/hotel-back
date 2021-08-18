const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 4,
    max: 30,
  },
  email: {
    type: String,
    required: true,
    min: 6,
    max: 30,
  },
  password: {
    type: String,
    required: true,
  },
  shopName: {
    type: String,
    required: true,
    min: 4,
    max: 30,
  },
  menu: {
    type: [
      {
        name: {
          type: String,
          required: true,
          min: 4,
          max: 30,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    default: [],
  },
  orders: {
    type: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        name: {
          type: String,
          required: true,
          min: 4,
          max: 30,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        items: [
          {
            name: {
              type: String,
              required: true,
              min: 4,
              max: 30,
            },
            qty: {
              type: Number,
              required: true,
              min: 0,
            },
          },
        ],
      },
    ],
    default: [],
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
