let moodChart; // Global variable for Chart.js instance

document.addEventListener("DOMContentLoaded", function () {
  loadMoodHistory();

  document.getElementById("clear-history-btn").addEventListener("click", function () {
    clearMoodHistory();
  });

  // Event listener for the dropdown
  document.getElementById("mood-dropdown").addEventListener("change", function () {
    const selectedMood = this.value;
    if (selectedMood) {
      submitMoodMessage(selectedMood);
    }
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

        entryDiv.innerHTML = `<strong>${entry.timestamp}</strong>: ${entry.mood}<br><em>Message:</em> ${entry.message || 'N/A'}`;
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

  const userInput = document.getElementById("user-input").value.trim();
  const moodDropdown = document.getElementById("mood-dropdown");
  const selectedMood = moodDropdown ? moodDropdown.value : "";

  const messageToSend = userInput || selectedMood;

  if (!messageToSend) return; // Don't send empty messages

  const chatBox = document.getElementById("chat-box");

  // Append user message
  const userMessageDiv = document.createElement("div");
  userMessageDiv.classList.add("mb-2", "text-end");
  userMessageDiv.textContent = "You: " + messageToSend;
  chatBox.appendChild(userMessageDiv);

  // Add loading spinner
  const loadingDiv = document.createElement("div");
  loadingDiv.id = "loading-indicator";
  loadingDiv.classList.add("mb-2");
  loadingDiv.innerHTML = `
    <strong>Sentibot:</strong> <div class="typing-spinner">
      <span>.</span><span>.</span><span>.</span>
    </div>
  `;
  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Send message to backend
  fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: messageToSend })
  })
    .then(response => response.json())
    .then(data => {
      loadingDiv.remove();

      const botMessageDiv = document.createElement("div");
      botMessageDiv.classList.add("mb-2");
      botMessageDiv.innerHTML = `<strong>Sentibot:</strong> ${data.reply}`;
      chatBox.appendChild(botMessageDiv);
      chatBox.scrollTop = chatBox.scrollHeight;

      // Clear input and dropdown after sending
      document.getElementById("user-input").value = "";
      if (moodDropdown) moodDropdown.value = "";

      loadMoodHistory(); // Update mood history and chart
    })
    .catch(error => {
      console.error("Error sending message:", error);
      loadingDiv.remove();
    });
});

// Update mood chart
function updateMoodChart(labels, values) {
  const ctx = document.getElementById("moodChart").getContext("2d");

  if (moodChart) {
    moodChart.destroy();
  }

  moodChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
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
            callback: function (value) {
              const mood = Object.keys(moodLevels).find(key => moodLevels[key] === value);
              return mood || value;
            }
          }
        }
      }
    }
  });
}

// Clear mood history
function clearMoodHistory() {
  fetch("/clear", { method: "POST" })
    .then(() => {
      loadMoodHistory();
    })
    .catch(error => console.error("Error clearing mood history:", error));
}

// Function to handle mood selection
function submitMoodMessage(mood) {
  // Auto-submit when mood is selected
  const event = new Event("submit");
  document.getElementById("chat-form").dispatchEvent(event);
}
