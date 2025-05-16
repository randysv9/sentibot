document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(loginForm);

      fetch("/login", {
        method: "POST",
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.redirect) {
            window.location.href = data.redirect;
          } else {
            alert("Login failed. Please check your credentials.");
          }
        })
        .catch(err => {
          console.error("Login error:", err);
          alert("An error occurred during login.");
        });
    });
  }
});
