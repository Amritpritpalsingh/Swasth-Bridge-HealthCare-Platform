const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const patientSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    password: { type: String },
    phone: { type: String },
    PID: { type: String, unique: true, sparse: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dob: Date,

    bloodGroup: { 
      type: String, 
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] 
    },
    medicalHistory: [String],   // past illnesses
    allergies: [String],
    currentMedications: [String],

    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },
     img: { type: String, default: "" }
  },
  { timestamps: true }
);

function generatePatientId(name, phone, dob) {
  const input = `${phone}-${name}-${dob}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const base36 = parseInt(hash.substring(0, 10), 16).toString(36).toUpperCase();
  return base36.substring(0, 6);
}
patientSchema.pre("save", function (next) {
  // Only generate PID if it's missing AND phone+dob are present
  if (this.isNew &&!this.PID && this.phone && this.dob) {
    this.PID = generatePatientId(this.name, this.phone, this.dob);
  }
  next();
});

// method to compare password
patientSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Patient", patientSchema);
 