
const localVideo = document.getElementById("smallVideo");
const remoteVideo = document.getElementById("mainVideo");
const endBtn = document.getElementById("end");

// Open modal
function openVideoConsultationModal(appointmentId) {
  const modalEl = document.getElementById("videoConsultationModal");
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
  modalEl.addEventListener("shown.bs.modal", () => {
    getAppointId(appointmentId); // use the actual ID from the call
  });
  
}

// End video call
function endVideo() {
  Object.values(peers).forEach(call => call.close());
  Object.keys(peers).forEach(id => delete peers[id]);

  clearRemoteVideo();
  toggleButtons(false);

  if (currentUserId && TARGET_ID && ROOM_ID) {
    socket.emit("call-ended", {
      fromUser: currentUserId,
      targetUserId: TARGET_ID,
      roomId: ROOM_ID
    });
  }

  const modalEl = document.getElementById("videoConsultationModal");
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
}

// Show/hide end button
function toggleButtons(callActive) {
  endBtn.classList.toggle("d-none", !callActive);
}

// Local/remote video
function addLocalVideo(stream) {
  localVideo.srcObject = stream;
  localVideo.muted = true;
  localVideo.addEventListener("loadedmetadata", () => localVideo.play());
}

function addRemoteVideo(stream) {
  remoteVideo.srcObject = stream;
  remoteVideo.addEventListener("loadedmetadata", () => remoteVideo.play());
}

function clearRemoteVideo() {
  remoteVideo.srcObject = null;
}

// Connect to another user (caller)
function connectToUser(targetUser, roomId,username) {
  if (!myStream) return alert("Camera not ready!");
  if (peers[targetUser]) return;
  TARGET_ID = targetUser;
  ROOM_ID = roomId;

  console.log("Connecting to user with roomId:", ROOM_ID);
  const call = myPeer.call(targetUser, myStream,{
  metadata: { roomId: roomId, targetUser, username:username }
});

  // Attach remote stream for caller
  call.on("stream", remoteStream => addRemoteVideo(remoteStream));

  call.on("close", () => {
    clearRemoteVideo();
    toggleButtons(false);
  });

  peers[targetUser] = call;

  socket.emit("incoming-call", {
    fromUser: currentUserId,
    fromUserName:username, // <--- add this
    targetUserId: TARGET_ID,
    roomId: ROOM_ID
  });

  toggleButtons(true);
  openVideoConsultationModal(roomId);
  
}

// Handle Join Call button clicks
document.addEventListener("click", (event) => {
 
   if (!event.target.classList.contains("join-call-btn")) return;

  const button = event.target;
  if (button.dataset.disabled === "true") {
    showToast("Not consultation time", "alert");
    return;
  }
  
  const appointmentId = button.dataset.appointmentId;
  const doctorId = button.dataset.doctorId;
  const patientId = button.dataset.patientId;
  const doctorName = button.dataset.doctorName;
  const patientName = button.dataset.patientName;
  const isDisable =  button.dataset.disabled;
  const targetUserId = currentUserId === doctorId ? patientId : doctorId;
  const targetUserName = currentUserId === doctorId ?doctorName:patientName;
  window.roomId = appointmentId;  
  
  
  connectToUser(targetUserId, appointmentId, targetUserName);
  
});

