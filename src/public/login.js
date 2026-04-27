const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

function setMessage(text) {
  if (msg) msg.textContent = text;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email")?.value.trim() || "";
  const password = document.getElementById("password")?.value || "";

  if (!email || !password) {
    setMessage("Please enter your email and password.");
    return;
  }

  setMessage("Logging in...");

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { email, password }
    });

    setToken(data.token);

    const redirectTo =
      localStorage.getItem("pendingFavouriteRedirect") || "/explore.html";

    setMessage("Login successful. Redirecting...");
    window.location.href = redirectTo;
  } catch (err) {
    setMessage(err.message || "Login failed.");
  }
});