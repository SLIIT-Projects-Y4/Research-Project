const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["user", "merchant", "admin"],
            default: "user"
        },
        country: {
            type: String
        },
        age_group: {
            type: String
        },
        gender: {
            type: String
        },
        travel_companion: {
            type: String
        },
        location_types: [{
            type: String
        }],
        preferred_activities: [{
            type: String
        }],
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        budget: {
            type: String
        }
    },
    {timestamps: true}
);

const User = mongoose.model("User", userSchema);
module.exports = User;
