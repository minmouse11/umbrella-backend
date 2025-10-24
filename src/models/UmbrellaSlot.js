const mongoose = require("mongoose");

const umbrellaSlotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true, unique: true },
    isAvailable: { type: Boolean, default: true } // true: 빈 슬롯, false: 대여 중
});

module.exports = mongoose.model("UmbrellaSlot", umbrellaSlotSchema);