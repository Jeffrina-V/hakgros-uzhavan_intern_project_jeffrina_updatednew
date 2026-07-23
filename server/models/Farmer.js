const mongoose = require("mongoose");

const FarmerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  village: {
    type: String,
    required: true,
  },
  cropType: {
    type: String,
    required: true,
  },
  landSize: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Farmer", FarmerSchema);