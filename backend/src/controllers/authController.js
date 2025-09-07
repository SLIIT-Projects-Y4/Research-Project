const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function computeOnboardingNeeded(user) {
  const coreDone =
    user.age_group &&
    user.gender &&
    user.travel_companion &&
    Array.isArray(user.preferred_activities) &&
    user.preferred_activities.length >= 2;
  return !coreDone;
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email, password required" });

    const exists = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      onboarding_completed: false,
    });

    return res.status(201).json({
      status: "created",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboarding_completed: user.onboarding_completed,
      },
      message: "Registration successful. Please log in.",
    });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ error: "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    const onboarding_needed = computeOnboardingNeeded(user);

    return res.json({
      status: "ok",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        onboarding_completed: user.onboarding_completed,
        onboarding_needed,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
};
