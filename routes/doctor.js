const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");

const mongoose = require("mongoose");

router.get("/appointments/:doctorId", async (req, res) => {
  try {
    const doctorObjectId = new mongoose.Types.ObjectId(req.params.doctorId);

    const appointments = await Appointment.find({
      doctorId: doctorObjectId,
      status: { $in: ["confirmed", "checked-in"] },
    }).populate("patientId", "name email");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create prescription
router.post("/prescriptions", async (req, res) => {
  try {
    const { appointmentId, doctorId, patientId, medicines, tests, notes } =
      req.body;

    const prescription = new Prescription({
      appointmentId,
      doctorId,
      patientId,
      medicines,
      tests,
      notes,
    });

    await prescription.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(appointmentId, { status: "completed" });

    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add available slots
router.post("/slots/:doctorId", async (req, res) => {
  try {
    const { date, time } = req.body;
    const doc = await Doctor.findOneAndUpdate(
      { userId: req.params.doctorId },
      { $push: { availableSlots: { date, time, isBooked: false } } }
    );
    console.log(doc);
    res.status(201).json({ message: "Slot added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/slots/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findOne(
      { userId: req.params.doctorId },
      { availableSlots: 1 }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Group slots by date
    const slotsByDate = {};
    doctor.availableSlots.forEach((slot) => {
      if (!slot.isBooked) {
        // Only include available slots
        const dateStr = slot.date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        if (!slotsByDate[dateStr]) {
          slotsByDate[dateStr] = [];
        }
        slotsByDate[dateStr].push(slot.time);
      }
    });

    res.status(200).json(slotsByDate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;