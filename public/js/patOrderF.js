// -----------------------------
// Modal Instances
// -----------------------------
const openMedicineBtn = document.getElementById("openMedicineModalBtn");
const medicineModalEl = document.getElementById("medicineOrderModal");
const medicineModal = new bootstrap.Modal(medicineModalEl);
const pharmacyModalEl = document.getElementById("searchPharmacyModal");
const pharmacyModal = new bootstrap.Modal(pharmacyModalEl);
const selectedMedicineSpan = document.getElementById("selectedMedicine");

// -----------------------------
// Open Medicine Modal
// -----------------------------
openMedicineBtn.addEventListener("click", () => {
  // Dynamically set medicine name if needed
  selectedMedicineSpan.textContent = "Medicine"; // Or fetch from dataset

  // Reset form fields safely
  const quantityInput = document.getElementById("quantity");
  const addressInput = document.getElementById("deliveryAddress");
  const prescriptionInput = document.getElementById("prescription");

  if (quantityInput) quantityInput.value = 1;
  if (addressInput) addressInput.value = "";
  if (prescriptionInput) prescriptionInput.value = "";

  // Show modal
  medicineModal.show();
});

// -----------------------------
// Handle Confirm Order
// -----------------------------
document.getElementById("confirmOrderBtn").addEventListener("click", () => {

  const quantity = document.getElementById("quantity")?.value || 1;
  const address = document.getElementById("deliveryAddress")?.value || "";
  const prescription = document.getElementById("prescription")?.files?.[0] || null;
  const medicineName = selectedMedicineSpan?.textContent || "Medicine";

  console.log({ medicineName, quantity, address, prescription });
  // TODO: Call backend API to place order

  // Close Medicine Modal
  medicineModal.hide();

  // Set title in Pharmacy Modal
  if (pharmacyModalEl) {
    const titleEl = pharmacyModalEl.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = `Search Pharmacy to Order "${medicineName}"`;
  }

  // Show Pharmacy Modal
  pharmacyModal.show();
});
