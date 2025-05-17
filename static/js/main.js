document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mood-form");
  const messageInput = document.getElementById("message");
  const moodDisplay = document.getElementById("mood-display");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = messageInput.value.trim();
    if (!message) return;

    try {
      const response = await fetch("/store_mood", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.success) {
        moodDisplay.textContent = `Detected Mood: ${data.mood}`;
        messageInput.value = "";
      } else {
        moodDisplay.textContent = `Error: ${data.message}`;
      }
    } catch (error) {
      console.error("Error:", error);
      moodDisplay.textContent = "Error connecting to server.";
    }
  });
});
