const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");
const verifyAdmin = require("../utils/verifyAdmin");

const createToken = (user, secret, exp) => {
  const { name, shopName } = user;
  return jwt.sign(
    {
      name,
      shopName,
    },
    secret,
    { expiresIn: exp }
  );
};

router.post("/admin", async (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASS)
    return res.status(400).send("Incorrect password");
  return res.status(200).send(
    jwt.sign({ admin: true }, process.env.ACCESS_TOKEN_SEC, {
      expiresIn: "1h",
    })
  );
});

router.get("/users", verifyAdmin, async (req, res) => {
  const users = await User.find({}).select("name email shopName");
  if (!users) return res.status(400).send("No users found");
  return res.status(200).send(users);
});

router.delete("/users/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(400).send("User not found");
    return res.status(200).send("User deleted");
  } catch (err) {
    return res.status(500).send(err);
  }
});

router.post("/register", async (req, res) => {
  const { name, email, phone, password, shopName } = req.body;

  //check existing user
  const nameExists = await User.findOne({ name });
  if (nameExists) return res.status(400).send("Username already taken");
  //check existing email
  const mailExists = await User.findOne({ email });
  if (mailExists) return res.status(400).send("Email already registered");
  //check existing email
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) return res.status(400).send("Phone number already registered");
  //check existing shop name
  const shopExists = await User.findOne({ shopName });
  if (shopExists) return res.status(400).send("Shop name already taken");

  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash(password, salt);

  //register user
  const user = new User({
    name,
    email,
    phone,
    password: hashPass,
    shopName,
  });
  try {
    const savedUser = await user.save();
    res.status(200).send(createToken(user, process.env.ACCESS_TOKEN_SEC, "3d"));
  } catch (err) {
    res.status(500).send(err || "Internal Server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  const { name, password } = req.body;

  //   check exists
  const user = await User.findOne({ name });
  if (!user) return res.status(401).json("User not found");

  // authenticate
  const authenticaed = await bcrypt.compare(password, user.password);
  if (!authenticaed) return res.status(401).send("Incorrect password");

  res.send(createToken(user, process.env.ACCESS_TOKEN_SEC, "3d"));
});

router.post("/changePassword", async (req, res) => {
  const { name, oldPassword, newPassword } = req.body;

  //   check exists
  const user = await User.findOne({ name });
  if (!user) return res.status(401).json("User not found");

  // authenticate
  const authenticaed = await bcrypt.compare(oldPassword, user.password);
  if (!authenticaed) return res.status(401).send("Incorrect password");

  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash(newPassword, salt);

  try {
    user.password = hashPass;
    const savedUser = await user.save();
    res.status(200).send(createToken(user, process.env.ACCESS_TOKEN_SEC, "3d"));
  } catch (err) {
    res.status(500).send(err || "Internal Server error");
  }
});

module.exports = router;
