const API_BASE_URL = "http://localhost:5000/api";

const welcomeMessage = document.getElementById("welcomeMessage");
const appointmentsTableBody = document.getElementById("appointmentsTableBody");
const noAppointments = document.getElementById("noAppointments");
const patientDetails = document.getElementById("patientDetails");
const prescriptionForm = document.getElementById("prescriptionForm");
const createPrescriptionForm = document.getElementById(
  "createPrescriptionForm"
);
const prescriptionsList = document.getElementById("prescriptionsList");

let currentDoctor = {
  id: null,
  name: null,
  email: null,
  specialization: null,
};

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");

  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  if (token) {
    const userData = parseJwt(token);
    if (userData) {
      currentDoctor = {
        id: userData.userId,
        name: userData.name,
        email: userData.email,
        specialization: userData.specialization || "General Practitioner",
      };
      welcomeMessage.textContent = `Welcome, Dr. ${currentDoctor.name}`;
      loadDoctorAppointments();

      loadDoctorSlots();
    }
  } else {
    window.location.href = "login.html";
  }

  document.querySelector(".logout-btn").addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "/login";
  });
});

async function loadDoctorAppointments() {
  try {
    console.log(currentDoctor);
    const response = await fetch(
      `${API_BASE_URL}/doctor/appointments/${currentDoctor.id}`
    );
    const appointments = await response.json();

    appointmentsTableBody.innerHTML = "";

    if (appointments.length > 0) {
      noAppointments.style.display = "none";

      appointments.forEach((appointment) => {
        const row = document.createElement("tr");
        row.dataset.appointmentId = appointment._id;
        row.dataset.patientId = appointment.patientId._id;

        const patientCell = document.createElement("td");
        patientCell.textContent = appointment.patientId.name;

        const timeCell = document.createElement("td");
        timeCell.textContent = appointment.time;

        const reasonCell = document.createElement("td");
        reasonCell.textContent = appointment.reason;

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = `status-badge status-${appointment.status.replace(
          " ",
          "-"
        )}`;
        statusBadge.textContent = appointment.status;
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");
        const selectButton = document.createElement("button");
        selectButton.className = "select-patient-btn";
        selectButton.textContent = "Select";
        selectButton.addEventListener("click", () =>
          showPatientDetails(appointment)
        );
        actionCell.appendChild(selectButton);

        row.appendChild(patientCell);
        row.appendChild(timeCell);
        row.appendChild(reasonCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        appointmentsTableBody.appendChild(row);
      });
    } else {
      noAppointments.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    alert("Failed to load appointments. Please try again.");
  }
}

async function showPatientDetails(appointment) {
  try {
    console.log(appointment);
    patientDetails.style.display = "block";

    document.getElementById("patientName").textContent =
      appointment.patientId.name;
    document.getElementById("patientEmail").textContent =
      appointment.patientId.email || "N/A";
    document.getElementById("patientPhone").textContent =
      appointment.phone || "N/A";
    document.getElementById("patientAge").textContent =
      appointment.age || "N/A";
    document.getElementById("patientGender").textContent =
      appointment.gender || "N/A";
    document.getElementById("patientBloodGroup").textContent =
      appointment.patientId.bloodGroup || "N/A";

    document.getElementById("appointmentId").value = appointment._id;
    document.getElementById("patientId").value = appointment.patientId._id;

    prescriptionForm.style.display = "block";

    patientDetails.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error showing patient details:", error);
    alert("Failed to load patient details. Please try again.");
  }
}

function addMedicineItem() {
  const container = document.getElementById("medicinesContainer");
  const newItem = document.createElement("div");
  newItem.className = "medicine-item";
  newItem.innerHTML = `
          <input type="text" name="medicineName[]" placeholder="Medicine name" required />
          <input type="text" name="medicineDosage[]" placeholder="Dosage" required />
          <input type="text" name="medicineDuration[]" placeholder="Duration" required />
          <button type="button" class="remove-btn" onclick="removeMedicineItem(this)">
            <i class="fas fa-times"></i>
          </button>
        `;
  container.appendChild(newItem);
}

function removeMedicineItem(button) {
  const container = document.getElementById("medicinesContainer");
  if (container.children.length > 1) {
    button.parentElement.remove();
  } else {
    alert("At least one medicine is required");
  }
}

function addTestItem() {
  const container = document.getElementById("testsContainer");
  const newItem = document.createElement("div");
  newItem.className = "test-item";
  newItem.innerHTML = `
          <input type="text" name="testName[]" placeholder="Test name" />
          <button type="button" class="remove-btn" onclick="removeTestItem(this)">
            <i class="fas fa-times"></i>
          </button>
        `;
  container.appendChild(newItem);
}

function removeTestItem(button) {
  const container = document.getElementById("testsContainer");
  if (container.children.length > 1) {
    button.parentElement.remove();
  }
}

createPrescriptionForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const appointmentId = formData.get("appointmentId");
  const patientId = formData.get("patientId");
  const notes = formData.get("notes");

  const medicineNames = formData.getAll("medicineName[]");
  const medicineDosages = formData.getAll("medicineDosage[]");
  const medicineDurations = formData.getAll("medicineDuration[]");
  const medicines = medicineNames.map((name, index) => ({
    name,
    dosage: medicineDosages[index],
    duration: medicineDurations[index],
  }));

  const testNames = formData.getAll("testName[]");
  const tests = testNames
    .filter((name) => name.trim() !== "")
    .map((name) => ({ name }));

  try {
    const response = await fetch(`${API_BASE_URL}/doctor/prescriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentId,
        doctorId: currentDoctor.id,
        patientId,
        medicines,
        tests,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create prescription");
    }

    const result = await response.json();
    alert("Prescription created successfully!");

    this.reset();

    loadDoctorAppointments();

    patientDetails.style.display = "none";
  } catch (error) {
    console.error("Error creating prescription:", error);
    alert("Failed to create prescription. Please try again.");
  }
});

document
  .getElementById("saveSlotsBtn")
  .addEventListener("click", async function () {
    const date = document.getElementById("slotDate").value;
    const checkboxes = document.querySelectorAll(
      '.time-slots input[type="checkbox"]:checked'
    );

    if (!date) {
      alert("Please select a date");
      return;
    }

    if (checkboxes.length === 0) {
      alert("Please select at least one time slot");
      return;
    }

    try {
      const slotPromises = Array.from(checkboxes).map(async (cb) => {
        const time = cb.value;

        const response = await fetch(
          `${API_BASE_URL}/doctor/slots/${currentDoctor.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ date, time }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add slot");
        }

        return response.json();
      });

      await Promise.all(slotPromises);

      alert("All slots added successfully!");
      document.getElementById("slotDate").value = "";
      document
        .querySelectorAll('.time-slots input[type="checkbox"]')
        .forEach((cb) => {
          cb.checked = false;
        });
    } catch (error) {
      console.error("Error adding slots:", error);
      alert(`Error: ${error.message}`);
    }
  });

