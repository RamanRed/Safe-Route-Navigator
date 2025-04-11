const express = require("express");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const cors = require("cors");
const UserModel = require("./Model/model"); // ✅ Ensure correct import
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/maps")
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ Error connecting to MongoDB:", err));

// 🟢 User Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    try {
        const user = await UserModel.findOne({ Email: email });

        if (!user) {
            console.log("🚫 No such user found.");
            return res.status(404).json({ message: "User not found. Please register." });
        }

        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            console.log("❌ Incorrect password.");
            return res.status(401).json({ message: "Incorrect password" });
        }

        console.log("✅ Login successful.");
        const { Password, ...safeUser } = user._doc; // Exclude password from response
        res.status(200).json({ message: "Login successful", user: safeUser });

    } catch (err) {
        console.error("❌ Error during login:", err);
        res.status(500).json({ message: "Server error during login", error: err.message });
    }
});

// 🟢 Save Travel History
app.post("/save", async (req, res) => {
    const { email, start, destination, route } = req.body;
    console.log(`Saving travel history for: ${email}`);

    try {
        const user = await UserModel.findOne({ Email: email });

        if (!user) {
            console.log("🚫 No such user found.");
            return res.status(404).json({ message: "User not found." });
        }

        if (!start || !destination) {
            return res.status(400).json({ message: "Start and Destination are required." });
        }

        // ✅ Save travel record
        user.TravelHistory.push({ Start: start, Destination: destination, Route: route });
        await user.save();

        console.log("✅ Travel history saved.");
        res.status(200).json({ message: "Travel history updated successfully." });

    } catch (err) {
        console.error("❌ Error saving travel history:", err);
        res.status(500).json({ message: "Server error while saving travel history", error: err.message });
    }
});

// 🟢 User Registration
app.post("/register", async (req, res) => {
    const { Start, Destination, Email, Password } = req.body;

    try {
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(Password, 10);
        const newUser = new UserModel({
            Email,
            Password: hashedPassword,
            TravelHistory: [{ Start, Destination, Date: new Date() }]
        });

        await newUser.save();
        console.log("✅ User registered successfully.");
        res.status(201).json({ message: "User registered successfully", user: newUser });

    } catch (err) {
        console.error("❌ Error registering user:", err);
        res.status(500).json({ message: "Error saving data", error: err });
    }
});

// 🟢 Save Route with Full GeoJSON
app.post("/saveRoute", async (req, res) => {
    const { email, start, destination, route } = req.body;

    if (!email || !start || !destination || !route) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const user = await UserModel.findOne({ Email: email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.TravelHistory.push({ Start: start, Destination: destination, Route: route });

        await user.save();
        res.status(200).json({ message: "Route saved successfully", travelHistory: user.TravelHistory });
    } catch (err) {
        console.error("Error saving route:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
});

app.post("/saveContact", async (req, res) => {
    const { email, EmMail } = req.body;

    if (!email || !EmMail) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const user = await UserModel.findOne({ Email: email });
        if (!user) return res.status(404).json({ message: "User not found" });

        user.EmergencyContact.push({ Emmail: EmMail });
        await user.save();

        res.status(200).json({ message: "Contact saved successfully" });
    } catch (err) {
        console.error("Error saving contact:", err);
        res.status(500).json({ message: "Server error", error: err });
    }
});



app.get("/crime_open.csv", (req, res) => {
    const filePath = path.resolve("C:/Users/raman/Desktop/cep maps/my-map-app/public/crime_open.csv");
    res.sendFile(filePath);
  });


const port = 3001;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
