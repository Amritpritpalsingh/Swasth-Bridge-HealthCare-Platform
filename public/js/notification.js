document.addEventListener("DOMContentLoaded", function () {
let notificationCount = 0; // track unread notifications
const badge = document.getElementById("notificationBadge");
const role = document.getElementById("userRole").value;


 const notificationBtn = document.getElementById("notificationBtn");
const notificationModal = document.getElementById("notificationsModal");
const modalInstance = new bootstrap.Modal(notificationModal);

notificationBtn.addEventListener("click", () => {
  modalInstance.show();
  notificationCount = 0;
  badge.style.display = "none"; // hide badge when user opens modal
});
  // Common UI function for adding notifications
  function addNotification(title, details) {
 
    const notifList = document.querySelector(".list-group-noti");
    if (!notifList) return;

    const item = document.createElement("a");
    item.href = "#";
    item.className = "list-group-item list-group-item-action border border-1 rounded mb-2 p-3 list-group-item-hover";
    item.innerHTML = `<strong>🩺${title}</strong><br><small class="text-muted">${details}</small>`;
    notifList.prepend(item);
      notificationCount++;
  badge.textContent = notificationCount;
  badge.style.display = "inline";

  }

  // Attach listeners based on role
  if (role === "Doctor") {

    socket.on("newAppointment", (data) => {
      console.log("Doctor received newAppointment:", data);
      addNotification(`New Appointment from ${data.patientName}`,`On ${new Date(data.date).toDateString()} at ${data.time}. ${data.reason ? `<br>Reason: ${data.reason}` : ""}`);
    }); 
    socket.on("paymentCompleted", (data) => {
      console.log("Payment completed notification received:", data);
      addNotification(
        `Payment Completed from ${data.patientName}`,
        `Appointment on ${new Date(data.date).toDateString()} at ${data.time}. ${data.reason}`
      );
    });
  
  }

  if (role === "Patient") {
    socket.on("appointmentUpdate", (data) => {
      console.log("Patient received appointmentUpdate:", data);
      addNotification(
        `Appointment ${data.status}`,
        `With Dr. ${data.doctorName} on ${new Date(data.date).toDateString()} at ${data.time}.
        ${data.reason ? `<br>Reason: ${data.reason}` : ""}`
      );
    });
     socket.on("paymentVerified", (data) => {
      addNotification(
        "Payment Verified",
        `${data.message} on ${new Date(data.date).toDateString()} at ${data.time}`
      );
    });

    socket.on("paymentRejected", (data) => {
      addNotification(
        "Payment Rejected",
        `${data.message} on ${new Date(data.date).toDateString()} at ${data.time}`
      );
    });
  }
});
