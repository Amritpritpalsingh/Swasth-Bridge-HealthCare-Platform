function openEditProfileModal(userData) {
  showToast("Please Refresh After Update", "alert");

  const formFields = document.getElementById("formFields");
  formFields.innerHTML = ""; // Clear old fields

  const role = document.getElementById("userRole").value;

  // Hidden _id
  formFields.innerHTML += `<input type="hidden" name="_id" value="${userData._id}" />`;

  // Ensure nested objects exist
  if (role === "Doctor") userData.location = userData.location || {};
  else userData.address = userData.address || {};

  // ✅ Profile picture preview + file input
  const existingPic = userData.img || userData.pic || "https://via.placeholder.com/150";
  console.log(existingPic);
  
  formFields.innerHTML += `
    <div class="col-12 mb-3 text-center">
      <label class="form-label d-block fw-bold mb-2">Profile Picture</label>
      <img 
        src="${existingPic}" 
        alt="Current Profile Picture" 
        class="rounded-circle mb-3 shadow" 
        width="120" height="120" 
        id="profilePreview"
        style="object-fit: cover;"
      />
      <input 
        type="file" 
        class="form-control mt-2" 
        name="profilePic" 
        accept="image/*"
        id="profilePicInput"
      />
      <small class="text-muted d-block mt-1">Leave empty to keep current picture</small>
    </div>
  `;

  // 🔁 Live image preview on file change
  
    const fileInput = document.getElementById("profilePicInput");
    const preview = document.getElementById("profilePreview");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        preview.src = file ? URL.createObjectURL(file) : existingPic;
      });
    }
  

  // Common fields (all required)
  const commonFields = [
    { label: "Name", key: "name", type: "text", required: true },
    { label: "Email", key: "email", type: "email", required: true },
    { label: "Phone", key: "phone", type: "text", required: true },
    { label: "Gender", key: "gender", type: "select", options: ["Male", "Female", "Other"], required: true },
    { label: "Date of Birth", key: "dob", type: "date", required: true }
  ];

  // Role-specific fields (all required)
  const roleFields = role === "Doctor"
    ? [
        { label: "Specialty", key: "specialty", type: "text", required: true },
        { label: "Consultation Fee", key: "consultationFee", type: "number", required: true },
        {
          label: "Consultation Type",
          key: "consultationType",
          type: "radio",
          options: ["Offline", "Online", "Both"],
          required: true
        },
        { label: "Clinic Name", key: "location.clinicName", type: "text", className: "clinic-fields", required: true },
        { label: "Address", key: "location.address", type: "text", className: "clinic-fields", required: true },
        { label: "City", key: "location.city", type: "text", className: "clinic-fields", required: true },
        { label: "State", key: "location.state", type: "text", className: "clinic-fields", required: true },
        { label: "Pincode", key: "location.pincode", type: "text", className: "clinic-fields", required: true },
        { label: "Experience (years)", key: "experience", type: "number", required: true },
        { label: "Qualifications (comma separated)", key: "qualifications", type: "text", required: true },
        { label: "Registration Number", key: "registrationNumber", type: "text", required: true },
        { label: "Council Name", key: "councilName", type: "text", required: true },
        { label: "Registration Year", key: "registrationYear", type: "number", required: true },
        { label: "UPI ID", key: "upiId", type: "text", required: true }
      ]
    : [
        { label: "Blood Group", key: "bloodGroup", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
        { label: "Street", key: "address.street", type: "text", required: true },
        { label: "City", key: "address.city", type: "text", required: true },
        { label: "State", key: "address.state", type: "text", required: true },
        { label: "Pincode", key: "address.pincode", type: "text", required: true }
      ];

  const fields = [...commonFields, ...roleFields];

  // Render fields dynamically
  fields.forEach(f => {
    let value = f.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : ""), userData);
    if (f.key === "qualifications" && Array.isArray(value)) value = value.join(", ");
    if (f.type === "date" && value) value = new Date(value).toISOString().split("T")[0];

    let input;
    if (f.type === "select") {
      input = `<select class="form-control" name="${f.key}" required>
        ${f.options.map(opt => `<option value="${opt}" ${opt === value ? "selected" : ""}>${opt}</option>`).join("")}
      </select>`;
    } else if (f.type === "radio") {
      input = f.options.map(opt => `
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="radio" name="${f.key}" value="${opt}" ${opt === value ? "checked" : ""} required>
          <label class="form-check-label">${opt}</label>
        </div>
      `).join("");
    } else {
      input = `<input type="${f.type}" class="form-control" name="${f.key}" value="${value || ""}" required/>`;
    }

    formFields.innerHTML += `
      <div class="col-12 col-md-6 mb-3 ${f.className || ""}">
        <label class="form-label">${f.label}</label>
        ${input}
      </div>
    `;
  });

  // Show modal
  const modalEl = document.getElementById("editProfileModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Toggle clinic fields if consultation type = Online
  function toggleClinicFields(selectedValue) {
    document.querySelectorAll(".clinic-fields").forEach(field => {
      field.style.display = selectedValue === "Online" ? "none" : "";
    });
  }
  const consultationTypeRadios = document.querySelectorAll('input[name="consultationType"]');
  consultationTypeRadios.forEach(radio =>
    radio.addEventListener("change", e => toggleClinicFields(e.target.value))
  );
  toggleClinicFields(userData.consultationType || "Online");

  // Form submit
  const form = document.getElementById("editProfileForm");
  form.onsubmit = async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      showToast("Please fill all required fields before saving.", "alert");
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
      const plain = {};
    formData.forEach((value, key) => {
      if (key.includes(".")) {
        const keys = key.split(".");
        keys.reduce((acc, k, i) => {
          if (i === keys.length - 1) acc[k] = value;
          else acc[k] = acc[k] || {};
          return acc[k];
        }, plain);
      } else {
        plain[key] = value;
      }
    });

// Send JSON (so backend receives nested structure)

    const endpoint = role === "Doctor" ? "/sb/doc/update/profile" : "/sb/pat/update/profile";
   
    
 try {
    const response = await fetch(endpoint, {
      method: "PUT",
      body: formData
    });
    console.log(formData);
    
    const result = await response.json();
    console.log(result);
    
    if (!response.ok) {
      // ✅ Handle Joi validation or server-side errors
      if (result.details && Array.isArray(result.details)) {
        result.details.forEach(msg => showToast(msg, "alert")); // show multiple toasts
      } else {
        showToast(result.message || "Failed to update profile", "alert");
      }
      return;
    }

    // ✅ Success
    bootstrap.Modal.getInstance(modalEl).hide();
    showToast("Profile updated successfully!", "success");

  } catch (err) {
    showToast(err.message, "alert");
  }

  };
};

