// backend/server.js
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "sentibot_secret_key",
  resave: false,
  saveUninitialized: true
}));

// Serve static files (e.g., CSS, JS)
app.use("/static", express.static(path.join(__dirname, "../static")));

// Set templates directory and HTML rendering engine
app.set("views", path.join(__dirname, "../templates"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// Dummy user credentials
const USER = { username: "admin", password: "1234" };

// Routes

// Redirect root to login
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Login form
app.get("/login", (req, res) => {
  res.render("login.html"); // located at templates/login.html
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    req.session.loggedIn = true;
    res.redirect("/index");
  } else {
    res.send("<script>alert('Invalid credentials'); window.location='/login';</script>");
  }
});

// Protected index page
app.get("/index", (req, res) => {
  if (req.session.loggedIn) {
    res.render("index.html"); // located at templates/index.html
  } else {
    res.redirect("/login");
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sentibot server running at http://localhost:${PORT}`);
});
