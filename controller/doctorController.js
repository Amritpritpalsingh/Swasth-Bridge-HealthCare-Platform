const dayjs = require("dayjs");
const appointmentModel = require("../models/appointment");
const doctorModel = require("../models/doctor"); 
const catchAsync = require("../utils/catchAsync");
const patientModel = require("../models/patient");

function convertDotKeysToNested(obj) {
  const result = {};
  for (const key in obj) {
    if (key.includes(".")) {
      const keys = key.split(".");
      keys.reduce((acc, k, i) => {
        if (i === keys.length - 1) acc[k] = obj[key];
        else acc[k] = acc[k] || {};
        return acc[k];
      }, result);
    } else {
      result[key] = obj[key];
    }
  }
  return result;
}

// ===== Dashboard =====
exports.getDashboard = catchAsync(async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;

  const appointments = await appointmentModel
    .find({ doctor: user._id })
    .populate("patient", "name");

  const showRNToast = !user.isVerified;
  res.render("doctor/doctorDash.ejs", { user, appointments, showRNToast });
});

// ===== View all patients =====
exports.getAllPatients = catchAsync(async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;

  const appointments = await appointmentModel.find({ doctor: user._id })
    .populate("patient")
    .lean();

  const patientMap = {};
  appointments.forEach(app => {
    if (app.patient) patientMap[app.patient._id] = app.patient;
  });

  res.render("doctor/docPatHis", { patients: Object.values(patientMap), user });
});

// ===== Pending & confirmed appointments (for dashboard) =====
exports.getRequests = catchAsync(async (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;

  const pendingAppointments = await appointmentModel
    .find({ doctor: user._id, status: "Pending" })
    .populate("patient", "name");

  const confirmedAppointments = await appointmentModel
    .find({ doctor: user._id, status: "Confirmed" })
    .populate("patient", "name");

  res.render("doctor/docAppoint.ejs", {
    user,
    pendingAppointments,
    confirmedAppointments,
  });
});

// ===== Today's patients (unique confirmed) =====
exports.getTodayPatients = catchAsync(async (req, res) => {
  const doctorId = req.user._id;
  const startOfDay = dayjs().startOf("day").toDate();
  const endOfDay = dayjs().endOf("day").toDate();

  const appointments = await appointmentModel
    .find({ doctor: doctorId, createdAt: { $gte: startOfDay, $lte: endOfDay } })
    .populate("patient")
    .sort({ createdAt: 1 })
    .lean();

  const uniquePatients = {};
  appointments.forEach(appt => {
    const p = appt.patient;
    if (p?._id && !uniquePatients[p._id]) {
      uniquePatients[p._id] = {
        _id: p._id,
        name: p.name,
        PID: p.PID,
        age: p.dob,
        gender: p.gender,
        blood: p.blood,
        phone: p.phone,
        email: p.email,
        address: p.address,
        status:appt.status || "Pending",
        pic: p.pic || "https://via.placeholder.com/150",
        condition: p.condition || appt.reason || "Consultation",
      };
    }
  });

  res.json(Object.values(uniquePatients));
});

// ===== Update doctor profile =====
const upload = require("../utils/configs/multer");
exports.uploadDoctorPic = upload.profileUpload.single("profilePic");

