const doctorModel = require("../models/doctor");
const appointmentModel = require("../models/appointment");
const patientModel = require("../models/patient");
const crypto = require("crypto");
const catchAsync = require("../utils/catchAsync");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const upload = require("../utils/configs/multer.js");
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
// Utility: Generate Patient ID
function generatePatientId(name, phone, dob) {
  const input = `${phone}-${name}-${dob}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const base36 = parseInt(hash.substring(0, 10), 16).toString(36).toUpperCase();
  return base36.substring(0, 6);
}

// ===== Dashboard =====
exports.getDashboard = (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;
  const showPidToast = !user.PID;
  res.render("patient/patDash.ejs", { showPidToast, user });
};

// ===== Appointment booking page =====
exports.getAppointmentPage = (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;
  res.render("patient/bookCon.ejs", { user });
};

// ===== Get confirmed appointments =====
exports.getBookedAppointments = catchAsync(async (req, res) => {
  const confirmedAppointments = await appointmentModel.find({
    patient: req.user,
    status: "Confirmed",
  }).populate("doctor").populate("patient");

  const userSockets = req.app.get("userSockets");

  const enrichedAppointments = confirmedAppointments.map(appt => {
    const plain = appt.toObject();
    plain.doctorSocket = appt.doctor
      ? userSockets[appt.doctor._id.toString()] || null
      : null;
    return plain;
  });

  
  res.json(enrichedAppointments);
});

// ===== Search doctors =====
exports.searchDoctors = catchAsync(async (req, res) => {
  const q = req.query.query || "";
  const mode = req.query.mode; // "online" or "offline"

  // Base query for search
  const query = {
    isVerified: true,
    $or: [
      { name: { $regex: q, $options: "i" } },
      { specialty: { $regex: q, $options: "i" } },
      { "location.clinicName": { $regex: q, $options: "i" } },
    ],
  };

  // Filter by consultationType if mode is selected
  if (mode) {
    if (mode === "online") {
      query.consultationType = { $in: ["Online", "Both"] };
    } else if (mode === "offline") {
      query.consultationType = { $in: ["Offline", "Both"] };
    }
  }

  const doctors = await doctorModel.find(query);
  res.json(doctors);
});


// ===== Request appointment =====
exports.requestAppointment = catchAsync(async (req, res) => {
  const { doctorId, date, time, reason, appointmenttype } = req.body;

  // Find doctor
  const doctorDoc = await doctorModel.findById(doctorId);
  if (!doctorDoc) return res.status(400).json({ error: "Doctor not found" });

  // Create appointment
  const appointment = await appointmentModel.create({
    patient: req.user._id,
    doctor: doctorDoc._id,
    appointmentDate: date,
    timeSlot: time,
    reason,
    appointmenttype: appointmenttype || "Offline", // default
    status: "Pending",
  });

  await appointment.populate("patient", "name");

  // Emit socket notification
  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const doctorSocket = userSockets[doctorDoc._id.toString()];

  if (doctorSocket) {
    io.to(doctorSocket).emit("newAppointment", {
      id: appointment._id,
      patientName: appointment.patient.name,
      date: appointment.appointmentDate,
      time: appointment.timeSlot,
      reason: appointment.reason,
      status: appointment.status,
      consultationtype: appointment.appointmenttype
    });
  }

  res.status(201).json(appointment);
});

// ===== Update profile =====

// Use the profileUpload instance and call .single():
exports.uploadPatientPic = upload.profileUpload.single("profilePic");


exports.updateProfile = catchAsync(async (req, res) => {
  var updatedPat = req.body;
  
  if (!updatedPat._id) {
    return res.status(400).json({ message: "Patient ID is required" });
  }
updatedPat = convertDotKeysToNested(updatedPat);
  const allowedFields = [
    "name",
    "email",
    "phone",
    "gender",
    "dob",
    "bloodGroup",
    "medicalHistory",
    "allergies",
    "currentMedications",
    "emergencyContact.name",
    "emergencyContact.phone",
    "emergencyContact.relation",
    "address.street",
    "address.city",
    "address.state",
    "address.pincode",
  ];

  const updateData = {};
  allowedFields.forEach((key) => {
    const keys = key.split(".");
    let temp = updatedPat;
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

  // Handle uploaded profile pic
  if (req.file && req.file.path) {
    updateData.img = req.file.path; // Cloudinary URL
  }
  
  // Fetch existing patient
  const existingPatient = await patientModel.findById(updatedPat._id);

  // Generate PID only if it doesn't exist in DB
  if (!existingPatient.PID && updateData.name && updateData.phone && updateData.dob) {
    updateData.PID = generatePatientId(updateData.name, updateData.phone, updateData.dob);
  }

  const patient = await patientModel.findByIdAndUpdate(
    updatedPat._id,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  res.json({ message: "Patient profile updated", patient });
});

exports.downloadAppointmentPDF = catchAsync(async (req, res) => {
  const { id } = req.params;
  const appointment = await appointmentModel
    .findById(id)
    .populate("patient")
    .populate("doctor")
    .lean();

  if (!appointment) return res.status(404).send("Appointment not found");

  const patient = appointment.patient;
  const doctor = appointment.doctor;

  // Create a new PDF document
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  res.setHeader("Content-Disposition", `attachment; filename=appointment-${id}.pdf`);
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  // Optional background image placeholder (leave space at top)
// ====== Background Logo (centered, small, low opacity) ======
const bgPath = path.join(__dirname, "../public/images/pdfBg.jpeg");

try {
  doc.save();
  doc.opacity(0.06); // very light
  const image = doc.openImage(bgPath);

  // Keep logo proportional and small (~250px wide)
  const maxWidth = 400;
  const maxHeight = 400;
  let imgWidth = image.width;
  let imgHeight = image.height;

  const widthRatio = maxWidth / imgWidth;
  const heightRatio = maxHeight / imgHeight;
  const scale = Math.min(widthRatio, heightRatio, 1);

  imgWidth *= scale;
  imgHeight *= scale;

  const x = (doc.page.width - imgWidth) / 2;
  const y = (doc.page.height - imgHeight) / 2;

  doc.image(bgPath, x, y, { width: imgWidth, height: imgHeight });
  doc.restore();
} catch (err) {
  console.error("PDF background image error:", err);
}

// ====== SwasthBridge Title ======
const pageWidth = doc.page.width;
const fontSize = 26;
doc.fontSize(fontSize).font("Helvetica-Bold");

const swasth = "Swasth";
const bridge = "Bridge";

const swasthWidth = doc.widthOfString(swasth);
const bridgeWidth = doc.widthOfString(bridge);
const totalWidth = swasthWidth + bridgeWidth;
const startX = (pageWidth - totalWidth) / 2;

// Draw "Swasth" and "Bridge" centered with colors
doc.fillColor("#28a745").text(swasth, startX, doc.y, { continued: true });
doc.fillColor("#0d6efd").text(bridge, { continued: false });

// Reset position to full width centered before next line
doc.moveDown(0.3);
doc.x = 40; // reset X to left margin
doc.fillColor("#000").fontSize(12).font("Helvetica")
   .text("Connecting Health & Care", { align: "center" });

// Divider line
doc.moveDown(1);
doc.lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();

doc.moveDown(1);




  // Header section
 
  // Appointment summary title
  doc
    .fontSize(16)
    .fillColor("#0d47a1")
    .font("Helvetica-Bold")
    .text("Appointment Summary", { align: "center" });
  doc.moveDown(1);

  // Info box border
  const startY = doc.y;

  doc
    .rect(40, startY, 515, 650) // Outer border box
    .stroke("#90a4ae");

  const leftX = 50;
  const rightX = 300;
  let y = startY + 15;

  doc.fontSize(12).fillColor("#000").font("Helvetica");

  // Left column
  doc.text(`Patient Name: ${patient.name || "N/A"}`, leftX, y);
  doc.text(`Patient ID (PID): ${patient.PID || "N/A"}`, leftX, y + 20);
  doc.text(`Appointment Type: ${appointment.appointmenttype || "N/A"}`, leftX, y + 40);
  doc.text(`Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}`, leftX, y + 60);
  doc.text(`Time Slot: ${appointment.timeSlot || "N/A"}`, leftX, y + 80);

  // Right column
  doc.text(`Doctor: ${doctor?.name || "N/A"}`, rightX, y);
  doc.text(`Specialty: ${doctor?.specialty || "N/A"}`, rightX, y + 20);
  doc.text(`Status: ${appointment.status}`, rightX, y + 40);
  doc.text(`Reason: ${appointment.reason || "N/A"}`, rightX, y + 60);

  y += 110;

  // Diagnosis section
  doc
    .font("Helvetica-Bold")
    .fillColor("#0d47a1")
    .text("Diagnosis", leftX, y);
  doc
    .font("Helvetica")
    .fillColor("#000")
    .text(appointment.diagnosis || "No diagnosis recorded", leftX, y + 20, {
      width: 480,
    });

  y = doc.y + 20;

  // Prescription section
  doc
    .font("Helvetica-Bold")
    .fillColor("#0d47a1")
    .text("Prescription", leftX, y);
  doc
    .font("Helvetica")
    .fillColor("#000")
    .text(appointment.prescription || "No prescription available", leftX, y + 20, {
      width: 480,
    });

  // Footer


const footerY = doc.page.height - 80; // Position near bottom (adjust 80 if needed)
doc
  .fontSize(10)
  .fillColor("gray")
  .text("This is a system-generated appointment summary.", 0, footerY, {
    align: "center",
  });
doc.text(`© 2025 SB | Confidential Medical Record`||"Online Consulation | Confidential Medical Record", {
  align: "center",
});
  // Finalize PDF
  doc.end();
});



exports.getCompletedAppointments = catchAsync(async (req, res) => {
  const patientId = req.user._id; // assuming you're using auth middleware
  
  
  const appointments = await appointmentModel
    .find({ patient: patientId, status: "Completed" })
    .populate("patient")
    .lean();

  // Transform to minimal data for frontend
  const reports = appointments.map(app => ({
    
    _id: app._id,
    title: "Appointment Summary",
    date: app.createdAt,
    fileUrl: `/pat/download/${app._id}`, // route to download PDF
    payment: {
      amount: app.payment?.amount || 0,
      paid: app.payment?.paid || false,
      verified: app.payment?.verified || false,
      screenshot: app.payment?.screenshot || null
    }
  
  }));

  
  res.json(reports);
});



exports.getTopDoctors = catchAsync(async (req, res) => {
  const topDoctorsData = await appointmentModel.aggregate([
    { $match: { status: { $ne: "Cancelled" } } }, 
    { $group: { _id: { doctor: "$doctor", patient: "$patient" }, visitCount: { $sum: 1 } } },
    { $group: {
        _id: "$_id.doctor",
        totalAppointments: { $sum: "$visitCount" },
        repeatedPatients: { $sum: { $cond: [{ $gt: ["$visitCount", 1] }, 1, 0] } },
        uniquePatients: { $sum: 1 }
    }},
    { $sort: { repeatedPatients: -1, totalAppointments: -1 } },
    { $limit: 6 }
  ]);

  const doctorIds = topDoctorsData.map(d => d._id);

  // Fetch doctor details with consistent 'img' property
  const doctors = await doctorModel.find({ _id: { $in: doctorIds }, isVerified: true })
                                   .select("name specialty consultationType photo gender phone email location img isVerified");

  const formattedDoctors = doctors.map(doc => {
    const data = topDoctorsData.find(d => d._id.toString() === doc._id.toString());
   
    
    return {
      _id: doc._id,
      name: doc.name,
      specialty: doc.specialty,
      img: doc.img || "https://via.placeholder.com/80", // consistent 'img'
      profile: `/doc/${doc._id}`,
      gender: doc.gender || "",
      phone: doc.phone || "",
      email: doc.email || "",
      location: doc.location || {},
      consultationType: doc.consultationType || "",
      isVerified: doc.isVerified,
      repeatedPatients: data?.repeatedPatients || 0,
      totalAppointments: data?.totalAppointments || 0,
      uniquePatients: data?.uniquePatients || 0
    };
  });

  // Optional: sort final array again
  formattedDoctors.sort((a, b) => b.repeatedPatients - a.repeatedPatients || b.totalAppointments - a.totalAppointments);

  res.json(formattedDoctors);
});




// Render Payment Page with QR
exports.renderPaymentPage = catchAsync(async (req, res) => {
  const appointmentId = req.params.id;
const user = req.user.toObject ? req.user.toObject() : { ...req.user };
  user.role = req.session.passport?.user?.role || user.role;
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return res.status(400).send("Invalid appointment ID");
  }

  const appointment = await appointmentModel.findById(appointmentId)
    .populate("doctor") // doctor should have upiId
    .lean();

  if (!appointment) {
    return res.status(404).send("Appointment not found");
  }

  let qrCodeUrl = null;
  if (appointment.doctor?.upiId) {//appointment.doctor?.upiId,appointment.doctor.upiId,appointment.doctor.name,appointment.payment.amount
    const upiString = `upi://pay?pa=${appointment.doctor.upiId}&pn=${appointment.doctor.name}&am=${appointment.payment.amount}&cu=INR`;
    qrCodeUrl = await QRCode.toDataURL(upiString);
  }

  res.render("patient/payment.ejs", {
    appointment,
    qrCodeUrl,
    user // pass QR code URL to EJS
  });
});
exports.uploadPaymentScreenshot = upload.screenshotUpload.single("screenshot");