document.addEventListener("DOMContentLoaded", () => {
  const editProfileBtn = document.getElementById("editProfileBtn");
  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const userData = JSON.parse(editProfileBtn.getAttribute("data-user"));
      openEditProfileModal(userData);
    });
  }
});
// function openEditProfileModal(userData) {
//   showToast("Please Refresh After Update", "alert");

//   const formFields = document.getElementById("formFields");
//   formFields.innerHTML = ""; // Clear old fields

//   const role = document.getElementById("userRole").value;

//   // Hidden _id
//   formFields.innerHTML += `<input type="hidden" name="_id" value="${userData._id}" />`;

//   // Ensure nested objects exist
//   if (role === "Doctor") userData.location = userData.location || {};
//   else userData.address = userData.address || {};

//   // Profile picture preview + file input
//   const existingPic = userData.img || userData.pic || "https://via.placeholder.com/150";
//   formFields.innerHTML += `
//     <div class="col-12 mb-3 text-center">
//       <label class="form-label d-block fw-bold mb-2">Profile Picture</label>
//       <img 
//         src="${existingPic}" 
//         alt="Current Profile Picture" 
//         class="rounded-circle mb-3 shadow" 
//         width="120" height="120" 
//         id="profilePreview"
//         style="object-fit: cover;"
//       />
//       <input 
//         type="file" 
//         class="form-control mt-2" 
//         name="profilePic" 
//         accept="image/*"
//         id="profilePicInput"
//       />
//       <small class="text-muted d-block mt-1">Leave empty to keep current picture</small>
//     </div>
//   `;

//   // Live image preview on file change
//   setTimeout(() => {
//     const fileInput = document.getElementById("profilePicInput");
//     const preview = document.getElementById("profilePreview");
//     if (fileInput) {
//       fileInput.addEventListener("change", (e) => {
//         const file = e.target.files[0];
//         preview.src = file ? URL.createObjectURL(file) : existingPic;
//       });
//     }
//   }, 50);

//   // Common fields
//   const commonFields = [
//     { label: "Name", key: "name", type: "text", required: true },
//     { label: "Email", key: "email", type: "email", required: true },
//     { label: "Phone", key: "phone", type: "text", required: true },
//     { label: "Gender", key: "gender", type: "select", options: ["Male", "Female", "Other"], required: true },
//     { label: "Date of Birth", key: "dob", type: "date", required: true }
//   ];

