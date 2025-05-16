const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// File paths
const usersFile = path.join(__dirname, "users.json");
const moodsFile = path.join(__dirname, "moods.json");

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "sentibot-secret-key",
  resave: false,
  saveUninitialized: true
}));

// Serve static files
app.use("/static", express.static(path.join(__dirname, "../static")));

// Serve login page
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../templates/login.html"));
});

// Protect main page route
app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "../templates/index.html"));
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  let users = JSON.parse(fs.readFileSync(usersFile, "utf8"));
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = user;
    res.json({ success: true, redirect: "/" });  // <-- add redirect key here
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Save mood (chat)
app.post("/chat", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const { message } = req.body;
  const username = req.session.user.username;
  const mood = extractMoodFromMessage(message);

  let moodLogs = JSON.parse(fs.readFileSync(moodsFile, "utf8"));
  if (!moodLogs[username]) moodLogs[username] = [];

  const timestamp = new Date().toLocaleString();
  moodLogs[username].push({ timestamp, mood, message });

  fs.writeFileSync(moodsFile, JSON.stringify(moodLogs, null, 2));
  res.json({ reply: `Got it! I’ve logged your mood as: ${mood}` });
});

// Get mood history
app.get("/history", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const username = req.session.user.username;
  const moodLogs = JSON.parse(fs.readFileSync(moodsFile, "utf8"));

  res.json(moodLogs[username] || []);
});

// Clear mood history
app.post("/clear", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Not logged in" });

  const username = req.session.user.username;
  const moodLogs = JSON.parse(fs.readFileSync(moodsFile, "utf8"));

  moodLogs[username] = [];
  fs.writeFileSync(moodsFile, JSON.stringify(moodLogs, null, 2));
  res.json({ success: true });
});

// Fake mood extraction logic
function extractMoodFromMessage(message) {
  const moodMap = {
    "excited": "Excited 🤩",
    "happy": "Happy 😊",
    "relaxed": "Relaxed 😎",
    "neutral": "Neutral 😐",
    "sad": "Sad 😢",
    "anxious": "Anxious 😨",
    "angry": "Angry 😠"
  };
  message = message.toLowerCase();
  return Object.keys(moodMap).find(m => message.includes(m)) ? moodMap[Object.keys(moodMap).find(m => message.includes(m))] : "Neutral 😐";
}

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});