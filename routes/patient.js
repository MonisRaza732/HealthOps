const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");


router.get("/doctors/:specialization", async (req, res) => {
  try {
    const doctors = await Doctor.find({
      specialization: req.params.specialization,
      approved: true,
      userId: { $ne: null }, 
    }).populate({
      path: "userId",
      select: "name", 
      model: "User", 
    });

    
    const doctorsWithNames = doctors.map((doctor) => ({
      ...doctor.toObject(),
      name: doctor.userId?.name || "Unknown",
    }));

    res.json(doctorsWithNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/slots/:doctorId", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const availableSlots = doctor.availableSlots.filter(
      (slot) => !slot.isBooked
    );
    res.json(availableSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/appointments", async (req, res) => {
  try {
    const { patientId, doctorId, date, time, age, gender, reason, phone } =
      req.body;

    
    const appointment = new Appointment({
      patientId,
      doctorId,
      age,
      gender,
      phone,
      date,
      time,
      reason,
      status: "confirmed",
    });
    await appointment.save();

    await Doctor.updateOne(
      {
        _id: doctorId,
        "availableSlots.date": date,
        "availableSlots.time": time,
      },
      { $set: { "availableSlots.$.isBooked": true } }
    );

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/appointments/:patientId", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patientId: req.params.patientId,
    }).populate({
      path: "doctorId",
      select: "userId specialization",
      populate: {
        path: "userId",
        select: "name",
      },
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/prescriptions/:patientId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
    }).populate({
      path: "doctorId",
      select: "name",
      model: "User",
    });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/prescriptions/bill/:patientId", async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patientId: req.params.patientId,
      bill: { $exists: true }, 
    }).select("_id bill"); 

    res.json(
      prescriptions.map((p) => ({
        prescriptionId: p._id,
        bill: p.bill,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete("/appointments/:appointmentId", async (req, res) => {
  try {
    
    const appointment = await Appointment.findById(
      req.params.appointmentId
    ).populate({
      path: "doctorId",
      select: "userId availableSlots",
    });

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    
    await Appointment.findByIdAndDelete(req.params.appointmentId);

    
    if (appointment.doctorId && appointment.date && appointment.time) {
      await Doctor.findByIdAndUpdate(appointment.doctorId._id, {
        $push: {
          availableSlots: {
            date: appointment.date,
            time: appointment.time,
            isBooked: false,
          },
        },
      });

    }

    res.json({
      message: "Appointment deleted successfully and availability restored",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;