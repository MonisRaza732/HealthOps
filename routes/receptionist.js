const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

router.get("/appointments/confirmed", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "confirmed" })
      .populate("patientId", "name")
      .populate({
        path: "doctorId",
        select: "name",
        model: "User",
      });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/appointments/completed", async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "completed" })
      .populate("patientId", "name")
      .populate({
        path: "doctorId",
        select: "name",
        model: "User",
      });

    const appointmentsWithPrescriptions = await Promise.all(
      appointments.map(async (appointment) => {
        const prescription = await Prescription.findOne({
          appointmentId: appointment._id,
        }).select("medicines tests notes -_id");

        const appointmentObj = appointment.toObject();
        appointmentObj.prescription = prescription || null;

        return appointmentObj;
      })
    );

    res.json(appointmentsWithPrescriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/appointments/:id/checkin", async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "checked-in",
        checkedInAt: new Date(),
      },
      { new: true }
    );

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/appointments/:id/checkout", async (req, res) => {
  try {
    const { billAmount, medicines, tests, otherCharges, notes } = req.body;

    if (!billAmount || !medicines) {
      return res
        .status(400)
        .json({ error: "Bill amount and medicines are required" });
    }

    const prescription = await Prescription.findOneAndUpdate(
      { appointmentId: req.params.id },
      {
        completedAt: new Date(),
        bill: {
          amount: billAmount,
          medicines: medicines || [],
          tests: tests || [],
          otherCharges: otherCharges || 0,
        },
      },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      prescription,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/doctors/:id/approve", async (req, res) => {
  try {
    console.log(req.params);
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/doctors/pending", async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approved: false });

    const pendingDoctorsWithDetails = await Promise.all(
      pendingDoctors.map(async (doctor) => {
        const user = await User.findById(doctor.userId);
        return {
          _id: doctor._id,
          userId: doctor.userId,
          specialization: doctor.specialization,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      })
    );

    res.json(pendingDoctorsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/doctors/approved", async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approved: true });

    const pendingDoctorsWithDetails = await Promise.all(
      pendingDoctors.map(async (doctor) => {
        const user = await User.findById(doctor.userId);
        return {
          _id: doctor._id,
          userId: doctor.userId,
          specialization: doctor.specialization,
          availableSlots: doctor.availableSlots,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      })
    );

    res.json(pendingDoctorsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;