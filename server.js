const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const DB_FILE = "./db.json";

/* =========================
   DATABASE
========================= */

function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* =========================
   ROOT ROUTE (FIX ERROR)
========================= */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "CroustyOpti SaaS API 🚀",
    routes: ["/create", "/verify", "/dashboard"],
    version: "1.0"
  });
});

/* =========================
   CREATE LICENSE
========================= */

function createLicense(email, plan) {
  let db = loadDB();

  const key = "LIC-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  let duration = null;

  if (plan === "1week") duration = 7;
  if (plan === "3months") duration = 90;
  if (plan === "lifetime") duration = null;

  db[key] = {
    email,
    plan,
    created: Date.now(),
    expires: duration ? Date.now() + duration * 24 * 60 * 60 * 1000 : null,
    active: true
  };

  saveDB(db);

  return key;
}

/* =========================
   CREATE (MANUAL / PAYPAL WEBHOOK READY)
========================= */

app.post("/create", (req, res) => {
  const { email, plan } = req.body;

  if (!email || !plan) {
    return res.status(400).json({ error: "Missing email or plan" });
  }

  const key = createLicense(email, plan);

  res.json({
    success: true,
    key
  });
});

/* =========================
   VERIFY LICENSE
========================= */

app.post("/verify", (req, res) => {
  const { key } = req.body;

  let db = loadDB();
  let license = db[key];

  if (!license) {
    return res.json({ valid: false, reason: "not_found" });
  }

  if (license.expires && Date.now() > license.expires) {
    return res.json({ valid: false, reason: "expired" });
  }

  res.json({
    valid: true,
    data: license
  });
});

/* =========================
   DASHBOARD
========================= */

app.post("/dashboard", (req, res) => {
  const { email } = req.body;

  let db = loadDB();

  let found = Object.entries(db).find(([key, value]) => value.email === email);

  if (!found) {
    return res.json({ found: false });
  }

  const [key, data] = found;

  res.json({
    found: true,
    key,
    data
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 CroustyOpti API running on port", PORT);
});
