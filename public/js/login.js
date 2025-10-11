document.addEventListener("DOMContentLoaded", () => {
  const extraField = document.getElementById("extraField");
  const roleInput = document.getElementById("roleInput");
  const googleBtn = document.getElementById("googleLoginupBtn"); 
  const buttons = document.querySelectorAll(".role-selector button");

  const roleFields = {
    patientBtn: `<input type="text" name="name" placeholder="Full Name" class="form-control mb-2" required>`,
    doctorBtn: `<small style="display:block; text-align:left; margin-bottom:6px; color:#555;">
                  * Doctor login only needs email & password
                </small>`,
    pharmacyBtn: `<input type="text" name="pharmacyName" class="form-control mb-2" placeholder="Pharmacy Name" required>`
  };

  // Handle role switching
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      extraField.innerHTML = roleFields[btn.id];
      const selectedRole =
        btn.id === "patientBtn" ? "Patient" :
        btn.id === "doctorBtn" ? "Doctor" :
        "Pharmacy";

      roleInput.value = selectedRole;
      googleBtn.href = `/sb/auth/google?role=${selectedRole}`;
    });
  });
});
