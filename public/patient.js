const API_BASE_URL = "http://localhost:5000/api";

const medicalFieldSelect = document.getElementById("medicalField");
const doctorSelection = document.getElementById("doctorSelection");
const doctorOptionsContainer = document.getElementById(
  "doctorOptionsContainer"
);
const dateGroup = document.getElementById("dateGroup");
const appointmentDate = document.getElementById("appointmentDate");
const timeSlotGroup = document.getElementById("timeSlotGroup");
const appointmentTime = document.getElementById("appointmentTime");
const submitButton = document.getElementById("submitAppointment");
const welcomeMessage = document.getElementById("welcomeMessage");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");
const appointmentsTableBody = document.getElementById("appointmentsTableBody");

let currentUser = {
  id: null,
  name: null,
  email: null,
  phone: null,
  address: null,
  role: "patient",
};

document.addEventListener("DOMContentLoaded", function () {
  const tok = localStorage.token;

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

  const userData = parseJwt(tok);
  currentUser = userData;

  if (userData) {
    welcomeMessage.textContent = `Welcome, ${userData.name}`;
    loadPatientPrescriptions();
    loadPatientAppointments();

    if (currentUser.phone) {
      phoneInput.value = userData.phone;
    }
    if (currentUser.address) {
      addressInput.value = userData.address;
    }
  }

  const medicalFields = [
    "General Practitioner",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Dermatology",
    "Surgery",
    "Neurology",
    "Pediatrics",
    "Radiology",
    "Urology",
    "Cardiology",
    "Gastroenterology",
  ];
  medicalFields.forEach((field) => {
    const option = document.createElement("option");
    option.value = field;
    option.textContent = field;
    medicalFieldSelect.appendChild(option);
  });

  medicalFieldSelect.addEventListener("change", async function () {
    const selectedField = this.value;
    doctorOptionsContainer.innerHTML = "";
    dateGroup.style.display = "none";
    timeSlotGroup.style.display = "none";

    if (selectedField) {
      try {
        // Fetch doctors by specialization from our API
        const response = await fetch(
          `${API_BASE_URL}/patient/doctors/${encodeURIComponent(selectedField)}`
        );
        const doctors = await response.json();

        if (doctors.length === 0) {
          doctorOptionsContainer.innerHTML =
            "<p>No doctors available in this specialty</p>";
          return;
        }

        // Add doctor options
        doctors.forEach((doctor) => {
          const doctorOption = document.createElement("div");
          doctorOption.className = "doctor-option";

          const radioInput = document.createElement("input");
          radioInput.type = "radio";
          radioInput.name = "doctor";
          radioInput.id = doctor._id;
          radioInput.value = doctor._id;

          const label = document.createElement("label");
          label.htmlFor = doctor._id;
          label.className = "doctor-info";

          const nameDiv = document.createElement("div");
          nameDiv.className = "doctor-name";
          nameDiv.textContent = doctor.userId.name;

          const detailsDiv = document.createElement("div");
          detailsDiv.className = "doctor-specialty";
          detailsDiv.textContent = `${doctor.specialization}`;

          label.appendChild(nameDiv);
          label.appendChild(detailsDiv);

          doctorOption.appendChild(radioInput);
          doctorOption.appendChild(label);

          doctorOptionsContainer.appendChild(doctorOption);
        });

        doctorSelection.style.display = "block";
      } catch (error) {
        console.error("Error fetching doctors:", error);
        alert("Failed to load doctors. Please try again.");
      }
    } else {
      doctorSelection.style.display = "none";
    }
  });

  doctorOptionsContainer.addEventListener("change", async function (e) {
    if (e.target.name === "doctor") {
      const doctorId = e.target.value;

      try {
        const response = await fetch(
          `${API_BASE_URL}/patient/slots/${doctorId}`
        );
        const availableSlots = await response.json();

        const uniqueDates = [
          ...new Set(availableSlots.map((slot) => slot.date)),
        ];

        appointmentDate.innerHTML = '<option value="">Select a date</option>';
        uniqueDates.forEach((date) => {
          const option = document.createElement("option");
          option.value = date;
          option.textContent = new Date(date).toLocaleDateString();
          appointmentDate.appendChild(option);
        });

        dateGroup.style.display = "block";
        timeSlotGroup.style.display = "none";
      } catch (error) {
        console.error("Error fetching available dates:", error);
        alert("Failed to load available dates. Please try again.");
      }
    }
  });

  appointmentDate.addEventListener("change", async function () {
    const selectedDate = this.value;
    if (!selectedDate) {
      timeSlotGroup.style.display = "none";
      return;
    }

    const selectedDoctor = document.querySelector(
      'input[name="doctor"]:checked'
    );
    if (!selectedDoctor) {
      alert("Please select a doctor first");
      this.value = "";
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/patient/slots/${selectedDoctor.value}`
      );
      const allSlots = await response.json();

      const availableSlots = allSlots.filter(
        (slot) => slot.date === selectedDate && !slot.isBooked
      );

      appointmentTime.innerHTML =
        '<option value="">Select a time slot</option>';

      availableSlots.forEach((slot) => {
        const option = document.createElement("option");
        option.value = slot.time;
        option.textContent = slot.time;
        appointmentTime.appendChild(option);
      });

      timeSlotGroup.style.display = "block";
    } catch (error) {
      console.error("Error fetching time slots:", error);
      alert("Failed to load available time slots. Please try again.");
    }
  });

  submitButton.addEventListener("click", handleFormSubmit);

  initializeBillingSection();

  document.querySelector(".logout-btn").addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });

  document.querySelector(".upload-btn").addEventListener("click", function () {
    const fileInput = document.getElementById("reportFile");
    if (fileInput.files.length > 0) {
      alert(
        "File uploaded successfully! (This would be sent to the backend in a real app)"
      );
      fileInput.value = "";
    } else {
      alert("Please select a file to upload.");
    }
  });
});

async function loadPatientAppointments() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/patient/appointments/${currentUser.userId}`
    );
    const appointments = await response.json();

    appointmentsTableBody.innerHTML = "";

    if (appointments.length > 0) {
      appointments.forEach((appointment) => {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent = new Date(appointment.date).toLocaleDateString();

        const timeCell = document.createElement("td");
        timeCell.textContent = appointment.time;

        const doctorCell = document.createElement("td");
        console.log(appointment);
        doctorCell.textContent = `Dr. ${appointment.doctorId.userId.name}`;

        const specialtyCell = document.createElement("td");
        specialtyCell.textContent = appointment.doctorId.specialization;

        const statusCell = document.createElement("td");
        statusCell.textContent =
          appointment.status.charAt(0).toUpperCase() +
          appointment.status.slice(1);
        statusCell.className = appointment.status;

        const actionCell = document.createElement("td");
        if (
          appointment.status !== "completed" &&
          appointment.status !== "cancelled"
        ) {
          const cancelBtn = document.createElement("button");
          cancelBtn.className = "cancel-btn";
          cancelBtn.textContent = "Cancel";
          cancelBtn.addEventListener("click", () =>
            cancelAppointment(appointment._id)
          );
          actionCell.appendChild(cancelBtn);
        } else {
          actionCell.textContent = "N/A";
        }

        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(doctorCell);
        row.appendChild(specialtyCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        appointmentsTableBody.appendChild(row);
      });
    } else {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "No appointments scheduled";
      row.appendChild(cell);
      appointmentsTableBody.appendChild(row);
    }
  } catch (error) {
    console.error("Error loading appointments:", error);
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Error loading appointments";
    row.appendChild(cell);
    appointmentsTableBody.appendChild(row);
  }
}

async function cancelAppointment(appointmentId) {
  if (!confirm("Are you sure you want to cancel this appointment?")) {
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/patient/appointments/${appointmentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to cancel appointment");
    }

    alert("Appointment cancelled successfully");
    loadPatientAppointments();
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    alert("Failed to cancel appointment. Please try again.");
  }
}

async function loadPatientPrescriptions() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/patient/prescriptions/${currentUser.userId}`
    );
    const prescriptions = await response.json();

    const historySection = document.getElementById("history");
    const noRecordsMsg = historySection.querySelector(".no-records");

    if (prescriptions.length > 0) {
      noRecordsMsg.style.display = "none";

      prescriptions.forEach((prescription) => {
        const prescriptionDiv = document.createElement("div");
        prescriptionDiv.className = "prescription-card";

        const date = new Date(prescription.createdAt).toLocaleDateString();
        const doctorName = prescription.doctorId.name;

        prescriptionDiv.innerHTML = `
          <h3>Prescription from Dr. ${doctorName} - ${date}</h3>
          ${
            prescription.medicines.length > 0
              ? `
            <h4>Medicines:</h4>
            <ul>
              ${prescription.medicines
                .map(
                  (med) =>
                    `<li>${med.name} - ${med.dosage} for ${med.duration}</li>`
                )
                .join("")}
            </ul>
          `
              : ""
          }
          ${
            prescription.tests.length > 0
              ? `
            <h4>Tests:</h4>
            <ul>
              ${prescription.tests
                .map((test) => `<li>${test.name}</li>`)
                .join("")}
            </ul>
          `
              : ""
          }
          ${
            prescription.notes
              ? `<p><strong>Notes:</strong> ${prescription.notes}</p>`
              : ""
          }
        `;

        historySection.appendChild(prescriptionDiv);
      });
    } else {
      noRecordsMsg.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading prescriptions:", error);
  }
}

async function handleFormSubmit() {
  const medicalField = document.getElementById("medicalField");
  const doctor = document.querySelector('input[name="doctor"]:checked');
  const appointmentDate = document.getElementById("appointmentDate");
  const appointmentTime = document.getElementById("appointmentTime");
  const age = document.getElementById("age");
  const gender = document.querySelector('input[name="gender"]:checked');
  const phone = document.getElementById("phone");
  const address = document.getElementById("address");
  const reason = document.getElementById("reason");

  console.log(doctor);

  if (
    !validateForm(
      medicalField,
      doctor,
      appointmentDate,
      appointmentTime,
      age,
      gender,
      phone,
      address,
      reason
    )
  ) {
    return false;
  }

  try {
    console.log(doctor);
    const response = await fetch(`${API_BASE_URL}/patient/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: currentUser.userId,
        doctorId: doctor.value,
        date: appointmentDate.value,
        time: appointmentTime.value,
        age: age.value,
        gender: gender.value,
        phone: phone.value,
        address: address.value,
        reason: reason.value,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to book appointment");
    }

    const appointment = await response.json();
    alert(
      `Appointment booked successfully for ${new Date(
        appointmentDate.value
      ).toLocaleDateString()} at ${appointmentTime.value}`
    );

    loadPatientAppointments();
  } catch (error) {
    console.error("Error booking appointment:", error);
    alert("Failed to book appointment. Please try again.");
  }
}

