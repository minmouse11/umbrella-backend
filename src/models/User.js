const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    studentId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String },
    name: { type: String },
    phone: { type: String }
});

// 비밀번호 암호화 저장
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);