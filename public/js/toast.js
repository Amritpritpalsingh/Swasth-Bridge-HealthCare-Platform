// =================== TOAST INITIALIZATION ===================
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#toast-container .toast").forEach(el => {
    const toast = new bootstrap.Toast(el, { delay: 5000 });
    toast.show();
  });
});

// =================== DYNAMIC TOAST FUNCTION ===================
function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const typeMap = {
    alert: "danger",   // red
    error: "danger",   // red
    success: "success",
    warning: "warning",
    info: "info",
  };

  const bsType = typeMap[type] || "info"; 
  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-bg-${bsType} border-0 mb-2`;
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;

  container.appendChild(toast);
  const b = new bootstrap.Toast(toast, { delay: 5000 });
  b.show();
  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

// =================== SOCKET.IO EVENTS ===================


socket.on("notification", data => {
  showToast(data.message || "Notification", data.type || "info");
});

// =================== INCOMING CALL HANDLING ===================


function showIncomingCallToast(fromUser) {
  const toastEl = document.getElementById("incomingCallToast");
  document.getElementById("incomingCallerName").textContent = fromUser

  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  // Accept call
  document.getElementById("acceptCallBtn").onclick = () => {
    toast.hide();
    
    
    if (incomingCall) {
      incomingCall.answer(myStream); // send local stream
      incomingCall.on("stream", remoteStream => addRemoteVideo(remoteStream)); // show remote
      incomingCall.on("close", () => {
        clearRemoteVideo();
        toggleButtons(false);
      });
      peers[incomingCall.peer] = incomingCall;
      toggleButtons(true);
     
      
      openVideoConsultationModal(incomingCall.metadata.roomId);
      incomingCall = null;
      
      
    }
  };

  // Reject call
  document.getElementById("rejectCallBtn").onclick = () => {
    toast.hide();
    if (incomingCall) {
      socket.emit("call-rejected", {
        fromUser: currentUserId,
        targetUserId: incomingCall.peer
      });
      incomingCall.close();
      incomingCall = null;
    }
  };
}
