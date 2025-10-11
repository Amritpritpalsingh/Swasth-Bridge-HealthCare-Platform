const fakePharmacies = [
  { name: "City Pharmacy", location: "Main Street", phone: "+91-9876543210" },
  { name: "Green Valley Pharmacy", location: "Green Road", phone: "+91-9876500000" },
  { name: "HealthPlus Pharmacy", location: "Central Avenue", phone: "+91-9812345678" },
  { name: "Sunrise Pharmacy", location: "Sunrise Street", phone: "+91-9876501234" },
];

function createPharmacyCard(pharmacy) {
  const card = document.createElement("div");
  card.className = "card mb-2";
  card.innerHTML = `
    <div class="card-body">
      <h6 class="card-title mb-1">${pharmacy.name}</h6>
      <p class="card-text mb-1">${pharmacy.location}</p>
      <p class="card-text"><small class="text-muted">${pharmacy.phone}</small></p>
      <button class="btn btn-sm btn-success">Order Medicines</button>
    </div>
  `;
  return card;
}

// Handle pharmacy search form
document.getElementById("pharmacySearchForm").addEventListener("submit", function(e){
  e.preventDefault();
  const query = document.getElementById("pharmacy-searchInput").value.trim().toLowerCase();
  const container = document.querySelector(".pharmacy-list-scroll");
  container.innerHTML = "";

  const filtered = fakePharmacies.filter(p => p.name.toLowerCase().includes(query));
  if(filtered.length === 0) {
    container.innerHTML = "<p class='text-danger'>No pharmacies found</p>";
  } else {
    filtered.forEach(p => container.appendChild(createPharmacyCard(p)));
  }
});
