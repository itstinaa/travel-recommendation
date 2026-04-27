requireAuthOrRedirect();

const favDiv = document.getElementById("favourites");
const historyDiv = document.getElementById("history");
const recommendedDiv = document.getElementById("recommended");
const userEmail = document.getElementById("userEmail");

const loadFavsBtn = document.getElementById("loadFavs");
const loadHistoryBtn = document.getElementById("loadHistory");
const loadRecommendedBtn = document.getElementById("loadRecommended");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", () => {
  clearToken();
  window.location.href = "/login.html";
});

async function loadProfile() {
  try {
    const user = await apiFetch("/user/profile", { auth: true });
    userEmail.textContent = `Logged in as: ${user.email}`;
  } catch (err) {
    userEmail.textContent = "Failed to load profile.";
  }
}

async function loadFavourites() {
  favDiv.innerHTML = "Loading...";

  try {
    const favs = await apiFetch("/favourites", { auth: true });

    const validFavs = favs.filter(f => f.destinationId);

    if (!validFavs.length) {
      favDiv.innerHTML = `<p class="empty">No favourites yet.</p>`;
      return;
    }

    favDiv.innerHTML = validFavs.map(f => {
      const d = f.destinationId;

      return `
        <div class="card">
          <strong>${d.name}, ${d.country}</strong>
          <div>Region: ${d.region || "-"}</div>
          <div>Budget: ${d.budget || "-"}</div>
          <div>Vibe: ${d.vibe || "-"}</div>
          <div>Climate: ${d.climateType || "-"}</div>
          <div class="small">Saved: ${new Date(f.createdAt).toLocaleString()}</div>
          <div style="margin-top:10px;">
            <button class="removeBtn removeFavBtn" data-id="${f._id}">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".removeFavBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const favId = btn.dataset.id;

        try {
          await apiFetch(`/favourites/${favId}`, {
            method: "DELETE",
            auth: true
          });

          btn.closest(".card")?.remove();

          if (!favDiv.querySelector(".card")) {
            favDiv.innerHTML = `<p class="empty">No favourites yet.</p>`;
          }
        } catch (err) {
          alert(err.message || "Failed to remove favourite.");
        }
      });
    });
  } catch (err) {
    favDiv.innerHTML = `<p class="empty">${err.message || "Failed to load favourites."}</p>`;
  }
}

async function loadHistory() {
  historyDiv.innerHTML = "Loading...";

  try {
    const items = await apiFetch("/history", { auth: true });

    if (!items.length) {
      historyDiv.innerHTML = `<p class="empty">No history yet.</p>`;
      return;
    }

    historyDiv.innerHTML = items.map(h => {
      const q = h.query || {};

      return `
        <div class="card">
          <div><b>Budget:</b> ${q.budget || "-"}</div>
          <div><b>Interests:</b> ${(q.interests || []).join(", ") || "-"}</div>
          <div><b>Climate:</b> ${q.climate || "-"}</div>
          <div><b>Vibe:</b> ${q.vibe || "-"}</div>
          <div><b>Trip Type:</b> ${q.tripType || "-"}</div>
          <div><b>Region:</b> ${q.region || "-"}</div>
          <div class="small">${new Date(h.createdAt).toLocaleString()}</div>
          <div style="margin-top:10px;">
            <button class="removeBtn deleteHistoryBtn" data-id="${h._id}">Delete</button>
          </div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".deleteHistoryBtn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const historyId = btn.dataset.id;

        try {
          await apiFetch(`/history/${historyId}`, {
            method: "DELETE",
            auth: true
          });

          btn.closest(".card")?.remove();

          if (!historyDiv.querySelector(".card")) {
            historyDiv.innerHTML = `<p class="empty">No history yet.</p>`;
          }
        } catch (err) {
          alert(err.message || "Failed to delete history item.");
        }
      });
    });
  } catch (err) {
    historyDiv.innerHTML = `<p class="empty">${err.message || "Failed to load history."}</p>`;
  }
}

async function clearHistory() {
  const ok = window.confirm("Clear all search history?");
  if (!ok) return;

  try {
    await apiFetch("/history", {
      method: "DELETE",
      auth: true
    });

    historyDiv.innerHTML = `<p class="empty">No history yet.</p>`;
  } catch (err) {
    alert(err.message || "Failed to clear history.");
  }
}

async function loadRecommendations() {
  recommendedDiv.innerHTML = "Loading...";

  try {
    const items = await apiFetch("/user/recommended", { auth: true });

    if (!items.length) {
      recommendedDiv.innerHTML = `<p class="empty">No personalised recommendations yet.</p>`;
      return;
    }

    recommendedDiv.innerHTML = items.map(d => `
      <div class="card">
        <strong>${d.name}, ${d.country}</strong>
        <div>Region: ${d.region || "-"}</div>
        <div>Budget: ${d.budget || "-"}</div>
        <div>Vibe: ${d.vibe || "-"}</div>
        <div>Climate: ${d.climateType || "-"}</div>
        <div>Why: ${d.why || (d.reasons || []).join(", ") || "Based on your preferences"}</div>
      </div>
    `).join("");
  } catch (err) {
    recommendedDiv.innerHTML = `<p class="empty">${err.message || "Failed to load recommendations."}</p>`;
  }
}

loadFavsBtn?.addEventListener("click", loadFavourites);
loadHistoryBtn?.addEventListener("click", loadHistory);
loadRecommendedBtn?.addEventListener("click", loadRecommendations);
clearHistoryBtn?.addEventListener("click", clearHistory);

// Auto-load everything on page open
loadProfile();
loadFavourites();
loadHistory();
loadRecommendations();