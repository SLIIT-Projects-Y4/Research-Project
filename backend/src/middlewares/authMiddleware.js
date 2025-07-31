const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer "))
            return res.status(401).json({ error: "No token provided" });

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(401).json({ error: "Invalid token" });
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: "Authentication failed" });
    }
};

module.exports = authMiddleware;