// Mark payment done
exports.markPaymentPaid = catchAsync(async (req, res) => {
  const appointmentId = req.params.id;
  const appointment = await appointmentModel.findById(appointmentId).populate("patient").populate("doctor");
  console.log(appointment);
  
  if (!appointment) return res.status(404).json({ message: "Appointment not found" });

  // Mark payment as done
  appointment.payment.paid = true;
  appointment.payment.paidAt = new Date();
  appointment.payment.transactionId = req.body.transactionId || "UPI/Manual";

  // Save screenshot path if uploaded
  
    if (req.file && req.file.path) {
  // Store path relative to public folder
  appointment.payment.screenshot = req.file.path;
}
 
  

  await appointment.save();
 const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  const doctorSocket = appointment.doctor ? userSockets[appointment.doctor._id.toString()] : null;

  console.log("Sending paymentCompleted to doctor:", appointment.doctor?.name);

  if (doctorSocket) {
    io.to(doctorSocket).emit("paymentCompleted", {
      patientName: appointment.patient?.name || "Unknown Patient",
      date: appointment.appointmentDate,
      time: appointment.timeSlot,
      reason: appointment.reason || "",
      appointmentId: appointment._id,
    });
  } else {
    console.log("Doctor socket not found for:", appointment.doctor?._id);
  }
  

  res.status(200).json({ message: "Payment marked as paid" });
});

 
