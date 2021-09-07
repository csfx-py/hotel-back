const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("auth");
  if (!token) return res.status(401).send("Unauthorized");

  try {
    jwt.verify(token, process.env.ACCESS_TOKEN_SEC);

    next();
  } catch (err) {
    res.status(401).send("Unauthorized. Error: " + err);
  }
};
