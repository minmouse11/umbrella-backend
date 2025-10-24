// backend/src/config/db.js

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || !/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error("❌ 유효하지 않은 MONGO_URI:", uri);
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      dbName: "usanShare", // 필요 시 명시적으로 DB 이름 고정
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB 연결 성공");
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
