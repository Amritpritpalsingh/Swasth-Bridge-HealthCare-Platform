document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector("#patientSearch");
  const searchBtn = document.querySelector("#patientSearchBtn");
  const tableBody = document.querySelector("#patientsTable tbody");

  async function searchPatients() {
    const query = searchInput.value.trim();

    // If no search term, reload ALL patients
    if (!query) {
      location.reload(); // reload page with all patients
      return;
    }

    const res = await fetch(`/sb/doc/patients/search?q=${encodeURIComponent(query)}`);
    const patients = await res.json();

    tableBody.innerHTML = "";

    if (patients.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No results found</td></tr>`;
      return;
    }

    patients.forEach((p, i) => {
      const row = `
        <tr>
          <td>${p.patientId || `P-${i+1}`}</td>
          <td>${p.name}</td>
          <td>${p.age}</td>
          <td>${p.gender}</td>
          <td>${p.diagnosis}</td>
          <td>${p.lastVisit ? new Date(p.lastVisit).toISOString().split("T")[0] : "-"}</td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  }

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    searchPatients();
  });

  // Optional: live search while typing
  searchInput.addEventListener("keyup", () => {
    searchPatients();
  });
});
