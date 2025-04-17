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