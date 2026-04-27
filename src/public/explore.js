requireAuthOrRedirect();

const form = document.getElementById("prefsForm");
const msg = document.getElementById("msg");
const resultsDiv = document.getElementById("results");
const logoutBtn = document.getElementById("logoutBtn");

function getEl(id) {
  return document.getElementById(id);
}

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function buildInterestsArray(interestsRaw) {
  return interestsRaw
    ? interestsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
}

function setMessage(text) {
  if (msg) msg.textContent = text;
}

async function loadSavedPreferences() {
  try {
    const user = await apiFetch("/user/profile", { auth: true });
    const prefs = user.preferences || {};

    if (prefs.budget && getEl("budget")) getEl("budget").value = prefs.budget;
    if (prefs.interests && getEl("interests")) {
      getEl("interests").value = prefs.interests.join(", ");
    }
    if (prefs.climate && getEl("climate")) getEl("climate").value = prefs.climate;
    if (prefs.vibe && getEl("vibe")) getEl("vibe").value = prefs.vibe;
    if (prefs.tripType && getEl("tripType")) getEl("tripType").value = prefs.tripType;
    if (prefs.region && getEl("region")) getEl("region").value = prefs.region;
  } catch (err) {
    console.error("Could not load saved preferences:", err.message);
  }
}

function loadQueryParamsIntoForm() {
  const params = getQueryParams();

  const q = params.get("q") || "";
  const climate = params.get("climate") || "";
  const vibe = params.get("vibe") || "";
  const budget = params.get("budget") || "";
  const tripType = params.get("tripType") || "";
  const region = params.get("region") || "";

  if (q && getEl("interests")) getEl("interests").value = q;
  if (climate && getEl("climate")) getEl("climate").value = climate;
  if (vibe && getEl("vibe")) getEl("vibe").value = vibe;
  if (budget && getEl("budget")) getEl("budget").value = budget;
  if (tripType && getEl("tripType")) getEl("tripType").value = tripType;
  if (region && getEl("region")) getEl("region").value = region;
}

async function submitRecommendationSearch() {
  setMessage("Loading recommendations...");
  if (resultsDiv) resultsDiv.innerHTML = "";

  const budget = getEl("budget")?.value || "";
  const interestsRaw = getEl("interests")?.value.trim() || "";
  const climate = getEl("climate")?.value.trim() || "";
  const vibe = getEl("vibe")?.value || "";
  const tripType = getEl("tripType")?.value || "";
  const region = getEl("region")?.value || "";

  const interests = buildInterestsArray(interestsRaw);

  try {
    const data = await apiFetch("/recommendations", {
      method: "POST",
      auth: true,
      body: {
        budget,
        interests,
        climate,
        vibe,
        tripType,
        region
      }
    });

    const results = data.results || [];
    setMessage(`Showing top ${results.length} destinations`);
    renderRecommendations(results);
  } catch (err) {
    setMessage(err.message || "Failed to load recommendations.");
    if (resultsDiv) resultsDiv.innerHTML = "<p>Could not load recommendations.</p>";
  }
}

async function autoSearchFromQueryParams() {
  const params = getQueryParams();
  if (!params.toString()) return;
  await submitRecommendationSearch();
}

async function savePendingFavouriteAfterLogin() {
  const token = getToken();
  const pendingFavouriteId = localStorage.getItem("pendingFavouriteId");
  const pendingFavouriteSource = localStorage.getItem("pendingFavouriteSource");

  if (!token || !pendingFavouriteId || pendingFavouriteSource !== "explore") {
    return;
  }

  try {
    await apiFetch("/favourites", {
      method: "POST",
      auth: true,
      body: { destinationId: pendingFavouriteId }
    });

    localStorage.removeItem("pendingFavouriteId");
    localStorage.removeItem("pendingFavouriteSource");
    localStorage.removeItem("pendingFavouriteRedirect");

    setMessage("Destination saved to favourites.");
  } catch (err) {
    console.error("Pending favourite save failed:", err.message);

    // If it was already saved, clear pending state anyway
    if ((err.message || "").toLowerCase().includes("already")) {
      localStorage.removeItem("pendingFavouriteId");
      localStorage.removeItem("pendingFavouriteSource");
      localStorage.removeItem("pendingFavouriteRedirect");
      setMessage("Destination was already in favourites.");
    }
  }
}

function renderRecommendations(destinations = []) {
  if (!resultsDiv) return;

  resultsDiv.innerHTML = "";

  if (!destinations.length) {
    resultsDiv.innerHTML = "<p>No recommendations found.</p>";
    return;
  }

  destinations.forEach((d) => {
    const card = document.createElement("div");
    card.className = "resultCard";

    const whyHtml = d.why
      ? `<p><strong>Why recommended:</strong> ${d.why}</p>`
      : `<p><strong>Why recommended:</strong> Based on your selected preferences.</p>`;

    card.innerHTML = `
      <h3>${d.name}, ${d.country}</h3>
      <p><strong>Region:</strong> ${d.region || "-"}</p>
      <p><strong>Budget:</strong> ${d.budget || "-"}</p>
      <p><strong>Vibe:</strong> ${d.vibe || "-"}</p>
      <p><strong>Climate:</strong> ${d.climateType || "-"}</p>
      <p><strong>Tags:</strong> ${(d.tags || []).join(", ") || "-"}</p>
      <p><strong>Match score:</strong> ${d.score ?? "?"}</p>
      ${whyHtml}
      <button class="smallBtn favBtn">Save to favourites</button>
      <p class="status"></p>
    `;

    const favBtn = card.querySelector(".favBtn");
    const status = card.querySelector(".status");

    favBtn?.addEventListener("click", async () => {
      const token = getToken();

      if (!token) {
        localStorage.setItem("pendingFavouriteId", d._id);
        localStorage.setItem("pendingFavouriteSource", "explore");
        localStorage.setItem(
          "pendingFavouriteRedirect",
          window.location.pathname + window.location.search
        );

        if (status) status.textContent = "Please log in to save this destination.";
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 700);
        return;
      }

      if (status) status.textContent = "Saving...";

      try {
        await apiFetch("/favourites", {
          method: "POST",
          auth: true,
          body: { destinationId: d._id }
        });

        if (status) status.textContent = "Saved ✅";
        favBtn.disabled = true;
        favBtn.textContent = "Saved";
      } catch (err) {
        if (status) status.textContent = err.message || "Failed to save favourite.";
      }
    });

    resultsDiv.appendChild(card);
  });
}

logoutBtn?.addEventListener("click", () => {
  clearToken();
  localStorage.removeItem("pendingFavouriteId");
  localStorage.removeItem("pendingFavouriteSource");
  localStorage.removeItem("pendingFavouriteRedirect");
  window.location.href = "/login.html";
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await submitRecommendationSearch();
});

loadQueryParamsIntoForm();
loadSavedPreferences();
autoSearchFromQueryParams();
savePendingFavouriteAfterLogin();