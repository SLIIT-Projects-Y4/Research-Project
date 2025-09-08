const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);

const userSchema = new mongoose.Schema(
    {
        
        userID: {                      
            type: String,
            unique: true
        },
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
        travel_style: {
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

userSchema.pre("save", async function (next) {
    if (!this.isNew || this.userID) return next();

    try {
        const counter = await Counter.findOneAndUpdate(
            { name: "user" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        this.userID = `U${String(counter.seq).padStart(4, "0")}`; // e.g. U0001
        next();
    } catch (err) {
        next(err);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
