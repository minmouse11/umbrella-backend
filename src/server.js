const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

// ====== 라우터 ======
const usersRouter = require("./routes/user");
const umbrellaRouter = require("./routes/umbrella"); // ✅ 우산 기능 포함

// ====== ENV 설정 ======
const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = (process.env.MONGO_URI || "").trim();
const ALLOW = (process.env.FRONT_ORIGIN || "http://localhost:3000,http://localhost:3001,http://localhost:5173")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

if (!/^mongodb(\+srv)?:\/\//.test(MONGO_URI)) {
  console.error("❌ MONGO_URI 설정 오류:", JSON.stringify(MONGO_URI));
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "2mb" }));

// ====== CORS (항상 라우터보다 위에 있어야 함!) ======
app.use(cors({
  origin(origin, cb) {
    if (!origin || ALLOW.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS 차단: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 프리플라이트 OPTIONS 요청 처리
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    return res.sendStatus(204);
  }
  next();
});

// ====== 바디 파서 ======


// ====== MongoDB 연결 ======
mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI, { dbName: "usanShare" })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch(err => {
    console.error("❌ MongoDB 연결 실패:", err.message);
    process.exit(1);
  });

// ====== ROUTES 등록 ======
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/users", usersRouter);
app.use("/api/umbrella", umbrellaRouter); // ✅ 반드시 여기 위치!

// ====== 디버그용 ======
const User = require("./models/User");

app.get("/api/debug/db", async (_req, res) => {
  try {
    const conn = mongoose.connection;
    const dbName = conn.db.databaseName;
    const colls = await conn.db.listCollections().toArray();
    const counts = {};
    for (const c of colls) {
      counts[c.name] = await conn.db.collection(c.name).countDocuments();
    }
    res.json({
      ok: true,
      dbName,
      counts,
      host: (process.env.MONGO_URI || "").split("@")[1]?.split("/")[0] || "unknown",
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.get("/api/debug/users/count", async (_req, res) => {
  try {
    const n = await User.countDocuments();
    const sample = await User.find({}, "studentId name department phone createdAt")
      .sort({ _id: -1 })
      .limit(5);
    res.json({ ok: true, count: n, sample });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

// ====== 서버 실행 ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔗 Allow Origins: ${ALLOW.join(", ")}`);
});
