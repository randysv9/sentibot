from flask import Flask, render_template, request, jsonify, session, redirect
from datetime import datetime
from collections import defaultdict
import sqlite3
import os


def init_db():
    if not os.path.exists("database.db"):
        conn = sqlite3.connect("database.db")
        with open("schema.sql") as f:
            conn.executescript(f.read())
        conn.close()
        print("Initialized new database.")


app = Flask(__name__)
app.secret_key = "your_secret_key_here"


def get_db_connection():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn


@app.route("/")
def index():
    if "user" not in session:
        return redirect("/login-page")
    return render_template("index.html")


@app.route("/admin-dashboard")
def admin_dashboard():
    if session.get("role") == "admin":
        return render_template("admin.html")
    else:
        return redirect("/")


@app.route("/login-page")
def login_page():
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    username = data.get("username")
    password = data.get("password")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
    user = cursor.fetchone()
    conn.close()

    if user:
        session["user"] = user["username"]
        session["role"] = user["role"]

        if user["role"] == "admin":
            return jsonify({"success": True, "redirect": "/admin-dashboard"})
        else:
            return jsonify({"success": True, "redirect": "/"})
    else:
        return jsonify({"success": False, "message": "Invalid username or password"}), 401


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login-page")


@app.route("/detect", methods=["POST"])
def detect():
    user_message = request.json["message"]
    mood = analyze_mood(user_message)
    save_mood(mood, user_message)
    return jsonify({"mood": mood})


@app.route("/history")
def history():
    if "user" not in session:
        return jsonify([])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, mood, message FROM mood_history WHERE username = ? ORDER BY timestamp DESC", (session["user"],))
    rows = cursor.fetchall()
    conn.close()

    history = [{"timestamp": row["timestamp"], "mood": row["mood"], "message": row["message"]} for row in rows]
    return jsonify(history)


@app.route("/clear", methods=["POST"])
def clear_history():
    if "user" not in session:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM mood_history WHERE username = ?", (session["user"],))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/chat", methods=["POST"])
def chat():
    if "user" not in session:
        return jsonify({"reply": "Please log in to continue."}), 401

    data = request.get_json()
    user_message = data.get("message", "")
    mood = analyze_mood(user_message)
    save_mood(mood, user_message)

    reply = f"I understand you're feeling {mood}. I'm here for you!"
    return jsonify({"reply": reply})


def analyze_mood(text):
    text = text.lower()
    if any(word in text for word in ["happy", "glad", "joy", "excited", "great", "good", "fantastic", "grateful"]):
        return "happy"
    elif any(word in text for word in ["sad", "depressed", "unhappy", "down", "blue", "miserable"]):
        return "sad"
    elif any(word in text for word in ["angry", "mad", "furious", "irritated", "annoyed"]):
        return "angry"
    elif any(word in text for word in ["anxious", "nervous", "worried", "scared", "afraid"]):
        return "anxious"
    else:
        return "neutral"


def save_mood(mood, user_message):
    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    username = session.get("user", "guest")

    cursor.execute("INSERT INTO mood_history (username, timestamp, mood, message) VALUES (?, ?, ?, ?)",
                   (username, timestamp, mood, user_message))

    conn.commit()
    conn.close()


@app.route("/summary")
def daily_summary():
    conn = get_db_connection()
    cursor = conn.cursor()

    summary = defaultdict(lambda: defaultdict(int))
    cursor.execute("SELECT timestamp, mood FROM mood_history")
    rows = cursor.fetchall()
    conn.close()

    for row in rows:
        date_str = row["timestamp"].split(" ")[0]
        mood = row["mood"]
        summary[date_str][mood] += 1

    return jsonify(summary)


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
