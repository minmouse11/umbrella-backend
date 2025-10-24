// backend/src/routes/umbrella.js
const express = require("express");
const router = express.Router();

const UmbrellaSlot = require("../models/UmbrellaSlot");
const UmbrellaLog = require("../models/UmbrellaLog");

// ───────────────────────────────────────────────────────────────
// 아두이노 없이 동작하도록 수정된 라우터
// ───────────────────────────────────────────────────────────────

// 1) 슬롯 목록
router.get("/slots", async (_req, res) => {
  try {
    const slots = await UmbrellaSlot.find({}).sort({ slotNumber: 1 });
    res.json(slots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "슬롯 조회 실패" });
  }
});

// 2) 대여
router.post("/rent", async (req, res) => {
  try {
    const { slotNumber, studentId } = req.body || {};
    if (slotNumber == null || !studentId) {
      return res.status(400).json({ message: "slotNumber와 studentId가 필요합니다." });
    }

    const slot = await UmbrellaSlot.findOne({ slotNumber });
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: "이미 대여되었거나 존재하지 않는 슬롯입니다." });
    }

    slot.isAvailable = false;
    await slot.save();
    await UmbrellaLog.create({ studentId, slotNumber, action: "rent" });

    console.log(`[Simulated Command] 슬롯 ${slotNumber} 대여됨 (LED ON 생략)`);

    res.json({ ok: true, message: `슬롯 ${slotNumber} 대여 완료.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "대여 실패" });
  }
});

// 3) 반납
router.post("/return", async (req, res) => {
  try {
    const { slotNumber, studentId } = req.body || {};
    if (slotNumber == null || !studentId) {
      return res.status(400).json({ message: "slotNumber와 studentId가 필요합니다." });
    }

    const slot = await UmbrellaSlot.findOne({ slotNumber });
    if (!slot) return res.status(404).json({ message: "슬롯을 찾을 수 없습니다." });

    if (slot.isAvailable) {
      return res.status(400).json({ message: "이미 반납된 슬롯입니다." });
    }

    slot.isAvailable = true;
    await slot.save();

    const lastRent = await UmbrellaLog.findOne({ slotNumber, action: "rent", studentId })
      .sort({ createdAt: -1 });

    if (lastRent) {
      const alreadyReturned = await UmbrellaLog.findOne({
        slotNumber,
        action: "return",
        studentId,
        createdAt: { $gt: lastRent.createdAt },
      });
      if (alreadyReturned) {
        return res.status(400).json({ message: "이미 반납 처리된 대여입니다." });
      }
    }

    await UmbrellaLog.create({ studentId, slotNumber, action: "return" });

    console.log(`[Simulated Command] 슬롯 ${slotNumber} 반납됨 (LED OFF 생략)`);

    return res.json({ ok: true, message: `슬롯 ${slotNumber} 반납 완료.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "반납 처리 실패" });
  }
});

// 4) 특정 학생 로그
router.get("/logs/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const logs = await UmbrellaLog.find({ studentId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "로그 조회 실패" });
  }
});

module.exports = router;