exports.updateProfile = catchAsync(async (req, res) => {
  var updatedDoctor = req.body;

  
  
  
  if (!updatedDoctor._id)
    return res.status(400).json({ message: "Doctor ID is required" });

  // ---- Handle uploaded file ----
 if (req.file && req.file.path) {
    updatedDoctor.img = req.file.path; // Cloudinary URL
  }

  // ---- Field mapping ----
    updatedDoctor = convertDotKeysToNested(updatedDoctor);

  if (updatedDoctor.pic) {
    updatedDoctor.img = updatedDoctor.pic;
    delete updatedDoctor.pic;
  }

  // ---- Allowed fields ----
  const allowedFields = [
    "name", "email", "phone", "gender", "dob",
    "specialty", "qualifications", "experience", "bio",
    "registrationNumber", "councilName", "registrationYear", "documents",
    "availability", "consultationFee",
    "location.clinicName", "location.address", "location.city", "location.state", "location.pincode",
    "consultationType",
    "upiId",   
    "img" 
  ];

  const updateData = {};
  allowedFields.forEach(key => {
    const keys = key.split(".");
    let temp = updatedDoctor;
    for (let k of keys) {
      if (temp[k] === undefined) return;
      temp = temp[k];
    }
    keys.reduce((obj, k, i) => {
      if (i === keys.length - 1) obj[k] = temp;
      else obj[k] = obj[k] || {};
      return obj[k];
    }, updateData);
  });

  // ---- Check if profile is complete ----
  const requiredFields = [
    "name", "email", "phone", "gender",
    "specialty", "qualifications", "experience",
    "registrationNumber", "councilName", "registrationYear",
    "location.clinicName", "location.address", "location.city", "location.state", "location.pincode",
    "consultationType"
  ];

  const allFilled = requiredFields.every(field => {
    const keys = field.split(".");
    let val = updateData;
    for (let k of keys) {
      if (val[k] === undefined || val[k] === null || val[k] === "") return false;
      val = val[k];
    }
    return true;
  });
  
  

  if (allFilled) updateData.isVerified = true;

  // ---- Get old data to keep old image if not replaced ----
  const existingDoctor = await doctorModel.findById(updatedDoctor._id);
  if (!existingDoctor)
    return res.status(404).json({ message: "Doctor not found" });

  if (!req.file && existingDoctor.img) {
    // keep existing profile picture if no new one uploaded
    updateData.img = existingDoctor.img;
  }

  // ---- Update doctor ----
  const doctor = await doctorModel.findByIdAndUpdate(
    updatedDoctor._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  
  req.flash("success", "Profile updated successfully!");
  res.json({ message: "Doctor profile updated", doctor });
});

// exports.updateProfile = catchAsync(async (req, res) => {
//   const flatData = req.body;
//   console.log("Raw body from FormData:", flatData);

//   if (!flatData._id) {
//     return res.status(400).json({ message: "Doctor ID is required" });
//   }

//   // 🧩 Convert dotted keys (location.city → { location: { city: ... } })
//   const rebuildNested = (data) => {
//     const nested = {};
//     for (const [key, value] of Object.entries(data)) {
//       if (key.includes(".")) {
//         key.split(".").reduce((acc, k, i, arr) => {
//           if (i === arr.length - 1) acc[k] = value;
//           else acc[k] = acc[k] || {};
//           return acc[k];
//         }, nested);
//       } else {
//         nested[key] = value;
//       }
//     }
//     return nested;
//   };

//   const updatedDoctor = rebuildNested(flatData);

//   // 🖼️ Handle file upload (if any)
//   if (req.file && req.file.path) {
//     updatedDoctor.img = req.file.path;
//   }

//   // Keep old image if none uploaded
//   const existingDoctor = await doctorModel.findById(updatedDoctor._id);
//   if (!existingDoctor) {
//     return res.status(404).json({ message: "Doctor not found" });
//   }
//   if (!req.file && existingDoctor.img) {
//     updatedDoctor.img = existingDoctor.img;
//   }

//   // ✅ Verify required fields
//   const requiredFields = [
//     "name", "email", "phone", "gender",
//     "specialty", "qualifications", "experience",
//     "registrationNumber", "councilName", "registrationYear",
//     "location.clinicName", "location.address", "location.city", "location.state", "location.pincode",
//     "consultationType"
//   ];

//   const allFilled = requiredFields.every((field) => {
//     const keys = field.split(".");
//     let val = updatedDoctor;
//     for (const k of keys) val = val?.[k];
//     return val && val !== "";
//   });

//   if (allFilled) updatedDoctor.isVerified = true;

//   // ✅ Update in DB
//   const doctor = await doctorModel.findByIdAndUpdate(
//     updatedDoctor._id,
//     { $set: updatedDoctor },
//     { new: true, runValidators: true }
//   );

//   res.json({ message: "Doctor profile updated successfully", doctor });
// });

// // ===== Today's problems =====
exports.getTodayProblems = catchAsync(async (req, res) => {
  const doctorId = req.user._id;
  const startOfDay = dayjs().startOf("day").toDate();
  const endOfDay = dayjs().endOf("day").toDate();

  const appointments = await appointmentModel
    .find({ doctor: doctorId, createdAt: { $gte: startOfDay, $lte: endOfDay }})
    .populate("patient")
    .sort({ createdAt: 1 })
    .lean();

  const reasons = new Set();
  appointments.forEach(appt => {
    if (appt.patient?._id) {
      reasons.add(appt.patient.condition || appt.reason || "Consultation");
    }
  });

  res.json([...reasons]);
});

// ===== Update appointment status =====
exports.updateAppointmentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const appointmentId = req.params.id;

  const appointment = await appointmentModel
    .findById(appointmentId)
    .populate("patient", "name")
    .populate("doctor", "name");

  if (!appointment) return res.status(404).json({ error: "Appointment not found" });

  appointment.status = status;
  await appointment.save();

  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const patientSocket = userSockets[appointment.patient._id.toString()];

  if (patientSocket) {
    io.to(patientSocket).emit("appointmentUpdate", {
      id: appointment._id,
      doctorName: appointment.doctor?.name || "Unknown Doctor",
      patientName: appointment.patient?.name || "Unknown Patient",
      date: appointment.appointmentDate,
      time: appointment.timeSlot,
      reason: appointment.reason,
      status: appointment.status,
    });
  }

  res.json({ message: "Status updated successfully", appointment });
});

