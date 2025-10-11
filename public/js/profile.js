document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileModalEl = document.getElementById("profileModal");
  const profileImg = document.getElementById("profileModalPic");
 
  
  const profileModal = new bootstrap.Modal(profileModalEl);

  profileBtn?.addEventListener("click", () => {
    const userData = JSON.parse(profileBtn.getAttribute("data-user"));
   
    const isDoctor = !!userData.specialty; // detect doctor

    // Profile fields
    profileModalEl.querySelector(".profile-pic").src =
      userData.img || userData.pic || "https://via.placeholder.com/150";
     
      
    profileModalEl.querySelector(".profile-name").textContent = userData.name || "";
    profileModalEl.querySelector(".profile-uid").textContent =  userData.PID  || "";
    
    if (!userData.PID && !isDoctor) {
    showErrorToast("Please complete your profile to generate your Patient ID!");
  }
   if (isDoctor && !userData.isVerified ) {
    showErrorToast("Please complete your profile to Visible To Patients!");
  }


// Dynamic toast for errors (similar to your EJS template)
function showErrorToast(message) {
  const container = document.createElement("div");
  container.className = "position-fixed top-0 start-50 translate-middle-x mt-3";
  container.style.zIndex = "1100";

  container.innerHTML = `
    <div class="toast align-items-center text-bg-danger border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  const toastEl = container.querySelector(".toast");
  const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
  toast.show();

  // Remove toast from DOM after hidden
  toastEl.addEventListener("hidden.bs.toast", () => container.remove());
}

    // Age
    let ageText = "";
    if (!isDoctor) {
      if (userData.age) {
        ageText = userData.age;
      } else if (userData.dob) {
        const dob = new Date(userData.dob);
        const diff = Date.now() - dob.getTime();
        const ageDate = new Date(diff);
        ageText = Math.abs(ageDate.getUTCFullYear() - 1970);
      }
    }
    profileModalEl.querySelector(".profile-age").textContent = ageText;

    // Gender
    profileModalEl.querySelector(".profile-gender").textContent = userData.gender || "";

    // Blood Group
    profileModalEl.querySelector(".profile-blood").textContent = isDoctor ? "" : (userData.bloodGroup || "");

    // Phone
    profileModalEl.querySelector(".profile-phone").textContent = userData.phone || "";

    // Email
    profileModalEl.querySelector(".profile-email").textContent = userData.email || "";

    // Address (Doctor → location, Patient → address)
    const addressField = userData.address || userData.location || {};
    const fullAddress = [
      addressField.street || addressField.address,
      addressField.city,
      addressField.state,
      addressField.pincode,
      addressField.clinicName
    ]
      .filter(Boolean)
      .join(", ");
    profileModalEl.querySelector(".profile-address").textContent = fullAddress || "";

    // Hide age/blood rows for doctors
    profileModalEl.querySelector(".profile-age-row")?.classList.toggle("d-none", isDoctor);
    profileModalEl.querySelector(".profile-blood-row")?.classList.toggle("d-none", isDoctor);

    // Show modal
    profileModal.show();
  });
});
// --------------------------

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("edit-profile-btn")) {
    const userData = JSON.parse(e.target.dataset.user);

    const profileModalEl = document.getElementById("profileModal");
    const profileModalInstance = bootstrap.Modal.getInstance(profileModalEl);

    if (profileModalInstance) {
      profileModalInstance.hide();
      setTimeout(() => openEditProfileModal(userData), 300);
    } else {
      openEditProfileModal(userData);
    }
  }
});


// ✅ Global backdrop cleanup — only remove if no modals are open
document.addEventListener("hidden.bs.modal", () => {
  setTimeout(() => {
    const anyOpenModal = document.querySelector(".modal.show");
    if (!anyOpenModal) {
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach(b => b.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "auto";
    }
  }, 10);
});
