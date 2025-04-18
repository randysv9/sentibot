document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.getElementById('chat-box');
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const moodHistory = document.getElementById('mood-history');

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    chatBox.innerHTML += `<div class="message"><strong>You:</strong> ${message}</div>`;
    userInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    const data = await response.json();
    chatBox.innerHTML += `<div class="message"><strong>Sentibot:</strong> ${data.reply} <br><em>Mood: ${data.mood}</em></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Update mood history
    loadMoodHistory();
  });

  async function loadMoodHistory() {
    const res = await fetch('/history');
    const data = await res.json();
    moodHistory.innerHTML = data.map(entry =>
      `<div class="history-entry"><strong>${entry.timestamp}</strong>: ${entry.mood}</div>`
    ).join('');
  }

  loadMoodHistory();
});

function fetchMoodHistory() {
    fetch("/history")
        .then(res => res.json())
        .then(data => {
            const labels = data.map(entry => entry.timestamp);
            const moods = data.map(entry => {
                if (entry.mood.includes("Happy")) return 1;
                if (entry.mood.includes("Sad")) return -1;
                return 0;
            });

            const ctx = document.getElementById('moodChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Mood Over Time',
                        data: moods,
                        borderColor: 'blue',
                        backgroundColor: 'lightblue',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    scales: {
                        y: {
                            min: -1,
                            max: 1,
                            ticks: {
                                callback: function(value) {
                                    if (value === 1) return 'Happy 😊';
                                    if (value === -1) return 'Sad 😢';
                                    return 'Neutral 😐';
                                }
                            }
                        }
                    }
                }
            });
        });
}

window.onload = function () {
    fetchMoodHistory();
}
