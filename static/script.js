let currentUser = null;
let moodChart; // Global Chart.js instance

document.addEventListener("DOMContentLoaded", function () {
  // Check session on load
  fetch("/check-session")
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        currentUser = data.username;
        showAppSection();
        loadMoodHistory();
      } else {
        showLoginSection();
      }
    });

  // Handle login
  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          currentUser = username;
          showAppSection();
          loadMoodHistory();
        } else {
          document.getElementById("login-error").textContent = data.message;
        }
      });
  });

  // Handle logout
  document.getElementById("logout-btn").addEventListener("click", function () {
    fetch("/logout", { method: "POST" })
      .then(() => {
        currentUser = null;
        showLoginSection();
      });
  });

  // Other app functionality
  document.getElementById("clear-history-btn").addEventListener("click", clearMoodHistory);

  const moodSelect = document.getElementById("mood-select");
  if (moodSelect) {
    moodSelect.addEventListener("change", function () {
      if (this.value) submitMoodMessage(this.value);
    });
  }

  document.getElementById("chat-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const userInput = document.getElementById("user-input").value.trim();
    const selectedMood = moodSelect ? moodSelect.value : "";

    const messageToSend = userInput || selectedMood;
    if (!messageToSend) return;

    const chatBox = document.getElementById("chat-box");

    const userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add("mb-2", "text-end");
    userMessageDiv.textContent = `You (${selectedMood}): ${userInput || selectedMood}`;
    chatBox.appendChild(userMessageDiv);

    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-indicator";
    loadingDiv.classList.add("mb-2");
    loadingDiv.innerHTML = `<strong>Sentibot:</strong> <div class="typing-spinner"><span>.</span><span>.</span><span>.</span></div>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: messageToSend })
    })
      .then(res => res.json())
      .then(data => {
        loadingDiv.remove();

        const botReply = document.createElement("div");
        botReply.classList.add("mb-2");
        botReply.innerHTML = `<strong>Sentibot:</strong> ${data.reply}`;
        chatBox.appendChild(botReply);
        chatBox.scrollTop = chatBox.scrollHeight;

        document.getElementById("user-input").value = "";
        if (moodSelect) moodSelect.value = "";

        loadMoodHistory();
      })
      .catch(err => {
        console.error("Error sending message:", err);
        loadingDiv.remove();
      });
  });
});

function showLoginSection() {
  document.getElementById("login-section").style.display = "block";
  document.getElementById("app-section").style.display = "none";
  document.getElementById("login-form").reset();
  document.getElementById("login-error").textContent = "";
}

function showAppSection() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("app-section").style.display = "block";
  document.getElementById("user-display").textContent = currentUser;
}

const moodColors = {
  "Excited 🤩": "#f39c12",
  "Happy 😊": "#2ecc71",
  "Relaxed 😎": "#3498db",
  "Neutral 😐": "#95a5a6",
  "Sad 😢": "#9b59b6",
  "Anxious 😨": "#e67e22",
  "Angry 😠": "#e74c3c"
};

const moodLevels = {
  "Excited 🤩": 6,
  "Happy 😊": 5,
  "Relaxed 😎": 4,
  "Neutral 😐": 3,
  "Sad 😢": 2,
  "Anxious 😨": 1,
  "Angry 😠": 0
};

function loadMoodHistory() {
  fetch("/history")
    .then(res => res.json())
    .then(data => {
      const historyDiv = document.getElementById("mood-history");
      historyDiv.innerHTML = "";

      if (data.length === 0) {
        historyDiv.innerHTML = "<p class='text-muted'>No history yet.</p>";
        updateMoodChart([], []);
        updateMoodSummary([]);
        return;
      }

      const labels = [];
      const values = [];

      data.forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("mb-3", "p-2", "border", "rounded", "bg-light");
        entryDiv.innerHTML = `<strong>${entry.timestamp}</strong>: ${entry.mood}<br><em>Message:</em> ${entry.message || 'N/A'}`;
        historyDiv.appendChild(entryDiv);

        labels.push(entry.timestamp);
        values.push({ y: moodLevels[entry.mood], mood: entry.mood });
      });

      updateMoodChart(labels, values);
      updateMoodSummary(data);
    })
    .catch(err => console.error("Error loading mood history:", err));
}

function updateMoodChart(labels, values) {
  const ctx = document.getElementById("moodChart").getContext("2d");
  if (moodChart) moodChart.destroy();

  moodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Mood Level",
        data: values.map(v => v.y),
        backgroundColor: values.map(v => moodColors[v.mood]),
        borderColor: "#333",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      scales: {
        y: {
          min: 0,
          max: 6,
          ticks: {
            stepSize: 1,
            callback: value => Object.keys(moodLevels).find(key => moodLevels[key] === value) || value
          }
        }
      }
    }
  });
}

function updateMoodSummary(history) {
  const summaryDiv = document.getElementById('mood-summary');
  if (history.length === 0) {
    summaryDiv.innerHTML = '<p class="text-muted">No summary available yet.</p>';
    return;
  }

  const moodCount = {};
  history.forEach(entry => {
    moodCount[entry.mood] = (moodCount[entry.mood] || 0) + 1;
  });

  const sortedMoods = Object.entries(moodCount).sort((a, b) => b[1] - a[1]);
  const topMood = sortedMoods[0][0];
  const topCount = sortedMoods[0][1];

  let summaryHTML = `<p><strong>Most selected mood:</strong> ${topMood} (${topCount} times)</p>`;
  summaryHTML += '<ul>';
  for (const [mood, count] of sortedMoods) {
    summaryHTML += `<li>${mood}: ${count}</li>`;
  }
  summaryHTML += '</ul>';

  summaryDiv.innerHTML = summaryHTML;
}

function clearMoodHistory() {
  fetch("/clear", { method: "POST" })
    .then(() => loadMoodHistory())
    .catch(err => console.error("Error clearing mood history:", err));
}

function submitMoodMessage(mood) {
  document.getElementById("chat-form").dispatchEvent(new Event("submit"));
}
