const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },

    appointmentDate: { type: Date, required: true },
    appointmenttype: { type:String, enum:["Offline","Online"] },
    timeSlot: String,
    diagnosis: String,         
    prescription: String,   
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled", "Completed","Postponed"],
      default: "Pending"
    },
    reason: String,

    // ===== Payment info =====
  payment: {
  amount: { type: Number, default: 0 },
  paid: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  paidAt: Date,
  verifiedAt: Date,
  transactionId: String,
  screenshot: String
}

},
 
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
