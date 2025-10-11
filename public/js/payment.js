document.addEventListener("DOMContentLoaded", () => {
  const showQRBtn = document.getElementById("showQRBtn");
  const confirmPayBtn = document.getElementById("confirmPayBtn");
  const paymentInfo = document.getElementById("paymentInfo");
  const appointmentId = document.getElementById("appointmentId").value;
  const screenshotInput = document.getElementById("paymentScreenshot");
  const txnInput = document.getElementById("transactionId");

  showQRBtn?.addEventListener("click", () => {
    paymentInfo.classList.remove("d-none");
    showQRBtn.classList.add("d-none");
    confirmPayBtn.classList.remove("d-none");
  });

  confirmPayBtn?.addEventListener("click", async () => {
    const txnId = txnInput.value.trim();
    const screenshot = screenshotInput.files[0];

    if (!screenshot) {
      showToast("Please upload the payment screenshot.","alert");
      return;
    }

    if (!txnId) {
      showToast("Please enter your transaction ID.","alert");
      return;
    }

    confirmPayBtn.disabled = true;
    confirmPayBtn.innerText = "Processing...";

    try {
      const formData = new FormData();
      formData.append("screenshot", screenshot);
      formData.append("transactionId", txnId);

      const res = await fetch(`/sb/pat/appointments/pay/${appointmentId}`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");

      showToast("Payment confirmed!", "success");
      setTimeout(() => {
        window.location.href = "/sb/pat/dashboard";
      }, 1000);
    } catch (err) {
      showToast(err.message, "alert");
      confirmPayBtn.disabled = false;
      confirmPayBtn.innerText = "I Paid";
    }
  });
});
