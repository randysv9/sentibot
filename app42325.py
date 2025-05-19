from flask import Flask, render_template, request, jsonify, session
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
import os
from datetime import datetime
import random

app = Flask(__name__)
app.secret_key = "super_secret_key"  # Use a strong, secret value in production!

# Initialize VADER Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

@app.route("/")
def home():
    return render_template("index.html")

# Detect mood using VADER
def analyze_mood(text):
    sentiment = analyzer.polarity_scores(text)
    compound_score = sentiment['compound']

    if compound_score >= 0.6:
        mood = "Excited 🤩"
    elif compound_score >= 0.3:
        mood = "Happy 😊"
    elif 0.1 <= compound_score < 0.3:
        mood = "Relaxed 😎"
    elif -0.2 < compound_score < 0.2:
        mood = "Neutral 😐"
    elif compound_score <= -0.5:
        mood = "Angry 😠"
    elif compound_score <= -0.3:
        mood = "Anxious 😨"
    else:
        mood = "Sad 😢"

    return mood

# Detect general context of the message
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

# Motivational quotes per mood
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

# Follow-up prompts
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
    user_message = request.json["message"]

    # Get or initialize chat history in session
    if "history" not in session:
        session["history"] = []

    session["history"].append(user_message)
    session["history"] = session["history"][-5:]  # Keep only last 5 messages

    sentiment = analyzer.polarity_scores(user_message)
    mood = analyze_mood(user_message)
    context = detect_context(user_message)

    # Basic reply based on context
    if context == "work":
        reply = "Work can be demanding. Is it something your job or tasks are causing?"
    elif context == "school":
        reply = "School pressures can pile up quickly. Want to talk about what’s stressing you?"
    elif context == "life":
        reply = "Life can feel overwhelming. I'm here to listen. Want to share more?"
    else:
        reply = "I hear you. I'm here for you!"

    # Add memory reference if applicable
    if len(session["history"]) > 1:
        reply += f" Earlier you said: “{session['history'][-2]}” — I’m here to help with that too."

    # Add mood-specific follow-up
    if mood in follow_ups:
        reply += " " + random.choice(follow_ups[mood])

    # Add motivational quote
    if mood in quotes:
        reply += " Here's something to lift you up: " + random.choice(quotes[mood])

    # Save mood and message
    save_mood(mood, user_message)

    return jsonify({
        "reply": reply,
        "mood": mood,
        "sentiment": sentiment,
        "memory": session["history"]
    })

# Save mood to local history
def save_mood(mood, user_message):
    history = []
    if os.path.exists("mood_history.json"):
        with open("mood_history.json", "r") as f:
            history = json.load(f)

    history.append({
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "mood": mood,
        "message": user_message
    })

    with open("mood_history.json", "w") as f:
        json.dump(history[-10:], f)  # Save only the last 10 entries

@app.route("/history")
def history():
    if os.path.exists("mood_history.json"):
        with open("mood_history.json", "r") as f:
            return jsonify(json.load(f))
    return jsonify([])

@app.route("/clear-history", methods=["POST"])
def clear_history():
    if os.path.exists("mood_history.json"):
        os.remove("mood_history.json")
    return jsonify({"status": "cleared"})

@app.route("/clear-session", methods=["POST"])
def clear_session():
    session.pop("history", None)
    return jsonify({"status": "session cleared"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
