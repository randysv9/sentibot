from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
import os
from datetime import datetime
import random
from collections import defaultdict

app = Flask(__name__)
app.secret_key = "super_secret_key"  # 🔒 Replace with a secure random key in production!

# ✅ Load users from backend/user.json
def load_users():
    path = os.path.join("backend", "user.json")
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return []  # 🔁 Prevent crash if file doesn't exist

@app.route("/")
def home():
    if "user" in session:
        return render_template("index.html", username=session["user"])
    return render_template("login.html")

# ✅ Initialize VADER Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

@app.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"success": False, "message": "Invalid content type"}), 400

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    users = load_users()
    for user in users:
        if user.get("username") == username and user.get("password") == password:
            session["user"] = username
            return jsonify({"success": True})

    return jsonify({"success": False, "message": "Invalid username or password"}), 401

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out."})

# ✅ Detect mood using VADER
def analyze_mood(text):
    sentiment = analyzer.polarity_scores(text)
    compound_score = sentiment['compound']

    if compound_score >= 0.6:
        return "Excited 🤩"
    elif compound_score >= 0.3:
        return "Happy 😊"
    elif 0.1 <= compound_score < 0.3:
        return "Relaxed 😎"
    elif -0.2 < compound_score < 0.2:
        return "Neutral 😐"
    elif compound_score <= -0.5:
        return "Angry 😠"
    elif compound_score <= -0.3:
        return "Anxious 😨"
    else:
        return "Sad 😢"

# ✅ Context detection
def detect_context(message):
    work_keywords = ["job", "work", "deadline", "office", "boss"]
    school_keywords = ["school", "exam", "teacher", "homework", "project"]
    life_keywords = ["family", "friends", "relationship", "health", "life"]

    message = message.lower()
    if any(word in message for word in work_keywords):
        return "work"
    elif any(word in message for word in school_keywords):
        return "school"
    elif any(word in message for word in life_keywords):
        return "life"
    return "general"

# ✅ Motivational quotes
quotes = {
    "Sad 😢": [
        "“This too shall pass.”",
        "“You are stronger than you think.”",
        "“Every storm runs out of rain.”"
    ],
    "Angry 😠": [
        "“Holding onto anger is like drinking poison.”",
        "“Breathe. Relax. You got this.”"
    ],
    "Anxious 😨": [
        "“Inhale peace, exhale stress.”",
        "“One step at a time.”"
    ]
}

# ✅ Follow-ups
follow_ups = {
    "Sad 😢": [
        "Would you like to talk more about it?",
        "What’s been on your mind lately?",
        "Is there something that triggered this sadness?"
    ],
    "Angry 😠": [
        "Do you want to vent about it?",
        "What made you feel this way?",
        "Sometimes writing it out helps. What's going on?"
    ],
    "Anxious 😨": [
        "Would it help to talk through it?",
        "Is there a specific worry on your mind?",
        "Let's try to break it down together."
    ]
}

@app.route("/chat", methods=["POST"])
def chat():
    if not request.is_json:
        return jsonify({"error": "Invalid content type"}), 400

    user_message = request.json.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # Init history
    if "history" not in session:
        session["history"] = []

    session["history"].append(user_message)
    session["history"] = session["history"][-5:]  # Keep only last 5

    sentiment = analyzer.polarity_scores(user_message)
    mood = analyze_mood(user_message)
    context = detect_context(user_message)

    # Generate reply
    if context == "work":
        reply = "Work can be demanding. Is it something your job or tasks are causing?"
    elif context == "school":
        reply = "School pressures can pile up quickly. Want to talk about what’s stressing you?"
    elif context == "life":
        reply = "Life can feel overwhelming. I'm here to listen. Want to share more?"
    else:
        reply = "I hear you. I'm here for you!"

    # Add reference to earlier message
    if len(session["history"]) > 1:
        reply += f" Earlier you said: “{session['history'][-2]}” — I’m here to help with that too."

    # Add follow-up
    if mood in follow_ups:
        reply += " " + random.choice(follow_ups[mood])

    # Add quote
    if mood in quotes:
        reply += " Here's something to lift you up: " + random.choice(quotes[mood])

    # Save mood history
    save_mood(mood, user_message)

    return jsonify({
        "reply": reply,
        "mood": mood,
        "sentiment": sentiment,
        "memory": session["history"]
    })

# ✅ Save mood data
def save_mood(mood, user_message):
    history = []
    path = "mood_history.json"

    if os.path.exists(path):
        with open(path, "r") as f:
            try:
                history = json.load(f)
            except json.JSONDecodeError:
                history = []

    history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mood": mood,
        "message": user_message
    })

    with open(path, "w") as f:
        json.dump(history[-10:], f, indent=2)

# ✅ Get mood history
@app.route("/history")
def history():
    if os.path.exists("mood_history.json"):
        with open("mood_history.json", "r") as f:
            try:
                return jsonify(json.load(f))
            except json.JSONDecodeError:
                return jsonify([])
    return jsonify([])

@app.route("/clear-history", methods=["POST"])
def clear_history():
    path = "mood_history.json"
    if os.path.exists(path):
        os.remove(path)
    return jsonify({"status": "cleared"})

@app.route("/clear-session", methods=["POST"])
def clear_session():
    session.pop("history", None)
    return jsonify({"status": "session cleared"})

# ✅ Mood Summary
@app.route("/summary")
def daily_summary():
    if not os.path.exists("mood_history.json"):
        return jsonify({})

    with open("mood_history.json", "r") as f:
        try:
            history = json.load(f)
        except json.JSONDecodeError:
            return jsonify({})

    summary = defaultdict(lambda: defaultdict(int))

    for entry in history:
        date_str = entry["timestamp"].split(" ")[0]
        mood = entry["mood"]
        summary[date_str][mood] += 1

    return jsonify(summary)

# ✅ App runner
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
