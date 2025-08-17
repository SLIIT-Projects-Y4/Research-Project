const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const [, token] = hdr.split(" ");
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role || "user" };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