// ===== Count today's patients (new vs old) =====
exports.getTodayPatientsCount = catchAsync(async (req, res) => {
  const doctorId = req.user._id;
  const startOfDay = dayjs().startOf("day").toDate();
  const endOfDay = dayjs().endOf("day").toDate();

  // Step 1️⃣: Get all today's appointments (any status)
  const todayAppointments = await appointmentModel
    .find({
      doctor: doctorId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
    .populate("patient", "_id")
    .lean();

  // Step 2️⃣: Count total appointments per patient (all time)
  const allAppointments = await appointmentModel.aggregate([
    { $match: { doctor: doctorId } },
    { $group: { _id: "$patient", totalAppointments: { $sum: 1 } } }
  ]);

  // Quick lookup map { patientId: totalAppointments }
  const appointmentMap = {};
  for (const a of allAppointments) {
    if (a._id) appointmentMap[a._id.toString()] = a.totalAppointments;
  }

  // Step 3️⃣: Count new vs old patients (unique per patient for today)
  const todayPatientIds = new Set();
  let newCount = 0;
  let oldCount = 0;

  for (const appt of todayAppointments) {
    const pid = appt.patient?._id?.toString();
    if (!pid || todayPatientIds.has(pid)) continue; // count each patient only once today

    todayPatientIds.add(pid);

    const total = appointmentMap[pid] || 0;
    if (total === 1) newCount++;
    else oldCount++;
  }

  res.json({ newCount, oldCount });
});


// ===== Pending appointments =====
exports.getPendingAppointments = catchAsync(async (req, res) => {
  const appointments = await appointmentModel.find({
    doctor: req.user._id,
    status: "Pending"
  }).populate("patient", "name");
  
  res.json(appointments.map(a => ({
    id: a._id,
    patientName: a.patient.name,
    date: a.appointmentDate,
    time: a.timeSlot,
    reason: a.reason, 
    status: a.status,
    consultationtype:a.appointmenttype
  })));
});

// ===== Confirmed appointments =====
exports.getConfirmedAppointments = catchAsync(async (req, res) => {
  const confirmedAppointments = await appointmentModel.find({
    doctor: req.user._id,
    status: "Confirmed"
  }).populate("doctor patient");
  console.log(confirmedAppointments);
  
  res.json(confirmedAppointments.map(appt => ({
    id: appt._id,
    date: appt.appointmentDate,
    time: appt.timeSlot,
    reason: appt.reason,
    doctor: appt.doctor,
    patient: appt.patient,
    consultationtype:appt.appointmenttype,
  })));
});

// ===== Search patients =====
exports.searchPatients = catchAsync(async (req, res) => {
  const q = req.query.q || "";
  const regex = new RegExp(q, "i");
  const doctorId = req.user._id;

  const appointments = await appointmentModel.find({ doctor: doctorId })
    .populate({
      path: "patient",
      match: { $or: [{ name: regex }, { patientId: regex }, { diagnosis: regex }] },
    })
    .lean();

  const patients = appointments.map(app => app.patient).filter(Boolean);
  res.json(patients);
});


// ===== Add patients =====
exports.addPatient = catchAsync(async (req, res) => {
  console.log("Incoming appointment data:", req.body);

  const { pid, complain, diagnosis, prescription, paymentAmount } = req.body;
  const doctorId = req.user._id; // doctor must be logged in

  // 1️⃣ Check if patient exists
  const patient = await patientModel.findOne({ PID: pid });
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  const now = new Date();

  // 2️⃣ Create new appointment
  const appointment = await appointmentModel.create({
    doctor: doctorId,
    patient: patient._id,
    appointmentDate: now,
    appointmenttype: "Offline",
    timeSlot: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    reason: complain || "Consultation",
    diagnosis,
    prescription,
    status: "Completed",
    payment: {
      amount: parseFloat(paymentAmount) || 0, // set amount from request
      paid: false,
      paidAt: null,
      transactionId: null
    }
  });

  // 3️⃣ Return success
  res.status(201).json({
    status: "success",
    message: "Appointment created successfully!",
    appointment
  });
});



// ================= SEARCH PATIENT BY PID =================
exports.searchPatientPID = catchAsync(async (req, res) => {
  const { pid } = req.params;
  if (!pid) {
    return res.status(400).json({ message: "PID is required" });
  }

  // Search patient by their PID (you can also use _id if you prefer)
  const patient = await patientModel.findOne({ PID: pid });
 
  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  // Return patient details
  res.status(200).json({
    status: "success",
    patient: {
      _id :patient._id,
      pid: patient.PID,
      name: patient.name,
      age: patient.dob,
      gender: patient.gender,
    }
  });
});
 
// ===== Get appointment by ID =====
exports.getAppointmentById = catchAsync(async (req, res) => {
  const { id } = req.params;

  
  const appointment = await appointmentModel
    .findById(id)
    .populate("patient")
    .lean();

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  const patient = appointment.patient;
  
  
  res.json({
    name: patient?.name || "",
    PID: patient?.PID || "",
    chiefComplaint: patient?.chiefComplaint || appointment.reason || "",
    diagnosis: appointment.diagnosis || "",
    prescription: appointment.prescription || "",
  });
});

// ===== Save (update) appointment data =====
exports.saveAppointmentData = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, PID, chiefComplaint, diagnosis, prescription, paymentAmount } = req.body; // include paymentAmount

  const appointment = await appointmentModel.findById(id).populate("patient");

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  // Update patient data
  if (appointment.patient) {
    await patientModel.findByIdAndUpdate(
      appointment.patient._id,
      {
        name,
        PID,
        chiefComplaint,
      },
      { new: true, runValidators: true }
    );
  }

  // Update appointment info (diagnosis + prescription)
  appointment.diagnosis = diagnosis;
  appointment.prescription = prescription;

  // Set payment info (default unpaid)
  appointment.payment = {
    amount: parseFloat(paymentAmount) || 0,  // ensure number
    paid: false,
    paidAt: null,
    transactionId: null
  };

  // Update status if provided, otherwise default to Completed
  appointment.status = "Completed";

  await appointment.save();

  res.json({ 
    message: "Patient info saved successfully and appointment payment set",
    appointment
  });
});

