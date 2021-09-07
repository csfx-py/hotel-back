const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("auth");
  if (!token) return res.status(401).send("Unauthorized");

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SEC);
    if (!payload) return res.status(401).send("Unauthorized");
    if (!payload.admin) return res.status(401).send("Unauthorized");

    next();
  } catch (err) {
    console.log(err);
    res.status(401).send("Unauthorized. Error: " + err);
  }
};
