const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();


// Initialize SQLite database

const db = new sqlite3.Database(path.join(__dirname, "users.db"), (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Moved this OUTSIDE the db init callback
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

  db.run(
    `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
    ["admin", "admin123"],
    (err) => {
      if (err) {
        console.error("Error inserting sample user:", err.message);
      } else {
        console.log("Sample user checked/added.");
      }
    }
  );
});





// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "sentibot-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

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

// Login route using SQLite
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        console.error("Database error:", err);
        return res.json({ success: false, message: "Database error." });
      }

      if (row) {
        req.session.user = { id: row.id, username: row.username };
        res.json({ success: true, redirect: "/" });
      } else {
        res.json({ success: false, message: "Invalid credentials." });
      }
    }
  );
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Fake mood extraction logic (keep as-is)
function extractMoodFromMessage(message) {
  const moodMap = {
    excited: "Excited 🤩",
    happy: "Happy 😊",
    relaxed: "Relaxed 😎",
    neutral: "Neutral 😐",
    sad: "Sad 😢",
    anxious: "Anxious 😨",
    angry: "Angry 😠",
  };
  message = message.toLowerCase();
  return Object.keys(moodMap).find((m) => message.includes(m))
    ? moodMap[Object.keys(moodMap).find((m) => message.includes(m))]
    : "Neutral 😐";
}

// The rest of your code (moods logging) still uses JSON files, update later if needed

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
