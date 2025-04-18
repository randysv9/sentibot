document.addEventListener("DOMContentLoaded", () => {
  const historyBox = document.getElementById("history");
  const chatBox = document.getElementById("chat-box");

  // Load history
  fetch("/history")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        const p = document.createElement("p");
        p.textContent = `${item.timestamp} - Mood: ${item.mood}`;
        historyBox.appendChild(p);
      });
    });

  // Existing event listener
  document.getElementById("send-btn").addEventListener("click", () => {
    const userInput = document.getElementById("user-input");
    const message = userInput.value;
    if (!message) return;

    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((res) => res.json())
      .then((data) => {
        const userMsg = document.createElement("p");
        userMsg.textContent = `You: ${message}`;
        chatBox.appendChild(userMsg);

        const botReply = document.createElement("p");
        botReply.textContent = `SentiBot: ${data.reply} | Mood: ${data.mood}`;
        chatBox.appendChild(botReply);

        userInput.value = "";
      });
  });
});
