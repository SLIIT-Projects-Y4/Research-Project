const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (user) =>
    jwt.sign(
        {
            userId: user._id,
            role: user.role,
            email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

// Register new user
const registerUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            country,
            age_group,
            gender,
            travel_companion,
            location_types,
            preferred_activities,
        } = req.body;

        if (await User.findOne({ email })) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            country,
            age_group,
            gender,
            travel_companion,
            location_types,
            preferred_activities,
        });

        await user.save();

        const token = generateToken(user);

        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                age_group: user.age_group,
                gender: user.gender,
                travel_companion: user.travel_companion,
                location_types: user.location_types,
                preferred_activities: user.preferred_activities,
                status: user.status,
            },
            token,
            message: "User registered successfully",
        });
    } catch (error) {
        res.status(500).json({ error: "Registration failed" });
    }
};

// Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.status !== "active") {
            return res.status(400).json({ error: "Invalid credentials or inactive account" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(400).json({ error: "Invalid credentials or inactive account" });

        const token = generateToken(user);

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                age_group: user.age_group,
                gender: user.gender,
                travel_companion: user.travel_companion,
                location_types: user.location_types,
                preferred_activities: user.preferred_activities,
                status: user.status,
            },
            message: "Login successful",
        });
    } catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
};

// Logout (JWT - frontend should delete token)
const logoutUser = (req, res) => {
    res.json({ message: "Logout successful (remove token client-side)" });
};

// Update own profile
const updateUserProfile = async (req, res) => {
    try {
        const {
            name,
            email,
            country,
            age_group,
            gender,
            travel_companion,
            location_types,
            preferred_activities,
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (email && email !== user.email) {
            const exists = await User.findOne({ email });
            if (exists) return res.status(409).json({ error: "Email already taken" });
            user.email = email;
        }
        if (name) user.name = name;
        if (country) user.country = country;
        if (age_group) user.age_group = age_group;
        if (gender) user.gender = gender;
        if (travel_companion) user.travel_companion = travel_companion;
        if (location_types) user.location_types = location_types;
        if (preferred_activities) user.preferred_activities = preferred_activities;

        await user.save();
        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                country: user.country,
                age_group: user.age_group,
                gender: user.gender,
                travel_companion: user.travel_companion,
                location_types: user.location_types,
                preferred_activities: user.preferred_activities,
                status: user.status,
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        res.status(500).json({ error: "Profile update failed" });
    }
};

// Delete own profile
const deleteUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: "User not found" });

        await User.deleteOne({ _id: user._id });
        res.json({ message: "User profile deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Delete profile failed" });
    }
};

// Admin: update user role
const updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
        const userId = req.params.userId;
        const { role } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (!["user", "merchant", "admin"].includes(role))
            return res.status(400).json({ error: "Invalid role" });

        user.role = role;
        await user.save();
        res.json({ user, message: "User role updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Role update failed" });
    }
};

// Admin: delete any user
const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });

        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        await User.deleteOne({ _id: user._id });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "User delete failed" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    updateUserProfile,
    deleteUserProfile,
    updateUserRole,
    deleteUser,
};
