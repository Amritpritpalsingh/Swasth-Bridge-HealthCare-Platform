// ------------------------------------------
// Load Today's Patients + Problems
// ------------------------------------------
async function loadPatients() {
  try {
    const [pL, probL] = await Promise.all([
      fetch("/sb/doc/today/patients"),
      fetch("/sb/doc/today/problems")
    ]);

    const patients = await pL.json();
    const problems = await probL.json();

    const todayPat = document.getElementById("todayPat");
    const mostPro = document.getElementById("mostPro");
    const totalPatElem = document.getElementById("totalPatients");
    const newPatElem = document.getElementById("newPatients");
    const oldPatElem = document.getElementById("oldPatients");
    totalPatElem.textContent = patients.length || 0;
    if (!todayPat || !mostPro || !totalPatElem) return;

    todayPat.innerHTML = "";
    mostPro.innerHTML = "";

    // Fetch new vs old patient counts
    try {
      const res = await fetch("/sb/doc/today/patients/count");
      const data = await res.json();

      newPatElem.textContent = data.newCount || 0;
      oldPatElem.textContent = data.oldCount || 0;
    } catch (err) {
      console.error("Error fetching today patient counts:", err);
      newPatElem.textContent = "0";
      oldPatElem.textContent = "0";
    }

    

    // Helper: Calculate age from DOB
    function calculateAge(dobStr) {
      const dob = new Date(dobStr);
      if (isNaN(dob)) return "N/A";
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    }

    // Render patient cards
    patients.forEach(patient => {
      const ageText = calculateAge(patient.age);
      const cardDiv = document.createElement("div");
      cardDiv.className = "card p-3 mb-2 shadow-sm";
      cardDiv.innerHTML = `
        <h6 class="mb-1">${patient.name} <small class="text-muted">(${patient.PID})</small></h6>
        <p class="mb-1"><strong>Age:</strong> ${ageText} | <strong>Gender:</strong> ${patient.gender}</p>
        <p class="mb-1"><strong>Condition:</strong> ${patient.condition || "No condition"}</p>
         <p class="mb-1"><strong>Status:</strong> ${patient.status}</p>
      `;
      todayPat.appendChild(cardDiv);
    });

    // Populate problem list
    problems.forEach(reason => {
      const p = document.createElement("p");
      p.textContent = reason;
      mostPro.appendChild(p);
    });

  } catch (err) {
    console.error("Error fetching patients:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadPatients);

// ------------------------------------------
// Fill Profile Modal
// ------------------------------------------
function fillProfileModal(data, isSelf = false) {
  const parsedData = {};
  Object.keys(data).forEach(k => {
    const value = data[k];
    if (typeof value === "string") {
      try {
        parsedData[k] = JSON.parse(value);
      } catch {
        parsedData[k] = value;
      }
    } else parsedData[k] = value;
  });

  const addressField = parsedData.address || parsedData.location || {};
  const fullAddress = [
    addressField.street || addressField.address,
    addressField.city,
    addressField.state,
    addressField.pincode
  ].filter(Boolean).join(", ");

  document.querySelector(".profile-name").textContent = parsedData.name || "";
  document.querySelector(".profile-uid").textContent = parsedData.uid || "";
  document.querySelector(".profile-gender").textContent = parsedData.gender || "";
  document.querySelector(".profile-phone").textContent = parsedData.phone || "";
  document.querySelector(".profile-email").textContent = parsedData.email || "";
  document.querySelector("#profile-address").textContent = fullAddress || "N/A";
  document.querySelector(".profile-pic").src = parsedData.pic || "https://via.placeholder.com/150";

  const modalActions = document.querySelector(".modal-actions");
  const currUserId = window.currUserId;

  if (isSelf || (currUserId && currUserId === parsedData._id)) {
    modalActions.innerHTML = `
      <button class="btn btn-secondary w-50 w-sm-auto edit-profile-btn"
        data-user='${JSON.stringify(parsedData)}' data-role="Doctor">
        Edit
      </button>`;
  } else {
    modalActions.innerHTML = `
      <button id="vn-openVideoModal" class="btn btn-primary w-50 w-sm-auto"
              data-bs-toggle="modal" data-bs-target="#videoConsultationModal">
        🎥 Start Video Consultation
      </button>`;
  }
}

// ------------------------------------------
// Event Delegation for Profile + Edit
// ------------------------------------------
document.addEventListener("click", e => {
  if (e.target.classList.contains("patient-btn")) {
    fillProfileModal(e.target.dataset);
  }
  if (e.target.id === "profileBtn") {
    const data = JSON.parse(e.target.getAttribute("data-user"));
    fillProfileModal(data, true);
  }
  if (e.target.classList.contains("edit-profile-btn")) {
    const role = e.target.dataset.role;
    const userData = JSON.parse(e.target.dataset.user);
    openEditProfileModal(userData, role);
  }
});

// ------------------------------------------
// Appointment Handling (getAppointId)
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  window.getAppointId = async function (id) {
    const fetchUserData = async () => {
      try {
        const res = await fetch(`/sb/doc/patients/appointment/${id}`);
        if (!res.ok) throw new Error("Failed to fetch patient data");

        const patient = await res.json();
        document.getElementById("inputPatientName").value = patient.name || "";
        document.getElementById("inputPID").value = patient.PID || "";
        document.getElementById("inputChiefComplaint").value = patient.chiefComplaint || "";
        document.getElementById("inputDiagnosis").value = patient.diagnosis || "";
        document.getElementById("inputPrescription").value = patient.prescription || "";
      } catch (err) {
        console.error("Error fetching patient data:", err);
      }
    };

    const saveUserData = async patient => {
      try {
        const res = await fetch(`/sb/doc/patients/appointment/${id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patient)
        });
        if (!res.ok) throw new Error("Failed to save patient data");
        console.log("✅ Patient info saved successfully!");
      } catch (err) {
        console.error("Error saving patient data:", err);
      }
    };

    await fetchUserData();

    const saveBtn = document.getElementById("savePatientInfoBtn");
    if (saveBtn) {
      saveBtn.onclick = async () => {
        const patient = {
          appointId: id,
          name: document.getElementById("inputPatientName").value,
          PID: document.getElementById("inputPID").value,
          chiefComplaint: document.getElementById("inputChiefComplaint").value,
          diagnosis: document.getElementById("inputDiagnosis").value,
          prescription: document.getElementById("inputPrescription").value,
          paymentAmount: parseFloat(document.getElementById("inputPaymentAmount").value) || 0
        };
        await saveUserData(patient);
      };
    }
  };
});

// ------------------------------------------
// Add Patient Form Submission
// ------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchPIDBtn");
  const pidInput = document.getElementById("f-pid");
  const addBtn = document.getElementById("addPatientBtn");
  const collapseEl = new bootstrap.Collapse(document.getElementById("patientDetailsCollapse"), { toggle: false });
  const patientForm = document.getElementById("patientForm");

  // ================= SEARCH EXISTING PATIENT =================
  searchBtn.addEventListener("click", async () => {
    const pid = pidInput.value.trim();
    if (!pid) {
      showToast("Please enter a PID first", "alert");
      return;
    }

    try {
      const res = await fetch(`/sb/doc/patients/${pid}`);
      if (!res.ok) throw new Error("Patient not found");

      const data = await res.json();
      const patient = data.patient;

      // Fill fields
     
      document.getElementById("f-name").value = patient.name || "";
      document.getElementById("f-age").value = patient.age || "";
      document.getElementById("f-gender").value = patient.gender || "";
      

      // Show collapse and Add button
      collapseEl.show();
      addBtn.classList.remove("d-none");

      showToast("Existing patient record found!", "success");
    } catch (err) {
      // Reset form (except PID)
      const pidValue = pidInput.value;
      patientForm.reset();
      document.getElementById("f-pid").value = pidValue;

      collapseEl.hide();
      addBtn.classList.add("d-none");

      showToast("No existing patient found. Please enter new details.", "warning");
    }
  });

  // ================= ADD / SAVE PATIENT =================
  patientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const patientData = {
      pid: document.getElementById("f-pid").value,
      complain: document.getElementById("f-complain").value,
      diagnosis: document.getElementById("f-diagnosis").value,
      prescription: document.getElementById("f-prescription").value,
      paymentAmount: parseFloat(document.getElementById("f-paymentAmount").value) || 0
    };
    const requiredFields = ["pid", "complain", "diagnosis", "paymentAmount", "prescription"];
    for (const field of requiredFields) {
      if (!patientData[field]) {
        showToast(`Please fill the ${field} field`, "alert");
        return;
      }
    }
    if (patientData.paymentAmount <= 0) {
  showToast("Payment amount must be greater than 0", "alert");
  return;
}

    try {
      const res = await fetch("/sb/doc/patients/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientData)
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Patient added successfully!", "success");
        patientForm.reset();
        collapseEl.hide();
        addBtn.classList.add("d-none");

        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById("patientModal")).hide();
      } else {
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach(msg => showToast(msg, "alert"));
        } else {
          showToast(data.message || "Failed to create appointment", "danger");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong while adding the patient.", "danger");
    }
  });
});

// ------------------------------------------
// Appointment Requests (list + update)
// ------------------------------------------
const list = document.getElementById("appointment-requests");

function renderAppointment(data) {
  let item = list.querySelector(`.appointment-item[data-id="${data.id}"]`);
  const collapseId = `appt-${data.id}`;
  console.log(data);
  
  if (!item) {
    item = document.createElement("div");
    item.className = "appointment-item card mb-2 shadow-sm";
    item.dataset.id = data.id;
    list.prepend(item);
  }

  item.innerHTML = `
    <div class="card-header p-2" data-bs-toggle="collapse" data-bs-target="#${collapseId}" style="cursor:pointer;">
      <strong>${data.patientName}</strong>
      <span class="badge ${
        data.status === "Pending"
          ? "bg-warning"
          : data.status === "Cancelled"
          ? "bg-danger"
          : "bg-success"
      }">${data.status}</span>
       <span class="badge bg-success"
      ">${data.consultationtype}</span>
      <br>
      
      <small>${new Date(data.date).toDateString()} at ${data.time}</small>
    </div>

    <div id="${collapseId}" class="collapse">
      <div class="card-body">
        <small>Reason: ${data.reason || "N/A"}</small>
        <div class="mt-2">
          <button class="btn btn-sm btn-success action-btn" data-status="Confirmed">✅ Accept</button>
          <button class="btn btn-sm btn-danger action-btn" data-status="Cancelled">❌ Decline</button>
          <button class="btn btn-sm btn-secondary action-btn" data-status="Postponed">⏳ Postpone</button>
        </div>
      </div>
    </div>
  `;

  attachActionListeners(item);
}

function attachActionListeners(item) {
  const buttons = item.querySelectorAll(".action-btn");
  buttons.forEach(btn => {
    btn.onclick = async () => {
      const status = btn.dataset.status;
      const appointmentId = item.dataset.id;
      try {
        const res = await fetch(`/sb/doc/appointments/${appointmentId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        });

        if (res.ok) {
          const badge = item.querySelector(".badge");
          badge.textContent = status;
          badge.className =
            "badge " +
            (status === "Pending"
              ? "bg-warning"
              : status === "Cancelled"
              ? "bg-danger"
              : "bg-success");
        } else {
          const err = await res.json();
          console.error("Error updating status:", err);
          alert("Failed to update appointment status");
        }
      } catch (err) {
        console.error(err);
        alert("Server error while updating status");
      }
    };
  });
}

fetch("/sb/doc/appointments")
  .then(res => res.json())
  .then(data => data.forEach(renderAppointment))
  .catch(err => console.error("Error fetching appointments:", err));

socket.on("newAppointment", renderAppointment);
socket.on("appointmentUpdate", renderAppointment);

