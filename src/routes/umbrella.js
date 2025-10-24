// backend/src/routes/umbrella.js
const express = require("express");
const router = express.Router();

const UmbrellaSlot = require("../models/UmbrellaSlot");
const UmbrellaLog = require("../models/UmbrellaLog");

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

// 2) 대여 요청
router.post("/rent", async (req, res) => {
  const rawBody = req.body || {};
  const slotNumber = Number(rawBody.slotNumber);
  const studentId = String(rawBody.studentId).trim();

  console.log("[렌탈 요청 수신]", rawBody, "→", { slotNumber, studentId });

  try {
    if (!studentId || isNaN(slotNumber)) {
      return res.status(400).json({ message: "유효하지 않은 slotNumber 또는 studentId입니다." });
    }

    const slot = await UmbrellaSlot.findOne({ slotNumber });
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: "대여 불가능한 슬롯입니다." });
    }

    slot.isAvailable = false;
    await slot.save();
    await UmbrellaLog.create({ slotNumber, studentId, action: "rent" });

    res.json({ ok: true, message: `${slotNumber}번 슬롯 대여 완료` });
  } catch (err) {
    console.error("대여 처리 중 오류:", err);
    res.status(500).json({ message: "대여 실패" });
  }
});

// 3) 반납 요청
router.post("/return", async (req, res) => {
  const rawBody = req.body || {};
  const slotNumber = Number(rawBody.slotNumber);
  const studentId = String(rawBody.studentId).trim();

  console.log("[반납 요청 수신]", rawBody, "→", { slotNumber, studentId });

  try {
    if (!studentId || isNaN(slotNumber)) {
      return res.status(400).json({ message: "유효하지 않은 slotNumber 또는 studentId입니다." });
    }

    const slot = await UmbrellaSlot.findOne({ slotNumber });
    if (!slot) return res.status(404).json({ message: "해당 슬롯이 없습니다." });

    if (slot.isAvailable) {
      return res.status(400).json({ message: "이미 반납된 슬롯입니다." });
    }

    slot.isAvailable = true;
    await slot.save();

    const lastRent = await UmbrellaLog.findOne({ slotNumber, studentId, action: "rent" })
      .sort({ createdAt: -1 });

    if (lastRent) {
      const alreadyReturned = await UmbrellaLog.findOne({
        slotNumber,
        studentId,
        action: "return",
        createdAt: { $gt: lastRent.createdAt },
      });
      if (alreadyReturned) {
        return res.status(400).json({ message: "이미 반납 처리된 대여입니다." });
      }
    }

    await UmbrellaLog.create({ slotNumber, studentId, action: "return" });

    res.json({ ok: true, message: `${slotNumber}번 슬롯 반납 완료` });
  } catch (err) {
    console.error("반납 처리 중 오류:", err);
    res.status(500).json({ message: "반납 실패" });
  }
});

// 4) 사용자 로그 조회
router.get("/logs/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    const logs = await UmbrellaLog.find({ studentId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("로그 조회 실패:", err);
    res.status(500).json({ message: "로그 조회 실패" });
  }
});

module.exports = router;
