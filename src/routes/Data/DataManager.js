const router = require("express").Router();
const verifyManager = require("../utils/VerifyManager");

const User = require("../../models/User");

// fetch menu array from user model
router.get("/menu", async (req, res) => {
  const { shopName } = req.query;
  const user = await User.findOne({ shopName });
  if (!user) return res.status(204).send([]);

  if (user.menu.length === 0) return res.status(204).send([]);

  return res.status(200).send(user.menu);
});

// update menu array from user model
router.put("/menu", async (req, res) => {
  const { shopName, itemName, itemPrice } = req.body;
  const user = await User.findOne({ shopName });
  if (!user) return res.status(204).send("User not found");
  if (user.menu.some((item) => item.name === itemName))
    return res.status(409).send({ message: "Item already exists" });

  try {
    user.menu.push({ name: itemName, price: itemPrice });
    await user.save();
    return res.status(200).send("saved");
  } catch (err) {
    return res.status(500).send("Error while saving menu");
  }
});

// delete menu item from user model
router.delete("/menu", async (req, res) => {
  const { shopName, itemName } = req.query;
  const user = await User.findOne({ shopName });
  if (!user) return res.status(204).send("User not found");
  if (!user.menu.some((item) => item.name === itemName))
    return res.status(404).send({ message: "Item not found" });
  user.menu = user.menu.filter((item) => item.name !== itemName);
  try {
    await user.save();
    return res.status(200).send("deleted");
  } catch (err) {
    return res.status(500).send("Error while deleting menu");
  }
});

module.exports = router;
