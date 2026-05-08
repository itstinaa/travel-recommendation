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

function clean(value = "") {
  return String(value).trim().toLowerCase();
}

function buildInterestsArray(interestsRaw) {
  return interestsRaw
    ? interestsRaw.split(",").map((s) => clean(s)).filter(Boolean)
    : [];
}

function setMessage(text) {
  if (msg) msg.textContent = text;
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

function getSelectedRegionLabel(region) {
  if (!region) return "";

  const regionSelect = getEl("region");
  const selectedOption = regionSelect?.querySelector(`option[value="${region}"]`);

  return selectedOption?.textContent || region;
}

async function loadSavedPreferences() {
  try {
    const user = await apiFetch("/user/profile", { auth: true });
    const prefs = user.preferences || {};

    if (prefs.budget && getEl("budget")) getEl("budget").value = clean(prefs.budget);

    if (prefs.interests && getEl("interests")) {
      getEl("interests").value = prefs.interests.join(", ");
    }

    if (prefs.climate && getEl("climate")) getEl("climate").value = clean(prefs.climate);
    if (prefs.vibe && getEl("vibe")) getEl("vibe").value = clean(prefs.vibe);
    if (prefs.tripType && getEl("tripType")) getEl("tripType").value = clean(prefs.tripType);
    if (prefs.region && getEl("region")) getEl("region").value = clean(prefs.region);
  } catch (err) {
    console.error("Could not load saved preferences:", err.message);
  }
}

function loadQueryParamsIntoForm() {
  const params = getQueryParams();

  const q = params.get("q") || "";
  const climate = clean(params.get("climate") || "");
  const vibe = clean(params.get("vibe") || "");
  const budget = clean(params.get("budget") || "");
  const tripType = clean(params.get("tripType") || "");
  const region = clean(params.get("region") || "");

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

  const budget = clean(getEl("budget")?.value || "");
  const interestsRaw = getEl("interests")?.value || "";
  const climate = clean(getEl("climate")?.value || "");
  const vibe = clean(getEl("vibe")?.value || "");
  const tripType = clean(getEl("tripType")?.value || "");
  const region = clean(getEl("region")?.value || "");

  const interests = buildInterestsArray(interestsRaw);
  const regionLabel = getSelectedRegionLabel(region);

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

    if (region && results.length) {
      setMessage(`Showing ${results.length} destinations in ${regionLabel}`);
    } else if (region && !results.length) {
      setMessage(`No destinations found in ${regionLabel}. Try another region or add more destinations.`);
    } else if (!results.length) {
      setMessage("No recommendations found. Try changing your filters.");
    } else {
      setMessage(`Showing top ${results.length} destinations`);
    }

    renderRecommendations(results);
  } catch (err) {
    setMessage(err.message || "Failed to load recommendations.");

    if (resultsDiv) {
      resultsDiv.innerHTML = "<p>Could not load recommendations.</p>";
    }
  }
}

async function loadDestinationInfo(destinationId, box) {
  if (!box) return;

  box.innerHTML = "<p>Loading destination information...</p>";

  try {
    const data = await apiFetch(`/wikimedia/destination/${destinationId}`);

    const summary = data.summary;

    if (!summary) {
      box.innerHTML = "<p>No destination information found.</p>";
      return;
    }

    box.innerHTML = `
      <div class="wiki-card">
        ${
          summary.image
            ? `<img src="${esc(summary.image)}" alt="${esc(summary.title)}">`
            : ""
        }

        <h4>${esc(summary.title)}</h4>

        ${
          summary.description
            ? `<p><strong>${esc(summary.description)}</strong></p>`
            : ""
        }

        <p>${esc(summary.extract)}</p>

        ${
          summary.pageUrl
            ? `<a href="${esc(summary.pageUrl)}" target="_blank">Read more on Wikipedia</a>`
            : ""
        }
      </div>
    `;
  } catch (err) {
    box.innerHTML = `<p>${esc(err.message || "Failed to load destination information.")}</p>`;
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

    const tags = Array.isArray(d.tags) ? d.tags : [];

    const whyHtml = d.why
      ? `<p><strong>Why recommended:</strong> ${esc(d.why)}</p>`
      : `<p><strong>Why recommended:</strong> Based on your selected preferences.</p>`;

    const tagHtml = tags.length
      ? `<div class="tagRow">${tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>`
      : `<p><strong>Tags:</strong> -</p>`;

    card.innerHTML = `
      <h3>${esc(d.name)}, ${esc(d.country)}</h3>

      <p><strong>Region:</strong> ${esc(d.region || "-")}</p>
      <p><strong>Budget:</strong> ${esc(d.budget || "-")}</p>
      <p><strong>Vibe:</strong> ${esc(d.vibe || "-")}</p>
      <p><strong>Climate:</strong> ${esc(d.climateType || "-")}</p>

      ${tagHtml}

      <p><strong>Match score:</strong> ${esc(d.score ?? "?")}</p>
      ${whyHtml}

      <div class="resultActions">
        <button class="smallBtn favBtn">Save to favourites</button>
        <button class="smallBtn secondary infoBtn">View destination info</button>
      </div>

      <div class="wikiBox"></div>
      <p class="status"></p>
    `;

    const favBtn = card.querySelector(".favBtn");
    const infoBtn = card.querySelector(".infoBtn");
    const wikiBox = card.querySelector(".wikiBox");
    const status = card.querySelector(".status");

    infoBtn?.addEventListener("click", async () => {
      if (!wikiBox) return;

      const isOpen = wikiBox.dataset.open === "true";

      if (isOpen) {
        wikiBox.innerHTML = "";
        wikiBox.dataset.open = "false";
        infoBtn.textContent = "View destination info";
        return;
      }

      wikiBox.dataset.open = "true";
      infoBtn.textContent = "Hide destination info";

      await loadDestinationInfo(d._id, wikiBox);
    });

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
        if (status) {
          status.textContent = err.message || "Failed to save favourite.";
        }
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