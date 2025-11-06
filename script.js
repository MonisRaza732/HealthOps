const mongoose = require("mongoose");
const User = require("./models/User");
const Doctor = require("./models/Doctor");

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/hospitalDB", {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
// Sample data
const users = [
  {
    name: "Rohan Sharma",
    email: "rohan.sharma@example.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Cardiology",
    licenseNumber: "12345",
  },
  {
    name: "Priya Gupta",
    email: "priya.gupta@example.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Neurology",
    licenseNumber: "67890",
  },
  {
    name: "Amit Patel",
    email: "amit.patel@example.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Pediatrics",
    licenseNumber: "54321",
  },
  {
    name: "Neha Singh",
    email: "neha.singh@example.com",
    password: "Doctor@123",
    role: "doctor",
    specialization: "Dermatology",
    licenseNumber: "98765",
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@example.com",
    password: "Patient@123",
    role: "patient",
  },
  {
    name: "Meena Iyer",
    email: "meena.iyer@example.com",
    password: "Patient@123",
    role: "patient",
  },
  {
    name: "Reception Desk",
    email: "reception@example.com",
    password: "Recep@123",
    role: "receptionist",
  },
];

// Function to generate random 5-digit license number
function generateLicenseNumber() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Function to generate random available slots for April and May 2024
function generateSlots() {
  const slots = [];
  const months = [4, 5]; // April and May
  const daysInMonth = [30, 31]; // Days in April and May

  for (let m = 0; m < months.length; m++) {
    const month = months[m];
    const days = daysInMonth[m];

    // Generate 2-4 slots per month
    const numSlots = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numSlots; i++) {
      const day = Math.floor(Math.random() * days) + 1;
      const hour = Math.floor(Math.random() * 8) + 9; // Between 9 AM and 5 PM
      const minute = Math.random() > 0.5 ? 0 : 30; // Either :00 or :30

      const date = new Date(2024, month - 1, day);
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;

      slots.push({
        date,
        time,
        isBooked: false,
      });
    }
  }

  return slots;
}

async function seedDatabase() {
  try {
    // Connect to database first
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});

    // Create users and doctors
    for (const userData of users) {
      // Check if email already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(
          `User with email ${userData.email} already exists, skipping...`
        );
        continue;
      }

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      });
      await user.save();

      // Create role-specific document
      if (userData.role === "doctor") {
        const doctor = new Doctor({
          _id: user._id,
          userId: user._id,
          specialization: userData.specialization,
          licenseNumber: userData.licenseNumber || generateLicenseNumber(),
          approved: true,
          availableSlots: generateSlots(),
        });
        await doctor.save();
      }
    }

    console.log("Database seeded successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDatabase();