const mongoose = require("mongoose");

const prescriptionRequestSchema = new mongoose.Schema(
  {
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: "Prescription", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Fulfilled"],
      default: "Pending"
    },

    responseNote: String,   // e.g. "Out of stock" or "Ready for pickup"
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrescriptionRequest", prescriptionRequestSchema);
