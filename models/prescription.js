const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },

    medicines: [
      {
        medicineName: String,   // what doctor prescribed
        dosage: String,         // "500mg"
        frequency: String,      // "2 times a day"
        duration: String,       // "5 days"
        instructions: String    // "after food"
      }
    ],

    notes: String,  // additional doctor notes
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
