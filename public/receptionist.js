const API_BASE_URL = "http://localhost:5000/api";
let currentAppointmentId = null;

const welcomeMessage = document.getElementById("welcomeMessage");
const confirmedAppointmentsTableBody = document.getElementById(
  "confirmedAppointmentsTableBody"
);
const completedAppointmentsTableBody = document.getElementById(
  "completedAppointmentsTableBody"
);
const noConfirmedAppointments = document.getElementById(
  "noConfirmedAppointments"
);
const noCompletedAppointments = document.getElementById(
  "noCompletedAppointments"
);
const doctorsTableBody = document.getElementById("doctorsTableBody");
const noDoctors = document.getElementById("noDoctors");

const billGenerationSection = document.getElementById("bill-generation");
const billForm = document.getElementById("billForm");
const cancelBillBtn = document.getElementById("cancelBillBtn");

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const userData = parseJwt(token);
  if (userData) {
    welcomeMessage.textContent = `Welcome, ${userData.name}`;
  }

  loadConfirmedAppointments();
  loadCompletedAppointments();
  loadDoctors();

  billForm.addEventListener("submit", handleBillSubmit);
  cancelBillBtn.addEventListener("click", function () {
    billGenerationSection.style.display = "none";
  });

  document.querySelector(".logout-btn").addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  });
});

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function loadConfirmedAppointments() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/appointments/confirmed`
    );
    const appointments = await response.json();

    confirmedAppointmentsTableBody.innerHTML = "";

    if (appointments.length > 0) {
      noConfirmedAppointments.style.display = "none";

      appointments.forEach((appointment) => {
        const row = document.createElement("tr");
        row.dataset.id = appointment._id;

        const patientCell = document.createElement("td");
        patientCell.textContent = appointment.patientId?.name || "N/A";

        const doctorCell = document.createElement("td");
        doctorCell.textContent = appointment.doctorId?.name || "N/A";

        const dateCell = document.createElement("td");
        const date = new Date(appointment.date);
        dateCell.textContent = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "2-digit",
        });

        const timeCell = document.createElement("td");
        timeCell.textContent = appointment.time;

        const reasonCell = document.createElement("td");
        reasonCell.textContent = appointment.reason || "General Consultation";

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = `status-badge status-${appointment.status.replace(
          " ",
          "-"
        )}`;
        statusBadge.textContent = appointment.status;
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");
        actionCell.className = "actions";

        if (appointment.status === "confirmed") {
          const checkinBtn = document.createElement("button");
          checkinBtn.className = "checkin-btn";
          checkinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Check In';
          checkinBtn.addEventListener("click", () =>
            checkInPatient(appointment._id)
          );
          actionCell.appendChild(checkinBtn);
        } else if (appointment.status === "checked-in") {
          const checkoutBtn = document.createElement("button");
          checkoutBtn.className = "checkout-btn";
          checkoutBtn.innerHTML =
            '<i class="fas fa-sign-out-alt"></i> Check Out';
          checkoutBtn.addEventListener("click", () =>
            openBillForm(appointment)
          );
          actionCell.appendChild(checkoutBtn);
        }

        row.appendChild(patientCell);
        row.appendChild(doctorCell);
        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(reasonCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        confirmedAppointmentsTableBody.appendChild(row);
      });
    } else {
      noConfirmedAppointments.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading confirmed appointments:", error);
    alert("Failed to load confirmed appointments. Please try again.");
  }
}

async function loadCompletedAppointments() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/appointments/completed`
    );
    const appointments = await response.json();

    completedAppointmentsTableBody.innerHTML = "";

    if (appointments.length > 0) {
      noCompletedAppointments.style.display = "none";

      appointments.forEach((appointment) => {
        const row = document.createElement("tr");
        row.dataset.id = appointment._id;

        const patientCell = document.createElement("td");
        patientCell.textContent = appointment.patientId?.name || "N/A";

        const doctorCell = document.createElement("td");
        doctorCell.textContent = appointment.doctorId?.name || "N/A";

        const dateCell = document.createElement("td");
        const date = new Date(appointment.date);
        dateCell.textContent = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "2-digit",
        });

        const timeCell = document.createElement("td");
        timeCell.textContent = appointment.time;

        const reasonCell = document.createElement("td");
        reasonCell.textContent = appointment.reason || "General Consultation";

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = `status-badge status-${appointment.status.replace(
          " ",
          "-"
        )}`;
        statusBadge.textContent = appointment.status;
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");
        actionCell.className = "actions";

        const generateBillBtn = document.createElement("button");
        generateBillBtn.className = "generate-bill-btn";
        generateBillBtn.innerHTML =
          '<i class="fas fa-file-invoice-dollar"></i> View Bill';
        generateBillBtn.addEventListener("click", () =>
          openBillForm(appointment, true)
        );
        actionCell.appendChild(generateBillBtn);

        row.appendChild(patientCell);
        row.appendChild(doctorCell);
        row.appendChild(dateCell);
        row.appendChild(timeCell);
        row.appendChild(reasonCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        completedAppointmentsTableBody.appendChild(row);
      });
    } else {
      noCompletedAppointments.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading completed appointments:", error);
    alert("Failed to load completed appointments. Please try again.");
  }
}

