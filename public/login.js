document.getElementById("login-tab").addEventListener("click", () => {
  switchTab("login");
});

document.getElementById("signup-tab").addEventListener("click", () => {
  switchTab("signup");
});

function switchTab(tabName) {
  document.querySelectorAll(".form-container").forEach((form) => {
    form.classList.add("hidden");
    form.classList.remove("active");
  });
  document.getElementById(`${tabName}Form`).classList.remove("hidden");
  document.getElementById(`${tabName}Form`).classList.add("active");

  document.querySelectorAll(".tab-button").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.getElementById(`${tabName}-tab`).classList.add("active");
}

// Improved validation function
function validateForm(form) {
  const inputs = form.querySelectorAll("input[required], select[required]");
  let isValid = true;

  for (let input of inputs) {
    // Skip validation for doctor fields if role isn't doctor
    if (
      input.id === "signup-specialization" &&
      document.getElementById("signup-role")?.value !== "doctor"
    ) {
      continue;
    }

    if (!input.value.trim()) {
      let fieldName = input.id
        .replace(/^(login|signup)-/, "")
        .replace("-", " ");
      alert(`Please fill in ${fieldName}`);
      input.focus();
      isValid = false;
      break;
    }
  }

  return isValid;
}

// Login form submission
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) return;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value,
        role: document.getElementById("login-role").value,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token);
      window.location.href = `${data.user.role}-dashboard.html`;
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
});

// Signup form submission
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) return;

  try {
    const formData = {
      password: document.getElementById("signup-password").value,
      role: document.getElementById("signup-role").value,
      name: document.getElementById("signup-name").value,
      email: document.getElementById("signup-email").value,
      specialization:
        document.getElementById("signup-role").value === "doctor"
          ? document.getElementById("signup-specialization").value
          : null,
    };

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert("Account created successfully!");
      switchTab("login");
      e.target.reset();
    } else {
      const data = await response.json();
      alert(data.error || "Signup failed");
    }
  } catch (error) {
    alert("Network error. Please try again.");
  }
});