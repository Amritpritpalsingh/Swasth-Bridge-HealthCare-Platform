function showConfirm(message) {
  return new Promise((resolve) => {
    const container = document.getElementById("toast-container");
    if (!container) return resolve(false);

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-warning border-0 mb-2`;
    toast.role = "alert";
    toast.ariaLive = "assertive";
    toast.ariaAtomic = "true";
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <div class="ms-auto mt-2 me-2">
          <button class="btn btn-sm btn-success me-1 confirm-yes">Yes</button>
          <button class="btn btn-sm btn-danger confirm-no">No</button>
        </div>
      </div>
    `;

    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { autohide: false });
    bsToast.show();

    toast.querySelector(".confirm-yes").addEventListener("click", () => {
      bsToast.hide();
      resolve(true);
    });
    toast.querySelector(".confirm-no").addEventListener("click", () => {
      bsToast.hide();
      resolve(false);
    });

    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  });
}


// Usage in your click listener
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("verify-btn")) {
    const id = e.target.dataset.id;
    const confirmed = await showConfirm("Verify this payment?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/sb/doc/payments/verify/${id}`, { method: "POST" });
      const data = await res.json();
      showToast(data.message, "success");
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast("Error verifying payment: " + err.message, "error");
    }
  }

  if (e.target.classList.contains("reject-btn")) {
    const id = e.target.dataset.id;
    const confirmed = await showConfirm("Reject this payment?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/sb/doc/payments/reject/${id}`, { method: "POST" });
      const data = await res.json();
      showToast(data.message, "alert");
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      showToast("Error rejecting payment: " + err.message, "error");
    }
  }
});
