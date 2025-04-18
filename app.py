from flask import Flask, render_template_string, request, jsonify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import json
import os
from datetime import datetime

app = Flask(__name__)

# Initialize VADER Sentiment Analyzer
analyzer = SentimentIntensityAnalyzer()

# Load chat page
with open("index.html", "r") as f:
    html_template = f.read()

@app.route("/")
def home():
    return render_template_string(html_template)

# Detect mood using VADER
def analyze_mood(text):
    sentiment = analyzer.polarity_scores(text)
    compound_score = sentiment['compound']

    # Determine mood based on the compound score
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


@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json["message"]
    mood = analyze_mood(user_message)
    reply = f"I hear you. I'm here for you!"
    save_mood(mood)
    return jsonify({"reply": reply, "mood": mood})

# Save to local mood history
def save_mood(mood):
    history = []
    if os.path.exists("mood_history.json"):
        with open("mood_history.json", "r") as f:
            history = json.load(f)
    history.append({"timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "mood": mood})
    with open("mood_history.json", "w") as f:
        json.dump(history[-10:], f)  # Save last 10

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
    port = int(os.environ.get("PORT", 10000))  # Default port if not set
    app.run(host="0.0.0.0", port=port, debug=True)
