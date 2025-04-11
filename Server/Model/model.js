const mongoose = require("mongoose");

const travelSchema = new mongoose.Schema({
    Start: String,
    Destination: String,
    Date: { type: Date, default: Date.now },
    Route: { type: Object }, // Stores the full route GeoJSON
});

const emEmail = new mongoose.Schema({
    Emmail: String,
     // Stores the full route GeoJSON
});

const userSchema = new mongoose.Schema({
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    TravelHistory: [travelSchema], // Store multiple trips
    EmergencyContact: [emEmail],
});

const UserModel = mongoose.model("users", userSchema);
module.exports = UserModel;
