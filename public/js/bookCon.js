document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("appointmentStatusContainer");

  try {
    const res = await fetch("/sb/pat/appointments/booked");
    const appointments = await res.json();
    container.innerHTML = "";

    if (!appointments || appointments.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info text-center">
          You have no appointments. Please 
          <button 
            class="btn btn-link p-0 text-decoration-none alert-link align-baseline" 
            data-bs-toggle="modal" 
            data-bs-target="#searchDocModal"
            type="button">
            book an appointment
          </button>.
        </div>
      `;
      return;
    }

    appointments.forEach((appt) => {
      const card = document.createElement("div");
      card.className = "card mb-3 shadow-sm";

      const appointmentDate = new Date(appt.appointmentDate);
      const formattedDate = appointmentDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const appAt = `
        <p class="card-text">
          <strong>${appt.appointmenttype} Appointment On </strong> ${formattedDate}
        </p>
      `;

      let videoCallButton = "";

      if (appt.status === "Confirmed" && appt.appointmenttype !== "Offline") {
        const [startHour, startMinute] = appt.timeSlot.split(":").map(Number);
        const startTime = new Date(appointmentDate);
        startTime.setHours(startHour, startMinute, 0, 0);

        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // +30 min
        const now = new Date();

        const isSameDate = now.toDateString() === startTime.toDateString();
        const isActive = isSameDate && now >= startTime && now <= endTime;

        // Button (not truly disabled — we handle logic ourselves)
        videoCallButton = `
          <button 
            class="btn join-call-btn ${isActive ? "btn-success" : "btn-secondary disabled-btn"}"
            data-appointment-id="${appt._id}" 
            data-doctor-id="${appt.doctor?._id}"
            data-patient-id="${appt.patient._id}"
            data-doctor-name="${appt.doctor.name}" 
            data-patient-name="${appt.patient.name}"
            data-disabled="${isActive ? "false" : "true"}">
            🎥 Join Video Call
          </button>
        `;
      }

      if (appt.status === "Confirmed") {
        card.innerHTML = `
          <div class="card-body d-flex flex-column gap-2">
            <h5 class="card-title">Dr. ${appt.doctor.name}</h5>
            ${appAt}
            <p class="card-text"><strong>Time:</strong> ${appt.timeSlot}</p>
            ${videoCallButton}
          </div>
        `;
      }

      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="alert alert-danger">Error loading appointments</div>`;
  }
});
