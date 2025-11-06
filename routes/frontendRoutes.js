// frontendRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/landing.html"));
});

router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

router.get("/doctor", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/doctor.html"));
});

router.get("/patient", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/patient.html"));
});

router.get("/receptionist", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/receptionist.html"));
});

module.exports = router;