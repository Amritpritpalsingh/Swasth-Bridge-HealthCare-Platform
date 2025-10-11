document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Fetch confirmed appointments
    const res = await fetch("/sb/doc/appointments/confirm");
    const confirmed = await res.json();

    // Update badge
    document.getElementById("confirmCount").textContent = confirmed.length;

    // Target container
    const confirmList = document.getElementById("confirm-appointments");
    confirmList.innerHTML = "";

    if (!confirmed || confirmed.length === 0) {
      confirmList.innerHTML = `
        <div class="alert alert-info text-center">
          No confirmed appointments found.
        </div>`;
      return;
    }

    confirmed.forEach((appt, index) => {
      const card = document.createElement("div");
      card.className = "card shadow-sm mb-3 w-100";

      // Appointment date formatting
      const appointmentDate = new Date(appt.date);
      const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Appointment info
      const appointmentInfo = `
        <p class="card-text"><strong>📅 Date:</strong> ${formattedDate}</p>
        <p class="card-text"><strong>⏰ Time:</strong> ${appt.time || "Not specified"}</p>
        <p class="card-text"><small>📝 ${appt.reason || "Consultation"}</small></p>
      `;

      // Determine action button
      let actionButton = "";

      if (appt.consultationtype !== "Offline") {
        // Online appointment → Video Call
        let isActive = false;
        if (appt.time) {
          const [startHour, startMinute] = appt.time.split(":").map(Number);
          const startTime = new Date(appt.date);
          startTime.setHours(startHour, startMinute, 0, 0);
          const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
          const now = new Date();
          const isSameDate = now.toDateString() === startTime.toDateString();
          isActive = isSameDate && now >= startTime && now <= endTime;
        }
  
        
        actionButton = `
          <button 
            class="btn join-call-btn ${isActive ? "btn-success" : "btn-secondary disabled-btn"} mt-2"
            data-appointment-id="${appt.id}" 
            data-doctor-id="${appt.doctor?._id}"
            data-patient-id="${appt.patient._id}"
            data-doctor-name="${appt.doctor.name}" 
            data-patient-name="${appt.patient.name}"
            data-disabled="${isActive ? "false" : "true"}">
            🎥 Join Video Call
          </button>
        `;
      } else {
        // Offline appointment → View Patient Info
        actionButton = `
          <button 
            class="btn btn-info mt-2 view-patient-info-btn"
            data-pid="${appt.patient.PID}"
            data-Apid="${appt.id}"
            data-reason="${appt.reason}">
            📝 View Patient Info
          </button>
        `;
      }

      // Card HTML
      card.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">${appt.patient?.name || "Unknown Patient"}</h5>
          <button class="btn btn-sm btn-outline-primary" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#confirmDetails-${index}">
            View Details
          </button>
        </div>

        <div id="confirmDetails-${index}" class="collapse">
          <div class="card-body d-flex flex-column gap-2">
            ${appointmentInfo}
            ${actionButton}
          </div>
        </div>
      `;

      confirmList.appendChild(card);
    });

  } catch (err) {
    console.error("Error fetching confirmed appointments:", err);
    document.getElementById("confirm-appointments").innerHTML =
      `<div class="alert alert-danger">Failed to load confirmed appointments</div>`;
  }
});

// =================== Offline Patient Info ===================
// Show offline patient info
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("view-patient-info-btn")) {
    const pid = e.target.dataset.pid;
  
    
    try {
      const res = await fetch(`/sb/doc/patients/${pid}`);
      if (!res.ok) throw new Error("Patient not found");

      const patient = (await res.json()).patient;

      // Fill the offline patient info fields
       document.getElementById("offlineID").value = e.target.dataset.apid
      document.getElementById("offlinePatientName").value = patient.name || "";
      document.getElementById("offlinePID").value = patient.pid || "";
      document.getElementById("offlineChiefComplaint").value =  e.target.dataset.reason || "";
     

      // Show the offline patient card
      const card = document.getElementById("offlinePatientCard");
      card.style.display = "block";
    } catch (err) {
      console.error(err);
      showToast("Patient info not found", "alert");
    }
  }
});

// Close button
document.getElementById("closeOfflinePatientCard")?.addEventListener("click", () => {
  document.getElementById("offlinePatientCard").style.display = "none";
});

// Save offline patient info
document.getElementById("saveOfflinePatientBtn")?.addEventListener("click", async () => {
  const patientData = {
    paymentAmount : parseFloat(document.getElementById("offlinePaymentAmount").value) || 0,
    name: document.getElementById("offlinePatientName").value,
    id : document.getElementById("offlineID").value,
    PID: document.getElementById("offlinePID").value,
    chiefComplaint: document.getElementById("offlineChiefComplaint").value,
    diagnosis: document.getElementById("offlineDiagnosis").value,
    prescription: document.getElementById("offlinePrescription").value
  };

  try {
    const res = await fetch(`/sb/doc/patients/appointment/${patientData.id}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patientData)
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message || "Patient info updated successfully!", "success");
    } else {
      showToast(data.message || "Failed to update patient info", "danger");
    }
  } catch (err) {
    console.error(err);
    showToast("Something went wrong while updating patient info", "danger");
  }
});
