const express = require("express");
const Router = express.Router();
const { isLoggedIn } = require("../middlewares/auth");
const doctorController = require("../controller/doctorController");
const upload = require("../utils/configs/multer");
const validateProfileUpdate = require("../middlewares/validateProfileUpdate");
const { addPatient } = require("../middlewares/validateAppointment");
// Dashboard
Router.get("/dashboard", isLoggedIn, doctorController.getDashboard);

// All patients
Router.get("/patients/all", isLoggedIn, doctorController.getAllPatients);

// Pending & confirmed requests (dashboard view)
Router.get("/patients/requests", isLoggedIn, doctorController.getRequests);

// Today's patients
Router.get("/today/patients", isLoggedIn, doctorController.getTodayPatients);

// Update profile
Router.put("/update/profile", isLoggedIn,
    upload.profileUpload.single("profilePic"),
    doctorController.updateProfile);

// Today's problems
Router.get("/today/problems", isLoggedIn, doctorController.getTodayProblems);

// Update appointment status
Router.put("/appointments/:id/status", isLoggedIn, doctorController.updateAppointmentStatus);

// Count today's patients
Router.get("/today/patients/count", isLoggedIn, doctorController.getTodayPatientsCount);

// Pending appointments
Router.get("/appointments", isLoggedIn, doctorController.getPendingAppointments);

// Confirmed appointments
Router.get("/appointments/confirm", isLoggedIn, doctorController.getConfirmedAppointments);

// Search patients
Router.get("/patients/search", isLoggedIn, doctorController.searchPatients);

// Add patients 
Router.post("/patients/add", isLoggedIn,addPatient, doctorController.addPatient);

Router.get("/patients/:pid", isLoggedIn, doctorController.searchPatientPID);


Router.get("/patients/appointment/:id", isLoggedIn, doctorController.getAppointmentById);

Router.post("/patients/appointment/:id/save", isLoggedIn, doctorController.saveAppointmentData);

Router.get("/payments",isLoggedIn, doctorController.renderPaymentVerificationPage);
Router.post("/payments/verify/:id",isLoggedIn, doctorController.verifyPayment);
Router.post("/payments/reject/:id",isLoggedIn, doctorController.rejectPayment);
module.exports = Router;
