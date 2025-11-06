const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  medicines: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      duration: { type: String, required: true },
      // price: { type: Number },
    },
  ],
  tests: [
    {
      name: { type: String, required: true },
      // price: { type: Number },
    },
  ],
  bill: { type: Object },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Prescription", prescriptionSchema);