async function loadDoctors() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/doctors/pending`
    );
    const pendingDoctors = await response.json();

    doctorsTableBody.innerHTML = "";

    if (pendingDoctors.length > 0) {
      noDoctors.style.display = "none";

      pendingDoctors.forEach((doctor) => {
        const row = document.createElement("tr");
        row.dataset.id = doctor._id;

        const nameCell = document.createElement("td");
        nameCell.textContent = doctor.name;

        const specializationCell = document.createElement("td");
        specializationCell.textContent =
          doctor.specialization || "General Practitioner";

        const emailCell = document.createElement("td");
        emailCell.textContent = doctor.email;

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = "status-badge status-pending";
        statusBadge.textContent = "Pending Approval";
        statusCell.appendChild(statusBadge);

        const actionCell = document.createElement("td");
        actionCell.className = "actions";

        const approveBtn = document.createElement("button");
        approveBtn.className = "approve-btn";
        approveBtn.innerHTML = '<i class="fas fa-check-circle"></i> Approve';
        approveBtn.addEventListener("click", () => approveDoctor(doctor._id));
        actionCell.appendChild(approveBtn);

        row.appendChild(nameCell);
        row.appendChild(specializationCell);
        row.appendChild(emailCell);
        row.appendChild(statusCell);
        row.appendChild(actionCell);

        doctorsTableBody.appendChild(row);
      });
    } else {
      noDoctors.style.display = "block";
    }
  } catch (error) {
    console.error("Error loading pending doctors:", error);
    alert("Failed to load pending doctors. Please try again.");
  }
}

async function checkInPatient(appointmentId) {
  if (!confirm("Are you sure you want to check in this patient?")) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/appointments/${appointmentId}/checkin`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to check in patient");
    }

    const result = await response.json();
    alert("Patient checked in successfully!");
    loadConfirmedAppointments();
  } catch (error) {
    console.error("Error checking in patient:", error);
    alert("Failed to check in patient. Please try again.");
  }
}

