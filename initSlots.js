// scripts/initSlots.js

require("dotenv").config(); // .env 환경변수 로딩
const connectDB = require("../backend/src/config/db.js"); // DB 연결 함수
const UmbrellaSlot = require("../backend/src/models/UmbrellaSlot"); // 모델

const initSlots = async () => {
  try {
    await connectDB(); // MongoDB 연결
    console.log("✅ DB 연결 완료");

    for (let i = 1; i <= 8; i++) {
      const exist = await UmbrellaSlot.findOne({ slotNumber: i });
      if (!exist) {
        await UmbrellaSlot.create({ slotNumber: i, isAvailable: true });
        console.log(`➕ 슬롯 ${i} 생성 완료`);
      } else {
        console.log(`✅ 슬롯 ${i} 이미 존재`);
      }
    }

    console.log("🎉 초기 슬롯 생성 완료");
  } catch (err) {
    console.error("❌ 슬롯 초기화 실패:", err.message);
  } finally {
    process.exit(); // 실행 종료
  }
};

initSlots();
