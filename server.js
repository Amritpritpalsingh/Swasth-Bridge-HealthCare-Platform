require("dotenv").config();
const helmet = require("helmet");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const port = 6006;
const app = express();
const ejs = require("ejs");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
require("./utils/configs/passportConfig.js")(passport);
const connectDB = require("./utils/configs/db.js");
const bcrypt = require("bcryptjs");
const registertionRoutes = require("./routes/registeration");
const docRoutes = require("./routes/doctor");
const flash = require("connect-flash");
const patRoutes = require("./routes/patient.js");
const engine = require("ejs-mate");
const errorHandler = require("./middlewares/errorHandler");
// ========== EJS ==========
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ========== Middlewares ==========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src-attr": ["'unsafe-inline'"],
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://accounts.google.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"

      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://cdn.jsdelivr.net",
        "https://res.cloudinary.com", 
        "https://www.svgrepo.com"
      ],
    connectSrc: ["'self'", "https://accounts.google.com", "https://cdn.jsdelivr.net", "https://0.peerjs.com", "wss://0.peerjs.com", "https://unpkg.com"]
,
    },
  })
);




app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use(require("express-session")({ secret: "secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;
  next();
});

// ========== Routes ==========
app.use("/sb/auth", registertionRoutes);
app.use("/sb/doc", docRoutes);
app.use("/sb/pat", patRoutes);

app.use((req, res) => {
  res.status(404).send("Route not found");
});

// ========== Server + Socket.IO ==========
const server = http.createServer(app);
const io = new Server(server);

// Store sockets by userId
const userSockets = {};



// ========== Socket.IO Setup ==========
io.on("connection", (socket) => {
  console.log("✅ User connected (socket):", socket.id);

  // Store user socket mapping
  socket.on("register", (userId) => {
    if (!userId) return;
    userSockets[userId] = socket.id;
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Join a room
  socket.on("join-room", (roomId, userId) => {
    if (!roomId || !userId) return;
    socket.join(roomId);
    userSockets[userId] = socket.id;
    console.log(`${userId} joined room ${roomId}`);

    // Notify others
    socket.to(roomId).emit("user-connected", userId);

    socket.once("disconnect", () => {
      console.log(`${userId} disconnected from room ${roomId}`);
      socket.to(roomId).emit("user-disconnected", userId);
      delete userSockets[userId];
    });
  });

  // Incoming call
  socket.on("incoming-call", ({ fromUserName, fromUser, targetUserId }) => {
    const targetSocketId = userSockets[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {fromUser,fromUserName});
    }
  });

  // Call ended
  socket.on("call-ended", ({ roomId, fromUser, targetUserId }) => {
    const targetSocketId = userSockets[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", fromUser);
    }
  });

  // Call rejected
  socket.on("call-rejected", ({ roomId, fromUser, targetUserId }) => {
    const targetSocketId = userSockets[targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected", fromUser);
      
    }
  });

  // Disconnect cleanup
  socket.on("disconnect", () => {
    if (socket.userId && userSockets[socket.userId]) {
      delete userSockets[socket.userId];
    } else {
      for (let uid in userSockets) {
        if (userSockets[uid] === socket.id) delete userSockets[uid];
      }
    }
    console.log("❌ User disconnected:", socket.id);
  });
});


// Make io + sockets available in routes
app.set("io", io);
app.set("userSockets", userSockets);

// ========== Start Server ==========
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/`);
  connectDB();
});

app.use(errorHandler);
