const mongoose = require("mongoose");

const umbrellaLogSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    slotNumber: { type: Number, required: true },
    action: { type: String, enum: ["rent", "return"], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UmbrellaLog", umbrellaLogSchema);