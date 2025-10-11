// ==========================================
// DOCTOR MODE SELECTION + SEARCH FUNCTIONALITY
// ==========================================
let selectedMode = "";

// Handle mode button clicks
document.querySelectorAll("#doctorMode .btn").forEach(btn => {
  btn.addEventListener("click", function () {
    document.querySelectorAll("#doctorMode .btn").forEach(b => b.classList.remove("active"));
    this.classList.add("active");
    selectedMode = this.getAttribute("data-mode");
     const modeInput = document.getElementById("appointmentTypeBtn");
    if (modeInput) modeInput.value = selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1).toLowerCase();
  });
});

// Utility: Apply theme class
function applyThemeClass(el) {
  if (document.body.classList.contains("dark-mode")) {
    el.classList.add("dark-mode");
  } else {
    el.classList.remove("dark-mode");
  }
}

// Utility: Create Doctor Card
function createDoctorCard(doc,mode) {
  const card = document.createElement("div");
  card.className = "card mb-2 doctor-card";

  card.innerHTML = `
    <div class="card-body">
      <h6 class="card-title mb-1">${doc.name}</h6>
      <p class="card-text text-muted mb-1">${doc.specialty}</p>
      <div class="doctor-details d-none mt-2">
        <p class="mb-1"><strong>Hospital:</strong> ${doc.location?.clinicName || "N/A"}</p>
        <p class="mb-2"><strong>Experience:</strong> ${doc.experience || "N/A"} years</p>
        <button class="btn btn-sm btn-success book-btn">Book Appointment</button>
        <button class="btn btn-sm btn-outline-primary profile-btn">Profile</button>
      </div>
    </div>
  `;

  applyThemeClass(card);

  // Expand toggle (ignore button clicks)
  card.addEventListener("click", (e) => {
    if (e.target.classList.contains("book-btn") || e.target.classList.contains("profile-btn")) return;
    card.classList.toggle("expanded");
    card.querySelector(".doctor-details").classList.toggle("d-none");
  });

  // Book Appointment button
  card.querySelector(".book-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("appointmentDoctor").textContent = doc.name;
    document.getElementById("appointmentDoctorId").value = doc._id || doc.id;
    const modal = new bootstrap.Modal(document.getElementById("scheduleAppointmentModal"));
    modal.show();
  });

  // Profile button
  card.querySelector(".profile-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const loc = doc.location || {};
    const fullAddress = [loc.address, loc.city, loc.state, loc.pincode, loc.clinicName].filter(Boolean).join(", ");
    const profileModalEl = document.getElementById("profileModal");

    profileModalEl.querySelector(".profile-pic").src = doc.img || "https://via.placeholder.com/150";
    profileModalEl.querySelector(".profile-name").textContent = doc.name;
    profileModalEl.querySelector(".profile-uid").textContent = `Doctor ID: ${doc._id || doc.id}`;
    profileModalEl.querySelector(".profile-gender").textContent = doc.gender || "N/A";
    profileModalEl.querySelector(".profile-phone").textContent = doc.phone || "N/A";
    profileModalEl.querySelector(".profile-email").textContent = doc.email || "N/A";
    profileModalEl.querySelector(".profile-address").textContent = fullAddress || "";

    profileModalEl.querySelector(".profile-age-row")?.classList.add("d-none");
    profileModalEl.querySelector(".profile-blood-row")?.classList.add("d-none");

    const modalActions = profileModalEl.querySelector(".modal-actions");
    modalActions.innerHTML = `<button class="btn btn-sm btn-success book-btn-inside">Book Appointment</button>`;
    const bookInsideBtn = modalActions.querySelector(".book-btn-inside");

    bookInsideBtn.addEventListener("click", () => {
      document.getElementById("appointmentDoctor").textContent = doc.name;
      document.getElementById("appointmentDoctorId").value = doc._id || doc.id;
      const modal = new bootstrap.Modal(document.getElementById("scheduleAppointmentModal"));
      modal.show();
    });

    applyThemeClass(profileModalEl);
    const profileModal = new bootstrap.Modal(profileModalEl);
    profileModal.show();
  });

  return card;
}

