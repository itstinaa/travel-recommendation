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

  if (!window.Chart || !roleChart || !growthChart) return;

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
      <div class="item-card" id="user-card-${esc(u._id)}">
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

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn" onclick="showEditUserForm('${esc(u._id)}')">Edit User</button>
          <button class="btn danger" onclick="deleteUser('${esc(u._id)}')">Delete User</button>
        </div>

        <div id="edit-box-${esc(u._id)}"></div>
      </div>
    `).join("")
    : "<p>No users found.</p>";
}

async function showEditUserForm(userId) {
  const box = document.getElementById(`edit-box-${userId}`);
  if (!box) return;

  try {
    const selectedUser = await apiFetch(`/admin/users/${userId}`, { auth: true });

    box.innerHTML = `
      <div style="margin-top:14px; padding:14px; border:1px solid #ddd; border-radius:12px; background:white;">
        <h3>Edit User</h3>

        <label>Email</label>
        <input id="edit-email-${userId}" value="${esc(selectedUser.email)}">

        <label>Role</label>
        <select id="edit-role-${userId}">
          <option value="user" ${selectedUser.role === "user" ? "selected" : ""}>user</option>
          <option value="admin" ${selectedUser.role === "admin" ? "selected" : ""}>admin</option>
        </select>

        <label>Budget</label>
        <select id="edit-budget-${userId}">
          <option value="low" ${selectedUser.preferences?.budget === "low" ? "selected" : ""}>low</option>
          <option value="mid" ${selectedUser.preferences?.budget === "mid" ? "selected" : ""}>mid</option>
          <option value="high" ${selectedUser.preferences?.budget === "high" ? "selected" : ""}>high</option>
        </select>

        <label>Climate</label>
        <input id="edit-climate-${userId}" value="${esc(selectedUser.preferences?.climate || "")}">

        <label>Vibe</label>
        <input id="edit-vibe-${userId}" value="${esc(selectedUser.preferences?.vibe || "")}">

        <label>Trip Type</label>
        <input id="edit-tripType-${userId}" value="${esc(selectedUser.preferences?.tripType || "")}">

        <label>Region</label>
        <input id="edit-region-${userId}" value="${esc(selectedUser.preferences?.region || "")}">

        <label>Interests comma separated</label>
        <input id="edit-interests-${userId}" value="${esc((selectedUser.preferences?.interests || []).join(", "))}">

        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn" onclick="updateUser('${userId}')">Save Changes</button>
          <button class="btn danger" onclick="cancelEdit('${userId}')">Cancel</button>
        </div>
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<p>${esc(err.message)}</p>`;
  }
}

function cancelEdit(userId) {
  const box = document.getElementById(`edit-box-${userId}`);
  if (box) box.innerHTML = "";
}

async function updateUser(userId) {
  const email = document.getElementById(`edit-email-${userId}`)?.value.trim();
  const role = document.getElementById(`edit-role-${userId}`)?.value;

  const budget = document.getElementById(`edit-budget-${userId}`)?.value;
  const climate = document.getElementById(`edit-climate-${userId}`)?.value.trim();
  const vibe = document.getElementById(`edit-vibe-${userId}`)?.value.trim();
  const tripType = document.getElementById(`edit-tripType-${userId}`)?.value.trim();
  const region = document.getElementById(`edit-region-${userId}`)?.value.trim();

  const interestsText = document.getElementById(`edit-interests-${userId}`)?.value.trim() || "";
  const interests = interestsText
    ? interestsText.split(",").map(i => i.trim()).filter(Boolean)
    : [];

  try {
    await apiFetch(`/admin/users/${userId}`, {
      method: "PUT",
      auth: true,
      body: {
        email,
        role,
        preferences: {
          budget,
          climate,
          vibe,
          tripType,
          region,
          interests
        }
      }
    });

    alert("User updated successfully.");
    loadAdminDashboard();
  } catch (err) {
    alert(err.message || "Failed to update user.");
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user? This will also delete their favourites and history.")) {
    return;
  }

  try {
    await apiFetch(`/admin/users/${userId}`, {
      method: "DELETE",
      auth: true
    });

    alert("User deleted successfully.");
    loadAdminDashboard();
  } catch (err) {
    alert(err.message || "Failed to delete user.");
  }
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