//   // Role-specific fields
//   const roleFields = role === "Doctor"
//     ? [
//         { label: "Specialty", key: "specialty", type: "text", required: true },
//         { label: "Consultation Fee", key: "consultationFee", type: "number", required: true },
//         { label: "Consultation Type", key: "consultationType", type: "radio", options: ["Offline", "Online", "Both"], required: true },
//         { label: "Clinic Name", key: "location.clinicName", type: "text", className: "clinic-fields", required: true },
//         { label: "Address", key: "location.address", type: "text", className: "clinic-fields", required: true },
//         { label: "City", key: "location.city", type: "text", className: "clinic-fields", required: true },
//         { label: "State", key: "location.state", type: "text", className: "clinic-fields", required: true },
//         { label: "Pincode", key: "location.pincode", type: "text", className: "clinic-fields", required: true },
//         { label: "Experience (years)", key: "experience", type: "number", required: true },
//         { label: "Qualifications (comma separated)", key: "qualifications", type: "text", required: true },
//         { label: "Registration Number", key: "registrationNumber", type: "text", required: true },
//         { label: "Council Name", key: "councilName", type: "text", required: true },
//         { label: "Registration Year", key: "registrationYear", type: "number", required: true },
//         { label: "UPI ID", key: "upiId", type: "text", required: true }
//       ]
//     : [
//         { label: "Blood Group", key: "bloodGroup", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], required: true },
//         { label: "Street", key: "address.street", type: "text", required: true },
//         { label: "City", key: "address.city", type: "text", required: true },
//         { label: "State", key: "address.state", type: "text", required: true },
//         { label: "Pincode", key: "address.pincode", type: "text", required: true }
//       ];

//   const fields = [...commonFields, ...roleFields];

//   // Render fields dynamically
//   fields.forEach(f => {
//     let value = f.key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : ""), userData);
//     if (f.key === "qualifications" && Array.isArray(value)) value = value.join(", ");
//     if (f.type === "date" && value) value = new Date(value).toISOString().split("T")[0];

//     let input;
//     if (f.type === "select") {
//       input = `<select class="form-control" name="${f.key}" required>
//         ${f.options.map(opt => `<option value="${opt}" ${opt === value ? "selected" : ""}>${opt}</option>`).join("")}
//       </select>`;
//     } else if (f.type === "radio") {
//       input = f.options.map(opt => `
//         <div class="form-check form-check-inline">
//           <input class="form-check-input" type="radio" name="${f.key}" value="${opt}" ${opt === value ? "checked" : ""} required>
//           <label class="form-check-label">${opt}</label>
//         </div>
//       `).join("");
//     } else {
//       input = `<input type="${f.type}" class="form-control" name="${f.key}" value="${value || ""}" required/>`;
//     }

//     formFields.innerHTML += `
//       <div class="col-12 col-md-6 mb-3 ${f.className || ""}">
//         <label class="form-label">${f.label}</label>
//         ${input}
//       </div>
//     `;
//   });

//   // Show modal
//   const modalEl = document.getElementById("editProfileModal");
//   const modal = new bootstrap.Modal(modalEl);
//   modal.show();

//   // Toggle clinic fields if consultation type = Online
//   function toggleClinicFields(selectedValue) {
//     document.querySelectorAll(".clinic-fields").forEach(field => {
//       field.style.display = selectedValue === "Online" ? "none" : "";
//     });
//   }
//   document.querySelectorAll('input[name="consultationType"]').forEach(radio =>
//     radio.addEventListener("change", e => toggleClinicFields(e.target.value))
//   );
//   toggleClinicFields(userData.consultationType || "Online");

//   // Form submit
//   const form = document.getElementById("editProfileForm");
//   form.onsubmit = async (e) => {
//     e.preventDefault();
//     if (!form.checkValidity()) {
//       showToast("Please fill all required fields before saving.", "alert");
//       form.reportValidity();
//       return;
//     }

//     const formData = new FormData(form);

//     // Debug: see what is being sent
//     for (let pair of formData.entries()) console.log(pair[0], pair[1]);

//     const endpoint = role === "Doctor" ? "/sb/doc/update/profile" : "/sb/pat/update/profile";

//     try {
//       const response = await fetch(endpoint, {
//         method: "PUT",
//         body: formData  // ✅ important: send FormData as-is
//       });

//       const result = await response.json();
//       console.log(result);

//       if (!response.ok) {
//         if (result.details && Array.isArray(result.details)) {
//           result.details.forEach(msg => showToast(msg, "alert"));
//         } else {
//           showToast(result.message || "Failed to update profile", "alert");
//         }
//         return;
//       }

//       bootstrap.Modal.getInstance(modalEl).hide();
//       showToast("Profile updated successfully!", "success");

//     } catch (err) {
//       showToast(err.message, "alert");
//     }
//   };
// }

// document.addEventListener("DOMContentLoaded", () => {
//   const editProfileBtn = document.getElementById("editProfileBtn");
//   if (editProfileBtn) {
//     editProfileBtn.addEventListener("click", () => {
//       const userData = JSON.parse(editProfileBtn.getAttribute("data-user"));
//       openEditProfileModal(userData);
//     });
//   }
// });
