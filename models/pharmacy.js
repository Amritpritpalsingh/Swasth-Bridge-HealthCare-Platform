const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const pharmacySchema = new mongoose.Schema(
  {
    ownerName: { type: String, required: true },
    storeName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },

    licenseNumber: { type: String, required: true, unique: true },
    licenseVerified: { type: Boolean, default: false },

    address: {
      street: String,
      city: String,
      state: String,
      pincode: String
    },

    medicines: [
      {
        name: String,
        brand: String,
        price: Number,
        stock: Number,
        expiryDate: Date
      }
    ]
  },
  { timestamps: true }
);
// hash password before saving


// method to compare password
pharmacySchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};
module.exports = mongoose.model("Pharmacy", pharmacySchema);
