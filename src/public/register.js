const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Registering...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { email, password }
    });

    msg.textContent = "Registered! You can log in now.";
    setTimeout(() => (window.location.href = "/login.html"), 800);
  } catch (err) {
    msg.textContent = err.message;
  }
});
