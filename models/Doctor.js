const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    approved: { type: Boolean, default: false },
    availableSlots: [
        {
            date: { type: Date, required: true },
            time: { type: String, required: true },
            isBooked: { type: Boolean, default: false },
        },
    ],
});

module.exports = mongoose.model("Doctor", doctorSchema);