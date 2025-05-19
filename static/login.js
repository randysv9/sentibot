document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault(); // prevent page reload

  const formData = {
    username: document.getElementById("username").value,
    password: document.getElementById("password").value
  };

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.redirect) {
        window.location.href = data.redirect;
      } else {
        document.getElementById("error-msg").textContent = "Invalid credentials.";
        document.getElementById("error-msg").classList.remove("d-none");
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      document.getElementById("error-msg").textContent = "An error occurred. Please try again.";
      document.getElementById("error-msg").classList.remove("d-none");
    });
});
