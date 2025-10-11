document.addEventListener("DOMContentLoaded", () => {
  const feedbackBtn = document.getElementById("feedbackBtn"); // Button in settings card
  const feedbackCard = document.getElementById("feedbackCard");
  const closeBtn = document.getElementById("closeFeedbackCard");
  const feedbackForm = document.getElementById("feedbackForm");

  if (!feedbackBtn || !feedbackCard || !feedbackForm) return;

  // Open feedback card
  feedbackBtn.addEventListener("click", () => {
    feedbackCard.style.display = "block";
  });

  // Close feedback card
  closeBtn.addEventListener("click", () => {
    feedbackCard.style.display = "none";
  });

  // Handle feedback form submission
  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const userId = feedbackForm.querySelector('input[name="userId"]').value;
    const role = feedbackForm.querySelector('input[name="role"]').value;
    const name = document.getElementById("feedbackName").value.trim();
    const email = document.getElementById("feedbackEmail").value.trim();
    const message = document.getElementById("feedbackMessage").value.trim();

    if (!name || !email || !message) {
      showToast("Please fill in all fields.", "alert");
      return;
    }

    // try {
    //   const response = await fetch(`/sb/feedback`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ userId, role, name, email, message })
    //   });

    //   if (!response.ok) {
    //     const data = await response.json();
    //     throw new Error(data.error || "Failed to submit feedback.");
    //   }

      showToast("Feedback sent! Thank you.", "success");
      feedbackForm.reset();
      feedbackCard.style.display = "none";

    // } catch (err) {
    //   console.error(err);
    //   showToast(err.message, "alert");
    // }
  });
});
