
const socket = io();

// Globals
let myPeer, myStream;
const peers = {};
let incomingCall = null;
let currentUserId = null;
let ROOM_ID = null;
let TARGET_ID = null;

document.addEventListener("DOMContentLoaded", async () => {
  currentUserId = document.getElementById("userSocketId").value;

  // Initialize PeerJS
  myPeer = new Peer(currentUserId, {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { 
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ]
    }
  });

  // Get local media
  myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  addLocalVideo(myStream); // Show local video in smallVideo
 
 

  // Listen for incoming PeerJS calls
  myPeer.on("call", (call) => {
     
    incomingCall = call;
    showIncomingCallToast(call.metadata.username); // toast.js function
  });

  myPeer.on("open", (id) => {
    socket.emit("join-room", "GLOBAL_ROOM_" + currentUserId, id);
  });

  // Socket listeners
  socket.on("call-ended", (fromUser) => {
    clearRemoteVideo();
    toggleButtons(false);
  });

  socket.on("call-rejected", (fromUser) => {
    clearRemoteVideo();
    toggleButtons(false);
  });
});