exports.renderPaymentVerificationPage = catchAsync(async (req, res) => {
  // Fetch all paid but unverified payments
  const payments = await appointmentModel
  .find({ 
    "payment.paid": true, 
    doctor: req.user._id // only appointments for logged-in doctor
  })
  .populate("patient doctor")
  .sort({ "payment.paidAt": -1 })
  .lean();

console.log(payments);

const user = req.user.toObject ? req.user.toObject() : { ...req.user };
user.role = req.session.passport?.user?.role || user.role;

res.render("doctor/payVerifiaction.ejs", { payments, user });
});

exports.verifyPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const appointment = await appointmentModel.findById(id).populate("patient").populate("doctor");;


  if (!appointment)
    return res.status(404).json({ message: "Appointment not found" });

  appointment.payment.verified = true;
  appointment.payment.verifiedAt = new Date();

  await appointment.save();
  // ----- SOCKET NOTIFICATION TO PATIENT -----
  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const patientSocket = appointment.patient ? userSockets[appointment.patient._id.toString()] : null;

  if (patientSocket) {
    io.to(patientSocket).emit("paymentVerified", {
      doctorName: appointment.doctor.name,
      appointmentId: appointment._id,
      message: `Payment verified by Dr. ${appointment.doctor.name}`,
      date: appointment.appointmentDate,
      time: appointment.timeSlot,
    });
  }

  res.status(200).json({ message: "Payment verified successfully" });

  res.status(200).json({ message: "Payment verified successfully" });
});

exports.rejectPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const appointment = await appointmentModel.findById(id).populate("patient").populate("doctor");
 
  
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found" });

  appointment.payment.paid = false;
  appointment.payment.transactionId = null;
  appointment.payment.screenshotUrl = null;
  
  await appointment.save();
  // ----- SOCKET NOTIFICATION TO PATIENT -----
  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const patientSocket = appointment.patient ? userSockets[appointment.patient._id.toString()] : null;
  if (patientSocket) {
    io.to(patientSocket).emit("paymentRejected", {
      doctorName: appointment.doctor.name,
      appointmentId: appointment._id,
      message: `Payment rejected by Dr. ${appointment.doctor.name}. Contact No.${appointment.doctor.phone}`,
      date: appointment.appointmentDate,
      time: appointment.timeSlot,
    });
  }
  res.status(200).json({ message: "Payment rejected" });
});