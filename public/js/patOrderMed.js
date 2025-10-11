// -----------------------------
// Modal Instances
// -----------------------------
const openMedicineBtn = document.getElementById("openMedicineModalBtn");
const medicineModalEl = document.getElementById("medicineOrderModal");
const medicineModal = new bootstrap.Modal(medicineModalEl);

const pharmacyModalEl = document.getElementById("searchPharmacyModal");
const pharmacyModal = new bootstrap.Modal(pharmacyModalEl);

const pharmacyOrderModalEl = document.getElementById("pharmacyOrderModal");
const pharmacyOrderModal = new bootstrap.Modal(pharmacyOrderModalEl);

const selectedMedicineSpan = document.getElementById("selectedMedicine");
const orderPharmacyName = document.getElementById("orderPharmacyName");

// -----------------------------
// Open Medicine Modal
// -----------------------------
openMedicineBtn.addEventListener("click", () => {
  selectedMedicineSpan.textContent = "Paracetamol"; // example
  document.getElementById("quantity").value = 1;
  document.getElementById("deliveryAddress").value = "";
  document.getElementById("prescription").value = "";
  medicineModal.show();
});

// -----------------------------
// Confirm Medicine Order → Open Pharmacy Modal
// -----------------------------
document.getElementById("confirmOrderBtn").addEventListener("click", () => {
  const medicineName = selectedMedicineSpan.textContent;
  const quantity = document.getElementById("quantity").value;
  const address = document.getElementById("deliveryAddress").value;
  const prescription = document.getElementById("prescription").files[0];

  console.log({ medicineName, quantity, address, prescription });

  medicineModal.hide();

  // Set medicine info in pharmacy modal
  pharmacyModalEl.querySelector('.modal-title').textContent = `Search Pharmacy to Order "${medicineName}"`;
  loadPharmacies(fakePharmacies, quantity, address); // load initial pharmacies with prefilled data
  pharmacyModal.show();
});

// -----------------------------
// Fake Pharmacies
// -----------------------------
const fakePharmacies = [
  { name: "City Pharmacy", location: "Main Street", phone: "+91-9876543210" },
  { name: "Green Valley Pharmacy", location: "Green Road", phone: "+91-9876500000" },
  { name: "HealthPlus Pharmacy", location: "Central Avenue", phone: "+91-9812345678" },
  { name: "Sunrise Pharmacy", location: "Sunrise Street", phone: "+91-9876501234" },
];

// -----------------------------
// Create Pharmacy Card
// -----------------------------
function createPharmacyCard(pharmacy, medicineName, quantity, address) {
  const card = document.createElement("div");
  card.className = "card mb-2";
  card.innerHTML = `
    <div class="card-body">
      <h6 class="card-title mb-1">${pharmacy.name}</h6>
      <p class="card-text mb-1">${pharmacy.location}</p>
      <p class="card-text"><small class="text-muted">${pharmacy.phone}</small></p>
      <button class="btn btn-sm btn-success orderBtn">Order "${medicineName}"</button>
    </div>
  `;

  card.querySelector(".orderBtn").addEventListener("click", () => {
    orderPharmacyName.textContent = pharmacy.name;
    document.getElementById("deliveryTime").value = "";
    document.getElementById("medicineCost").value = "";
    document.getElementById("deliveryAddressPharmacy").value = address; // prefill address
    document.getElementById("quantityPharmacy").value = quantity; // optional field if added
    pharmacyOrderModal.show();
  });

  return card;
}

// -----------------------------
// Load Pharmacies
// -----------------------------
const pharmacyListContainer = document.querySelector(".pharmacy-list-scroll");
function loadPharmacies(pharmacies, quantity, address) {
  const medicineName = selectedMedicineSpan.textContent;
  pharmacyListContainer.innerHTML = "";
  pharmacies.forEach(p => pharmacyListContainer.appendChild(createPharmacyCard(p, medicineName, quantity, address)));
}

// -----------------------------
// Pharmacy Search
// -----------------------------
document.getElementById("pharmacySearchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = document.getElementById("pharmacy-searchInput").value.trim().toLowerCase();
  const filtered = fakePharmacies.filter(p => p.name.toLowerCase().includes(query));
  if (filtered.length === 0) {
    pharmacyListContainer.innerHTML = "<p class='text-danger'>No pharmacies found</p>";
  } else {
    const quantity = document.getElementById("quantity").value; // retain original quantity
    const address = document.getElementById("deliveryAddress").value; // retain original address
    loadPharmacies(filtered, quantity, address);
  }
});

// -----------------------------
// Confirm Pharmacy Order
// -----------------------------
document.getElementById("confirmPharmacyOrderBtn").addEventListener("click", () => {
  const deliveryTime = document.getElementById("deliveryTime").value;
  const cost = document.getElementById("medicineCost").value;
  const address = document.getElementById("deliveryAddressPharmacy").value;
  const quantity = document.getElementById("quantityPharmacy")?.value || 1;

  console.log({
    pharmacy: orderPharmacyName.textContent,
    medicine: selectedMedicineSpan.textContent,
    quantity,
    deliveryTime,
    cost,
    address
  });

  pharmacyOrderModal.hide();
});
