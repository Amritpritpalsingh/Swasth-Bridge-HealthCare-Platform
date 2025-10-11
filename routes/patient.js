const express = require("express");
const Router = express.Router();
const { isLoggedIn } = require("../middlewares/auth");
const patientController = require("../controller/patientController");
const upload = require("../utils/configs/multer");
const validateProfileUpdate = require("../middlewares/validateProfileUpdate");
// Dashboard
Router.get("/dashboard", isLoggedIn, patientController.getDashboard);

// Appointment booking page
Router.get("/appointments", isLoggedIn, patientController.getAppointmentPage);

// Confirmed appointments
Router.get("/appointments/booked", isLoggedIn, patientController.getBookedAppointments);

// Search doctors
Router.get("/search/doctors", isLoggedIn, patientController.searchDoctors);

// Request appointment
Router.post("/appointment/request", isLoggedIn, patientController.requestAppointment);

// Update profile
Router.put("/update/profile", isLoggedIn,validateProfileUpdate("Patient"),
    upload.profileUpload.single("profilePic"),
    patientController.updateProfile);

// GET /pat/download/:id
Router.get("/download/:id", isLoggedIn,patientController.downloadAppointmentPDF);


Router.get("/appointments/complete",isLoggedIn, patientController.getCompletedAppointments);

Router.get("/top/doctors",isLoggedIn, patientController.getTopDoctors);

Router.get("/appointments/payment/:id",isLoggedIn, patientController.renderPaymentPage);

// Mark payment as done
Router.post("/appointments/pay/:id",isLoggedIn,
   upload.screenshotUpload.single("screenshot"),
     patientController.markPaymentPaid);

module.exports = Router;
