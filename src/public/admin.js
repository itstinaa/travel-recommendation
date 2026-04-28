const user = JSON.parse(localStorage.getItem("user") || "{}");
const token = localStorage.getItem("token");

const msg = document.getElementById("msg");
const usersDiv = document.getElementById("users");
const favouritesDiv = document.getElementById("favourites");
const historyDiv = document.getElementById("history");
const destinationsDiv = document.getElementById("destinations");
const logoutBtn = document.getElementById("logoutBtn");

let roleChartInstance = null;
let growthChartInstance = null;

function setMessage(text) {
  if (msg) msg.textContent = text;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

if (!token) {
  window.location.href = "/login.html";
}

if (user.role !== "admin") {
  alert("Admin access only");
  window.location.href = "/account.html";
}

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (typeof clearToken === "function") {
    clearToken();
  }

  window.location.href = "/login.html";
});

function renderCharts(users) {
  const roleChart = document.getElementById("roleChart");
  const growthChart = document.getElementById("growthChart");

  if (!window.Chart || !roleChart || !growthChart) {
    console.warn("Chart.js or chart canvas elements are missing.");
    return;
  }

  const admins = users.filter(u => u.role === "admin").length;
  const normalUsers = users.filter(u => u.role !== "admin").length;

  if (roleChartInstance) roleChartInstance.destroy();

  roleChartInstance = new Chart(roleChart, {
    type: "doughnut",
    data: {
      labels: ["Admins", "Users"],
      datasets: [{
        data: [admins, normalUsers],
        backgroundColor: ["#dc2626", "#2563eb"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });

  const monthlyCounts = {};

  users.forEach(u => {
    if (!u.createdAt) return;

    const date = new Date(u.createdAt);
    const month = date.toLocaleString("en-GB", {
      month: "short",
      year: "numeric"
    });

    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  const labels = Object.keys(monthlyCounts);
  const values = Object.values(monthlyCounts);

  if (growthChartInstance) growthChartInstance.destroy();

  growthChartInstance = new Chart(growthChart, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "New Users",
        data: values,
        backgroundColor: "#2563eb"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

function renderUsers(users) {
  if (!usersDiv) return;

  usersDiv.innerHTML = users.length
    ? users.map(u => `
      <div class="item-card">
        <strong>${esc(u.email)}</strong>

        <span class="badge ${u.role === "admin" ? "admin" : ""}">
          ${esc(u.role || "user")}
        </span>

        <p class="muted">
          Created: ${u.createdAt ? new Date(u.createdAt).toLocaleString() : "Unknown"}
        </p>

        <p><strong>Budget:</strong> ${esc(u.preferences?.budget || "Not set")}</p>
        <p><strong>Climate:</strong> ${esc(u.preferences?.climate || "Not set")}</p>
        <p><strong>Vibe:</strong> ${esc(u.preferences?.vibe || "Not set")}</p>
        <p><strong>Trip Type:</strong> ${esc(u.preferences?.tripType || "Not set")}</p>
        <p><strong>Region:</strong> ${esc(u.preferences?.region || "Not set")}</p>
        <p><strong>Interests:</strong> ${esc((u.preferences?.interests || []).join(", ") || "None")}</p>
      </div>
    `).join("")
    : "<p>No users found.</p>";
}

function renderFavourites(favourites) {
  if (!favouritesDiv) return;

  favouritesDiv.innerHTML = favourites.length
    ? favourites.map(f => `
      <div class="item-card">
        <strong>User: ${esc(f.userId?.email || "Unknown user")}</strong>
        <p>Destination: ${esc(f.destinationId?.name || "Unknown destination")}</p>
        <p class="muted">Country: ${esc(f.destinationId?.country || "")}</p>
        <p class="muted">Saved: ${f.createdAt ? new Date(f.createdAt).toLocaleString() : "Unknown"}</p>
      </div>
    `).join("")
    : "<p>No favourites found.</p>";
}

function renderHistory(history) {
  if (!historyDiv) return;

  historyDiv.innerHTML = history.length
    ? history.map(h => `
      <div class="item-card">
        <strong>User: ${esc(h.userId?.email || "Unknown user")}</strong>
        <p class="muted">Created: ${h.createdAt ? new Date(h.createdAt).toLocaleString() : "Unknown"}</p>
        <pre>${esc(JSON.stringify(h.query || {}, null, 2))}</pre>
      </div>
    `).join("")
    : "<p>No search history found.</p>";
}

function renderDestinations(destinations) {
  if (!destinationsDiv) return;

  destinationsDiv.innerHTML = destinations.length
    ? destinations.map(d => `
      <div class="item-card">
        <strong>${esc(d.name || "Unnamed destination")}</strong>
        <p>${esc(d.country || "")}</p>
        <p class="muted">
          ${esc(d.vibe || "any")} | ${esc(d.budget || "any")} | ${esc(d.climateType || "any")}
        </p>
      </div>
    `).join("")
    : "<p>No destinations found.</p>";
}

async function loadAdminDashboard() {
  try {
    setMessage("Loading admin data...");

    const data = await apiFetch("/admin/dashboard", { auth: true });

    console.log("ADMIN DATA:", data);

    const users = data.users || [];
    const favourites = data.favourites || [];
    const history = data.history || [];
    const destinations = data.destinations || [];

    setText("totalUsers", users.length);
    setText("totalAdmins", users.filter(u => u.role === "admin").length);
    setText("totalFavourites", favourites.length);
    setText("totalDestinations", destinations.length);

    renderUsers(users);
    renderFavourites(favourites);
    renderHistory(history);
    renderDestinations(destinations);
    renderCharts(users);

    setMessage("Admin data loaded successfully.");
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    setMessage(err.message || "Failed to load admin data.");
  }
}

loadAdminDashboard();