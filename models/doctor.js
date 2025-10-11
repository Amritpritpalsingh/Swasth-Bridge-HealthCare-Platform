const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const doctorSchema = new mongoose.Schema(
  {
    // 🔹 Basic Info
    name: { type: String,},
    email: { type: String, required: true, unique: true },
    password: { type: String, }, // hash later
    phone: { type: String},
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dob: { type: Date },

    // 🔹 Professional Details
    specialty: { type: String},
    qualifications: [String], // e.g., ["MBBS", "MD (Cardiology)"]
    experience: { type: Number, min: 0 }, // years of experience
    bio: String,

    // 🔹 Verification / Compliance
    registrationNumber: { type: String,  }, // Medical council ID
    councilName: String,   // e.g., "Medical Council of India"
    registrationYear: Number,
    documents: [
      {
        type: { type: String }, // "degree", "license", "id-proof"
        url: String,            // file storage link
        verified: { type: Boolean, default: false }
      }
    ],

    isVerified: { type: Boolean, default: false }, // ✅ Admin toggles after checking documents
    verificationDate: Date,
    consultationType: {
      type: String,
      enum: ["Online", "Offline", "Both"]
     
    },
    upiId: { type: String},
    // 🔹 Practice Information
    availability: [
      {
        day: { type: String },  // e.g., "Monday"
        from: String,           // "10:00"
        to: String              // "16:00"
      }
    ],
    consultationFee: { type: Number, default: 0 },    
    location: {
      clinicName: String,
      address: String,
      city: String,
      state: String,
      pincode: String
    },
      img: {
      type: String,
      default: "", // fallback image
    },
    // 🔹 System Info
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// method to compare password
doctorSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
module.exports = mongoose.model("Doctor", doctorSchema);
 