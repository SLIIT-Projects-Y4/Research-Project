require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const preferencesRoute = require("./src/routes/preferencesRoute");
const recoProxy = require("./src/routes/recoProxy");
const usersRoute = require("./src/routes/usersRoute"); // /api/users/me

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// db
mongoose
  .connect(process.env.DB_URI, { autoIndex: true })
  .then(() => console.log("🔌 MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// routes
app.use("/api/auth", authRoutes);
app.use("/api", preferencesRoute);
app.use("/api", recoProxy);
app.use("/api", usersRoute);

// health
app.get("/healthz", (req, res) => res.json({ status: "ok" }));

// boot
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Users API listening on :${port}`));