// Handle search submit
document.getElementById("doctorSearchForm")?.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!selectedMode) return showToast("Please select a mode before searching!", "alert");

  const query = document.getElementById("schdoc-searchInput").value.trim();
  const mode = selectedMode;
  const container = document.querySelector(".schdoc-doctor-list-scroll");
  container.innerHTML = "<p class='text-muted'>Searching...</p>";

  try {
    const res = await fetch(`/sb/pat/search/doctors?query=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`);
    const doctors = await res.json();
    container.innerHTML = "";
    if (!doctors.length) return container.innerHTML = "<p class='text-danger'>No doctors found</p>";

    doctors.forEach(doc => container.appendChild(createDoctorCard(doc,mode)));
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p class='text-danger'>Error fetching doctors</p>";
  }
});

// ==========================================
// GLOBAL DOM CONTENT LOADED INITIALIZER
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Appointment Booking
  const appointmentDoctorSpan = document.getElementById("appointmentDoctor");
  const doctorIdInput = document.getElementById("appointmentDoctorId");
  const dateInput = document.getElementById("appointmentDate");
  const timeInput = document.getElementById("appointmentTime");
  const reasonInput = document.getElementById("appointmentReason");
  const confirmBtn = document.getElementById("confirmAppointmentBtn");
  const cancelBtn = document.getElementById("cancelAppointmentBtn");

  confirmBtn?.addEventListener("click", async () => {
    const doctorId = doctorIdInput.value.trim();
    const doctorName = appointmentDoctorSpan.textContent.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const reason = reasonInput.value.trim();
   const appointmentTypeInput = document.getElementById("appointmentTypeBtn");
    const appointmenttype = appointmentTypeInput?.value || "Offline";

    // 🚫 Prevent past dates
const today = new Date();
const selectedDate = new Date(date);

// Reset time for comparison (to ignore time part of "today")
today.setHours(0, 0, 0, 0);
selectedDate.setHours(0, 0, 0, 0);

if (selectedDate < today) {
  showToast("You cannot select a past date for your appointment.","alert");
  return;
}

if (selectedDate.getTime() === today.getTime()) {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  // Construct selected time on today's date
  const selectedTime = new Date();
  selectedTime.setHours(hours, minutes, 0, 0);

  if (selectedTime <= now) {
    showToast("Please select a future time for your appointment.", "alert");
    return;
  }
}

    const requiredFields = { doctorId, doctorName, date, time, reason, appointmenttype };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return showToast(`Please fill in the ${key} field.`, "alert");
      }
    }


    try {
      const response = await fetch("/sb/pat/appointment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, doctorName, date, time, reason, appointmenttype }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Could not schedule appointment");
      }

      cancelBtn?.click();
      dateInput.value = timeInput.value = reasonInput.value = "";
     
      showToast("Appointment scheduled successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast(`❌ ${err.message}`, "alert");
    }
  });

  // Top Doctors Carousel
  const carouselInner = document.getElementById("doctorsCarouselInner");
  if (carouselInner) {
    function getCardsPerSlide() {
      if (window.innerWidth < 576) return 1;
      if (window.innerWidth < 992) return 2;
      return 3;
    }

    function createCarousel(doctors) {
      if (!doctors || !doctors.length) {
        carouselInner.innerHTML = "<p class='text-danger'>No doctors found.</p>";
        return;
      }

      const cardsPerSlide = getCardsPerSlide();
      carouselInner.innerHTML = "";

      for (let i = 0; i < doctors.length; i += cardsPerSlide) {
        const slide = document.createElement("div");
        slide.className = "carousel-item" + (i === 0 ? " active" : "");
        const row = document.createElement("div");
        row.className = "row justify-content-center";

        for (let j = i; j < i + cardsPerSlide && j < doctors.length; j++) {
          const col = document.createElement("div");
          col.className = "col-12 col-sm-6 col-md-4 d-flex justify-content-center mb-3";
          const userDataStr = JSON.stringify(doctors[j]).replace(/'/g, "&apos;");
          col.innerHTML = `
            <button type="button"  class="btn mt-3 feature-btn text-center p-3 w-100 shadow-sm rounded-3 d-flex flex-column align-items-center open-profile-btn"
                    data-user='${userDataStr}'>
              <img src="${doctors[j].img || 'https://via.placeholder.com/150'}" class="rounded-circle mb-2" 
                   width="100" height="100" style="object-fit: cover;" alt="${doctors[j].name}">
              <div class="fw-semibold">${doctors[j].name}</div>
              <small class="text-muted">${doctors[j].specialty}</small>
            </button>
          `;
          applyThemeClass(col.querySelector("button"));
          row.appendChild(col);
        }

        slide.appendChild(row);
        carouselInner.appendChild(slide);
      }
    }

    async function fetchDoctors() {
      try {
        const res = await fetch("/sb/pat/top/doctors");
        if (!res.ok) throw new Error("Failed to fetch");
        const doctors = await res.json();
        createCarousel(doctors);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        carouselInner.innerHTML = "<p class='text-danger'>Failed to load doctors.</p>";
      }
    }

    document.addEventListener("click", function (e) {
      const btn = e.target.closest(".open-profile-btn");
      if (!btn) return;

      const userData = JSON.parse(btn.getAttribute("data-user").replace(/&apos;/g, "'"));
      const profileModalEl = document.getElementById("profileModal");
      const profileModal = new bootstrap.Modal(profileModalEl);
      const isDoctor = !!userData.specialty;

      profileModalEl.querySelector(".profile-pic").src = userData.img || "https://via.placeholder.com/150";
      profileModalEl.querySelector(".profile-name").textContent = userData.name || "";
      profileModalEl.querySelector(".profile-uid").textContent = userData._id || "";
      profileModalEl.querySelector(".profile-gender").textContent = userData.gender || "";
      profileModalEl.querySelector(".profile-phone").textContent = userData.phone || "";
      profileModalEl.querySelector(".profile-email").textContent = userData.email || "";

      const loc = userData.location || {};
      const fullAddress = [loc.address, loc.city, loc.state, loc.pincode, loc.clinicName].filter(Boolean).join(", ");
      profileModalEl.querySelector(".profile-address").textContent = fullAddress || "";

      const ageText = !isDoctor && userData.dob
        ? Math.abs(new Date(Date.now() - new Date(userData.dob).getTime()).getUTCFullYear() - 1970)
        : userData.age || "";

      profileModalEl.querySelector(".profile-age").textContent = ageText;
      profileModalEl.querySelector(".profile-age-row")?.classList.toggle("d-none", isDoctor);
      profileModalEl.querySelector(".profile-blood-row")?.classList.toggle("d-none", isDoctor);

      const editBtn = profileModalEl.querySelector(".edit-profile-btn");
      if (editBtn) editBtn.style.display = isDoctor ? "none" : "";

      applyThemeClass(profileModalEl);
      profileModal.show();
    });

    fetchDoctors();
    window.addEventListener("resize", fetchDoctors);
  }



  // =======================
  // LOAD REPORTS FUNCTION
  // =======================
  async function loadReports() {
  const container = document.getElementById("reportsList");
  if (!container) return;

  container.innerHTML = "<p class='text-muted'>Loading reports...</p>";

  try {
    const res = await fetch("/sb/pat/appointments/complete");
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const reports = await res.json();
    
    container.innerHTML = "";

    if (!reports.length) {
      container.innerHTML = "<p class='text-danger'>No reports found</p>";
      return;
    }

    reports.forEach(report => {
      const reportDate = report.date ? new Date(report.date).toLocaleDateString() : "Unknown Date";
      const payment = report.payment || {};
      const paymentAmount = payment.amount || 0;
      const paid = payment.paid || false;
      const verified = payment.verified || false;
    
      
      let actionHTML = "";

      if (paid && !verified) {
        // Payment done but pending verification
        actionHTML = `<span class="badge bg-warning text-dark">Pending Verification</span>`;
      } else if (paid && verified) {
        // Payment verified → show download
        actionHTML = `<a href="/sb/pat/download/${report._id}" class="btn btn-sm btn-success" download>
                        Download Report
                      </a>`;
      } else {
        // Not paid yet → redirect to payment page
        actionHTML = `<button class="btn btn-sm btn-warning" onclick="initiatePayment('${report._id}')">
                        Pay ₹${paymentAmount} to Download
                      </button>`;
      }

      const div = document.createElement("div");
      div.className = "list-group-item";
      div.innerHTML = `
        <h6 class="mb-1">${report.title || "Appointment Summary"}</h6>
        <small class="text-muted">Date: ${reportDate}</small>
        <div class="mt-2">${actionHTML}</div>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error fetching reports:", err);
    container.innerHTML = "<p class='text-danger'>Error fetching reports</p>";
  }
}

// =======================
// PAYMENT PAGE REDIRECT
// =======================
window.initiatePayment = function (appointmentId) {
  if (!appointmentId) return alert("Invalid appointment ID");

  // Redirect to the separate payment page
  window.location.href = `/sb/pat/appointments/payment/${appointmentId}`;
};

// =======================
// REPORT MODAL HANDLER (if you still use modal)
// =======================
const reportsModal = document.getElementById("reportsModal");
if (reportsModal) {
  reportsModal.addEventListener("show.bs.modal", loadReports);
}

loadReports();

});