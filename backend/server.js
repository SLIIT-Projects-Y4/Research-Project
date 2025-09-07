require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const preferencesRoute = require("./src/routes/preferencesRoute");
const recoProxy = require("./src/routes/recoProxy");
const usersRoute = require("./src/routes/usersRoute");
const locationsRoute = require('./src/routes/locationsRoute');
const planRoute = require('./src/routes/planRoute');
const itineraryProxy = require("./src/routes/itineraryProxy");
const plannerProxy = require("./src/routes/plannerProxy");
const locationsProxy = require("./src/routes/locationsProxy");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.DB_URI, { autoIndex: true })
  .then(() => console.log("🔌 MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.use("/api/auth", authRoutes);
app.use("/api", preferencesRoute);
app.use("/api", recoProxy);
app.use("/api", usersRoute);
app.use('/api', locationsRoute);
app.use('/api', planRoute);
app.use('/api', itineraryProxy)
app.use('/api', plannerProxy)
app.use('/api', itineraryProxy);
app.use('/api', plannerProxy);
app.use('/api', locationsProxy);

app.get("/healthz", (req, res) => res.json({ status: "ok" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Users API listening on : ${port}`));
