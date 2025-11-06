const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patient");
const doctorRoutes = require("./routes/doctor");
const receptionistRoutes = require("./routes/receptionist");
const frontendRoutes = require("./routes/frontendRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/receptionist", receptionistRoutes);
app.use("/", frontendRoutes);
app.use(express.static("public"));

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/hospitalDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});