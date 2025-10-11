const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    expiryDate: Date,

    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Medicine", medicineSchema);
