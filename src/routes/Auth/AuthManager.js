const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../../models/User");

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

router.post("/register", async (req, res) => {
  const { name, email, password, shopName } = req.body;

  //check existing user
  const nameExists = await User.findOne({ name });
  if (nameExists) return res.status(400).send("Username already taken");
  //check existing email
  const mailExists = await User.findOne({ email });
  if (mailExists) return res.status(400).send("Email already registered");
  //check existing shop name
  const shopExists = await User.findOne({ shopName });
  if (shopExists) return res.status(400).send("Shop name already taken");

  const salt = await bcrypt.genSalt(10);
  const hashPass = await bcrypt.hash(password, salt);

  //register user
  const user = new User({
    name,
    email,
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