async function loadDoctorSlots() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/doctor/slots/${currentDoctor.id}`
    );
    const slots = await response.json();

    displayAvailableSlots(slots);
  } catch (error) {
    console.error("Error loading slots:", error);
    alert("Failed to load available slots. Please try again.");
  }
}

function displayAvailableSlots(slots) {
  const slotsContainer = document.getElementById("availableSlotsContainer");

  if (!slotsContainer) {
    const slotManagementSection = document.getElementById("slot-management");
    const newContainer = document.createElement("div");
    newContainer.id = "availableSlotsContainer";
    newContainer.className = "available-slots-container";
    slotManagementSection.appendChild(newContainer);
  }

  const container = document.getElementById("availableSlotsContainer");
  container.innerHTML = "<h3>Your Available Slots</h3>";

  if (Object.keys(slots).length === 0) {
    container.innerHTML += '<p class="no-slots">No available slots found.</p>';
    return;
  }

  for (const [date, times] of Object.entries(slots)) {
    const dateElement = document.createElement("div");
    dateElement.className = "slot-date-group";

    const dateHeader = document.createElement("h4");
    dateHeader.textContent = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timesList = document.createElement("div");
    timesList.className = "slot-times";

    times.forEach((time) => {
      const timeElement = document.createElement("span");
      timeElement.className = "time-slot-badge";
      timeElement.textContent = time;
      timesList.appendChild(timeElement);
    });

    dateElement.appendChild(dateHeader);
    dateElement.appendChild(timesList);
    container.appendChild(dateElement);
  }
}