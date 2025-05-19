// Fetch and display mood history when the page loads
document.addEventListener("DOMContentLoaded", function() {
  loadMoodHistory();

  // Handle the 'Clear History' button click
  document.getElementById("clear-history-btn").addEventListener("click", function() {
    clearMoodHistory();
  });
});

// Load the mood history and update the UI
function loadMoodHistory() {
  fetch("/history")
    .then(response => response.json())
    .then(data => {
      const historyDiv = document.getElementById("mood-history");
      historyDiv.innerHTML = "";  // Clear current content

      if (data.length === 0) {
        historyDiv.innerHTML = "<p class='text-muted'>No history yet.</p>";
      } else {
        data.forEach(entry => {
          const entryDiv = document.createElement("div");
          entryDiv.classList.add("mb-2");
          entryDiv.innerHTML = `<strong>${entry.timestamp}</strong>: ${entry.mood}`;
          historyDiv.appendChild(entryDiv);
        });
      }
    })
    .catch(error => console.error("Error loading mood history:", error));
}

// Handle the form submission for chat input
document.getElementById("chat-form").addEventListener("submit", function(event) {
  event.preventDefault();

  const userMessage = document.getElementById("user-input").value;
  if (!userMessage) return;

  // Display the user's message in the chat box
  const chatBox = document.getElementById("chat-box");
  const userMessageDiv = document.createElement("div");
  userMessageDiv.classList.add("mb-2");
  userMessageDiv.classList.add("text-end");
  userMessageDiv.textContent = "You: " + userMessage;
  chatBox.appendChild(userMessageDiv);

  // Send the message to the Flask server
  fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: userMessage })
  })
    .then(response => response.json())
    .then(data => {
      const botMessageDiv = document.createElement("div");
      botMessageDiv.classList.add("mb-2");
      botMessageDiv.textContent = "Sentibot: " + data.reply;
      chatBox.appendChild(botMessageDiv);

      // Update mood history with the new mood
      loadMoodHistory();  // Re-load the mood history after sending a message
    })
    .catch(error => console.error("Error sending message:", error));

  // Clear the input field
  document.getElementById("user-input").value = "";
});

// Clear the mood history
function clearMoodHistory() {
  fetch("/clear-history", {
    method: "POST"
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === "cleared") {
        const historyDiv = document.getElementById("mood-history");
        historyDiv.innerHTML = "<p class='text-muted'>No history yet.</p>";
        alert("Mood history has been cleared.");
      }
    })
    .catch(error => console.error("Error clearing mood history:", error));
}
