let moodChart; // Global variable for Chart.js instance

document.addEventListener("DOMContentLoaded", function () {
  loadMoodHistory();

  document.getElementById("clear-history-btn").addEventListener("click", function () {
    clearMoodHistory();
  });
});

// Mood to color mapping
const moodColors = {
  "Excited 🤩": "#f39c12",
  "Happy 😊": "#2ecc71",
  "Relaxed 😎": "#3498db",
  "Neutral 😐": "#95a5a6",
  "Sad 😢": "#9b59b6",
  "Anxious 😨": "#e67e22",
  "Angry 😠": "#e74c3c"
};

// Mood to numerical value (for chart)
const moodLevels = {
  "Excited 🤩": 6,
  "Happy 😊": 5,
  "Relaxed 😎": 4,
  "Neutral 😐": 3,
  "Sad 😢": 2,
  "Anxious 😨": 1,
  "Angry 😠": 0
};

// Load mood history and chart
function loadMoodHistory() {
  fetch("/history")
    .then(response => response.json())
    .then(data => {
      const historyDiv = document.getElementById("mood-history");
      historyDiv.innerHTML = "";

      if (data.length === 0) {
        historyDiv.innerHTML = "<p class='text-muted'>No history yet.</p>";
        updateMoodChart([], []);
        return;
      }

      const labels = [];
      const values = [];

      data.forEach(entry => {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("mb-3", "p-2", "border", "rounded", "bg-light");

        entryDiv.innerHTML = `
          <strong>${entry.timestamp}</strong><br>
          <span><strong>Mood:</strong> ${entry.mood}</span><br>
          <span><strong>Message:</strong> ${entry.message}</span>
        `;
        historyDiv.appendChild(entryDiv);

        labels.push(entry.timestamp);
        values.push({
          y: moodLevels[entry.mood],
          mood: entry.mood
        });
      });

      updateMoodChart(labels, values);
    })
    .catch(error => console.error("Error loading mood history:", error));
}


// Handle chat submission
document.getElementById("chat-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const userMessage = document.getElementById("user-input").value;
  if (!userMessage) return;

  const chatBox = document.getElementById("chat-box");
  const userMessageDiv = document.createElement("div");
  userMessageDiv.classList.add("mb-2", "text-end");
  userMessageDiv.textContent = "You: " + userMessage;
  chatBox.appendChild(userMessageDiv);

  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage })
  })
    .then(response => response.json())
    .then(data => {
      const botMessageDiv = document.createElement("div");
      botMessageDiv.classList.add("mb-2");
      botMessageDiv.textContent = "Sentibot: " + data.reply;
      chatBox.appendChild(botMessageDiv);

      loadMoodHistory(); // Refresh mood history and chart
    })
    .catch(error => console.error("Error sending message:", error));

  document.getElementById("user-input").value = "";
});

// Clear mood history
function clearMoodHistory() {
  fetch("/clear-history", {
    method: "POST"
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === "cleared") {
        const historyDiv = document.getElementById("mood-history");
        historyDiv.innerHTML = "<p class='text-muted'>No history yet.</p>";
        updateMoodChart([], []);
        alert("Mood history has been cleared.");
      }
    })
    .catch(error => console.error("Error clearing mood history:", error));
}

// Create or update the mood chart
function updateMoodChart(labels, values) {
  const ctx = document.getElementById("moodChart").getContext("2d");

  if (moodChart) {
    moodChart.destroy(); // Recreate to avoid duplicates
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(75,192,192,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  moodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Mood Level",
        data: values.map(v => v.y),
        fill: true,
        backgroundColor: gradient,
        borderColor: "#2980b9",
        tension: 0.4,
        pointBackgroundColor: values.map(v => moodColors[v.mood]),
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 6,
          ticks: {
            callback: function (value) {
              return Object.keys(moodLevels).find(m => moodLevels[m] === value);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const moodLabel = Object.keys(moodLevels).find(m => moodLevels[m] === context.parsed.y);
              return `Mood: ${moodLabel}`;
            }
          }
        }
      }
    }
  });
}