function openBillForm(appointment, viewOnly = false) {
  currentAppointmentId = appointment._id;
  billGenerationSection.style.display = "block";
  billGenerationSection.scrollIntoView({ behavior: "smooth" });

  document.getElementById("billAppointmentId").value = appointment._id;
  document.getElementById("billPatientName").value =
    appointment.patientId?.name || "N/A";
  document.getElementById("billDoctorName").value =
    appointment.doctorId?.name || "N/A";

  document.getElementById("medicinesList").innerHTML = "";
  document.getElementById("medicineCosts").innerHTML = "";
  document.getElementById("testsList").innerHTML = "";
  document.getElementById("testCosts").innerHTML = "";

  if (appointment.prescription?.medicines?.length > 0) {
    appointment.prescription.medicines.forEach((medicine, index) => {
      const medItem = document.createElement("div");
      medItem.className = "item-name";
      medItem.textContent = `${medicine.name} (${medicine.dosage}, ${medicine.duration})`;
      document.getElementById("medicinesList").appendChild(medItem);

      const costInput = document.createElement("input");
      costInput.type = "number";
      costInput.step = "0.01";
      costInput.min = "0";
      costInput.placeholder = "Enter price";
      costInput.required = true;
      costInput.className = "price-input";
      costInput.dataset.medicineId = medicine._id;

      if (viewOnly && appointment.bill) {
        const medBill = appointment.bill.medicines.find(
          (m) => m.medicineId === medicine._id
        );
        if (medBill) {
          costInput.value = medBill.price;
          costInput.readOnly = true;
        }
      }

      document.getElementById("medicineCosts").appendChild(costInput);
    });
  } else {
    document.getElementById("medicinesList").innerHTML =
      "<div class='no-items'>No medicines prescribed</div>";
  }

  if (appointment.prescription?.tests?.length > 0) {
    appointment.prescription.tests.forEach((test, index) => {
      const testItem = document.createElement("div");
      testItem.className = "item-name";
      testItem.textContent = test.name;
      document.getElementById("testsList").appendChild(testItem);

      const costInput = document.createElement("input");
      costInput.type = "number";
      costInput.step = "0.01";
      costInput.min = "0";
      costInput.placeholder = "Enter price";
      costInput.className = "price-input";
      costInput.dataset.testId = test._id;

      if (viewOnly && appointment.bill) {
        const testBill = appointment.bill.tests.find(
          (t) => t.testId === test._id
        );
        if (testBill) {
          costInput.value = testBill.price;
          costInput.readOnly = true;
        }
      }

      document.getElementById("testCosts").appendChild(costInput);
    });
  } else {
    document.getElementById("testsList").innerHTML =
      "<div class='no-items'>No tests ordered</div>";
  }

  if (viewOnly && appointment.bill) {
    document.getElementById("consultationFee").value =
      appointment.bill.consultationFee || "";
    document.getElementById("otherCharges").value =
      appointment.bill.otherCharges || "0";
    document.getElementById("notes").value = appointment.bill.notes || "";

    document.getElementById("consultationFee").readOnly = true;
    document.getElementById("otherCharges").readOnly = true;
    document.getElementById("notes").readOnly = true;

    document.querySelector(".submit-btn").style.display = "none";
  } else {
    document.getElementById("consultationFee").value = "";
    document.getElementById("otherCharges").value = "0";

    document.getElementById("consultationFee").readOnly = false;
    document.getElementById("otherCharges").readOnly = false;

    document.querySelector(".submit-btn").style.display = "block";
  }
}

async function handleBillSubmit(e) {
  e.preventDefault();

  if (!currentAppointmentId) return;

  const medicines = [];
  const medicineInputs = document.querySelectorAll("#medicineCosts input");
  const medicineNames = document.querySelectorAll("#medicinesList .item-name");

  medicineInputs.forEach((input, index) => {
    if (input.value) {
      medicines.push({
        medicineId: input.dataset.medicineId,
        name: medicineNames[index]?.textContent.split(" (")[0] || "Medicine",
        price: parseFloat(input.value),
      });
    }
  });

  const tests = [];
  const testInputs = document.querySelectorAll("#testCosts input");
  const testNames = document.querySelectorAll("#testsList .item-name");

  testInputs.forEach((input, index) => {
    if (input.value) {
      tests.push({
        testId: input.dataset.testId,
        name: testNames[index]?.textContent || "Test",
        price: parseFloat(input.value),
      });
    }
  });

  const consultationFee =
    parseFloat(document.getElementById("consultationFee").value) || 0;
  const otherCharges =
    parseFloat(document.getElementById("otherCharges").value) || 0;

  const billAmount =
    consultationFee +
    medicines.reduce((sum, med) => sum + med.price, 0) +
    tests.reduce((sum, test) => sum + test.price, 0) +
    otherCharges;

  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/appointments/${currentAppointmentId}/checkout`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          billAmount,
          medicines,
          tests,
          otherCharges,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to generate bill");

    const result = await response.json();
    alert("Bill generated successfully!");
    billGenerationSection.style.display = "none";
    loadConfirmedAppointments();
    loadCompletedAppointments();
  } catch (error) {
    console.error("Error generating bill:", error);
    alert("Failed to generate bill. Please try again.");
  }
}

async function approveDoctor(doctorId) {
  if (!confirm("Are you sure you want to approve this doctor?")) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/receptionist/doctors/${doctorId}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to approve doctor");
    }

    const result = await response.json();
    alert("Doctor approved successfully!");
    loadDoctors();
  } catch (error) {
    console.error("Error approving doctor:", error);
    alert("Failed to approve doctor. Please try again.");
  }
}