function validateForm(
  medicalField,
  doctor,
  appointmentDate,
  appointmentTime,
  age,
  gender,
  phone,
  address,
  reason
) {
  if (!medicalField.value) {
    alert("Please select a medical field");
    medicalField.focus();
    return false;
  }

  if (!doctor) {
    alert("Please select a doctor");
    return false;
  }

  if (!appointmentDate.value) {
    alert("Please select an appointment date");
    appointmentDate.focus();
    return false;
  }

  if (!appointmentTime.value) {
    alert("Please select an appointment time");
    appointmentTime.focus();
    return false;
  }

  if (!age.value || age.value < 1 || age.value > 120) {
    alert("Please enter a valid age between 1 and 120");
    age.focus();
    return false;
  }

  if (!gender) {
    alert("Please select your gender");
    return false;
  }

  if (!phone.value || !/^[0-9]{10}$/.test(phone.value)) {
    alert("Please enter a valid 10-digit phone number");
    phone.focus();
    return false;
  }

  if (!address.value) {
    alert("Please enter your address");
    address.focus();
    return false;
  }

  if (!reason.value) {
    alert("Please describe the reason for your appointment");
    reason.focus();
    return false;
  }

  return true;
}

function resetForm() {
  document.getElementById("appointmentForm").reset();
  document.getElementById("doctorSelection").style.display = "none";
  document.getElementById("dateGroup").style.display = "none";
  document.getElementById("timeSlotGroup").style.display = "none";

  if (currentUser.phone) {
    document.getElementById("phone").value = currentUser.phone;
  }
  if (currentUser.address) {
    document.getElementById("address").value = currentUser.address;
  }
}
async function initializeBillingSection() {
  try {
    const billingTableBody = document.getElementById("billingTableBody");
    const billDetails = document.getElementById("billDetails");

    billingTableBody.innerHTML = "";

    const billsResponse = await fetch(
      `${API_BASE_URL}/patient/prescriptions/bill/${currentUser.userId}`
    );

    if (!billsResponse.ok) {
      throw new Error("Failed to fetch bills");
    }

    const billsData = await billsResponse.json();

    if (!billsData || billsData.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "No billing records found";
      row.appendChild(cell);
      billingTableBody.appendChild(row);
      return;
    }

    billsData.forEach((billData) => {
      if (!billData.bill) return;

      const bill = billData.bill;
      const date = new Date().toLocaleDateString();

      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = date;

      const amountCell = document.createElement("td");
      amountCell.textContent = `₹${bill.amount}`;

      const statusCell = document.createElement("td");
      statusCell.textContent = "Paid";
      statusCell.className = "paid";

      const actionCell = document.createElement("td");
      actionCell.className = "action-cell";

      const viewButton = document.createElement("button");
      viewButton.className = "viewBillBtn";
      viewButton.textContent = "View Bill";
      viewButton.addEventListener("click", () => showBillDetails(bill, date));

      actionCell.appendChild(viewButton);
      row.appendChild(dateCell);
      row.appendChild(amountCell);
      row.appendChild(statusCell);
      row.appendChild(actionCell);

      billingTableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading billing data:", error);
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "Error loading billing information";
    row.appendChild(cell);
    billingTableBody.appendChild(row);
  }
}

function showBillDetails(bill, date) {
  const billDetails = document.getElementById("billDetails");

  billDetails.innerHTML = `
  <h3>Invoice Details - ${date}</h3>
  <p class="bill-description">Billing Breakdown:</p>
  <div class="bill-items">
      ${
        bill.medicines && bill.medicines.length > 0
          ? `
              <h4>Medicines</h4>
              <ul>
                  ${bill.medicines
                    .map((med) => `<li>${med.name} - ₹${med.price}</li>`)
                    .join("")}
              </ul>
              `
          : ""
      }
      ${
        bill.tests && bill.tests.length > 0
          ? `
              <h4>Tests</h4>
              <ul>
                  ${bill.tests
                    .map((test) => `<li>${test.name} - ₹${test.price}</li>`)
                    .join("")}
              </ul>
              `
          : ""
      }
      ${
        bill.otherCharges
          ? `
              <h4>Other Charges</h4>
              <ul>
                  <li>Service Charges - ₹${bill.otherCharges}</li>
              </ul>
              `
          : ""
      }
      <h4>Total Amount:</h4>
      <p id="billTotal">₹${bill.amount}</p>
  </div>
`;

  billDetails.style.display = "block";
}