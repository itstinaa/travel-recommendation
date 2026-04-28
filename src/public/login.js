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

    // Save token
    setToken(data.token);

    // Save logged-in user details, including role
    localStorage.setItem("user", JSON.stringify(data.user));

    setMessage("Login successful. Redirecting...");

    // Admin goes to admin dashboard
    if (data.user?.role === "admin") {
      window.location.href = "/admin.html";
      return;
    }

    // If user was saving a favourite before login, send them back
    const pendingRedirect = localStorage.getItem("pendingFavouriteRedirect");

    if (pendingRedirect) {
      window.location.href = pendingRedirect;
      return;
    }

    // Normal users go to account dashboard
    window.location.href = "/account.html";

  } catch (err) {
    setMessage(err.message || "Login failed.");
  }
});