from flask import Flask, render_template, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
import os
from datetime import datetime

app = Flask(__name__)

# Initialize VADER Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

@app.route("/")
def home():
    return render_template("index.html")  # Now uses the templates folder

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

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json["message"]
    sentiment = analyzer.polarity_scores(user_message)
    compound_score = sentiment['compound']
    mood = analyze_mood(user_message)
    reply = "I hear you. I'm here for you!"

    save_mood(mood, user_message)

    return jsonify({
        "reply": reply,
        "mood": mood,
        "sentiment": sentiment
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=True)
