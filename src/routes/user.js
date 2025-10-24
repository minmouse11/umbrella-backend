const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 입력 정리
const norm = (v) => (typeof v === "string" ? v.trim() : v);

// 회원가입
router.post("/register", async (req, res) => {
  try {
    const studentId  = norm(req.body.studentId);
    const password   = norm(req.body.password);
    const department = norm(req.body.department);
    const name       = norm(req.body.name);
    const phone      = norm(req.body.phone);

    if (!studentId || !password) {
      return res.status(400).json({ message: "학번과 비밀번호는 필수입니다." });
    }
    if (password.length < 4) {
      return res.status(400).json({ message: "비밀번호는 4자 이상이어야 합니다." });
    }

    // 중복 체크
    const exist = await User.findOne({ studentId });
    if (exist) return res.status(409).json({ message: "이미 등록된 학번입니다." });

    const newUser = await User.create({ studentId, password, department, name, phone });

    const userData = {
      studentId: newUser.studentId,
      department: newUser.department,
      name: newUser.name,
      phone: newUser.phone,
    };
    return res.status(201).json({ message: "회원가입 완료", user: userData });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "이미 등록된 학번입니다." });
    }
    console.error("register error:", error);
    return res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  try {
    const studentId = norm(req.body.studentId);
    const password  = norm(req.body.password);

    if (!studentId || !password) {
      return res.status(400).json({ message: "학번과 비밀번호를 입력해주세요." });
    }

    // 모델에 comparePassword가 구현되어 있다면 +password로 불러오기
    const user = await User.findOne({ studentId }).select("+password");
    if (!user) return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });

    const userData = {
      studentId: user.studentId,
      department: user.department,
      name: user.name,
      phone: user.phone,
    };
    return res.status(200).json({ message: "로그인 성공", user: userData });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

// 회원 탈퇴
router.delete("/delete", async (req, res) => {
  try {
    const studentId = norm(req.body.studentId);
    if (!studentId) return res.status(400).json({ message: "학번을 입력해주세요." });

    const user = await User.findOne({ studentId });
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    await User.deleteOne({ studentId });
    return res.status(200).json({ message: `학번 ${studentId} 계정이 삭제되었습니다.` });
  } catch (error) {
    console.error("delete error:", error);
    return res.status(500).json({ message: "서버 오류", error: error.message });
  }
});

module.exports = router;
