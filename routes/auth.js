const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Receptionist = require("../models/Receptionist");

const JWT_SECRET = "your-secret-key-here";

router.post("/signup", async (req, res) => {
  try {
    const { password, role, name, email, specialization, licenseNumber } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = new User({ password, role, name, email });
    await user.save();

    if (role === "doctor") {
      const doctor = new Doctor({
        _id: user._id,
        userId: user._id,
        specialization,
        licenseNumber,
        approved: false,
        availableSlots: [],
      });
      await doctor.save();
    } else if (role === "receptionist") {
      const receptionist = new Receptionist({ userId: user._id });
      await receptionist.save();
    }

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }


    if (role === "doctor") {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor || !doctor.approved) {
        return res.status(403).json({ error: "Doctor not approved yet" });
      }
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "5h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;