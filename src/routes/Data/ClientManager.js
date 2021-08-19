const router = require("express").Router();

const User = require("../../models/User");

// get all hotel names
router.get("/hotel", async (req, res) => {
  const { shopName } = req.query;
  const user = await User.findOne({ shopName }).select("shopName");
  if (!user) return res.status(404).send("Not found");

  return res.status(200).send(user.shopName);
});

// fetch menu array from user model
router.get("/menu", async (req, res) => {
  const { shopName } = req.query;
  const user = await User.findOne({ shopName }).select("menu");
  if (!user) return res.status(404).send("Not found");

  if (user.menu.length === 0) return res.status(204).send("empty menu");
  return res.status(200).send(user.menu);
});

module.exports = router;
