requireAuthOrRedirect();

const form = document.getElementById("prefsForm");
const msg = document.getElementById("msg");
const resultsDiv = document.getElementById("results");
const logoutBtn = document.getElementById("logoutBtn");

let allDestinations = [];

const fallbackCountries = [
  "Argentina",
  "Australia",
  "Brazil",
  "Canada",
  "Egypt",
  "France",
  "Greece",
  "Iceland",
  "Indonesia",
  "Italy",
  "Japan",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Thailand",
  "UAE",
  "United Kingdom",
  "USA"
];

const fallbackCities = [
  "Amsterdam",
  "Athens",
  "Auckland",
  "Bali",
  "Bangkok",
  "Barcelona",
  "Buenos Aires",
  "Cairo",
  "Cancun",
  "Cape Town",
  "Dubai",
  "Edinburgh",
  "Kyoto",
  "London",
  "Los Angeles",
  "Madrid",
  "Marrakech",
  "Melbourne",
  "Mexico City",
  "Miami",
  "New York",
  "Paris",
  "Phuket",
  "Reykjavik",
  "Rio de Janeiro",
  "Rome",
  "Santorini",
  "Seoul",
  "Singapore",
  "Sydney",
  "Tokyo",
  "Toronto",
  "Vancouver",
  "Venice"
];

function getEl(id) {
  return document.getElementById(id);
}

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function clean(value = "") {
  return String(value).trim().toLowerCase();
}

function titleCase(value = "") {
  return String(value)
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function populateSelect(selectId, values, defaultText) {
  const select = getEl(selectId);
  if (!select) return;

  const oldValue = select.value;

  select.innerHTML = `<option value="">${defaultText}</option>`;

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = clean(value);
    option.textContent = value;
    select.appendChild(option);
  });

  if ([...select.options].some(option => option.value === oldValue)) {
    select.value = oldValue;
  }
}

async function loadDestinationOptions() {
  try {
    allDestinations = await apiFetch("/destinations");

    populateCountryOptions();
    populateCityOptions();
  } catch (err) {
    console.error("Could not load countries and cities:", err.message);

    populateCountryOptions();
    populateCityOptions();

    setMessage("Using default country and city options.");
  }
}

function populateCountryOptions() {
  const selectedRegion = clean(getEl("region")?.value || "");

  let filtered = allDestinations;

  if (selectedRegion) {
    filtered = filtered.filter(d => clean(d.region) === selectedRegion);
  }

  const databaseCountries = filtered.map(d => d.country);
  const countries = uniqueSorted([...fallbackCountries, ...databaseCountries]);

  populateSelect("country", countries, "Any country");
}

function populateCityOptions() {
  const selectedRegion = clean(getEl("region")?.value || "");
  const selectedCountry = clean(getEl("country")?.value || "");

  let filtered = allDestinations;

  if (selectedRegion) {
    filtered = filtered.filter(d => clean(d.region) === selectedRegion);
  }

  if (selectedCountry) {
    filtered = filtered.filter(d => clean(d.country) === selectedCountry);
  }

  const databaseCities = filtered.map(d => d.city || d.name);
  const cities = uniqueSorted([...fallbackCities, ...databaseCities]);

  populateSelect("city", cities, "Any city");
}

function getSelectedLabel(selectId, fallback = "") {
  const select = getEl(selectId);
  const selected = select?.options[select.selectedIndex];

  return selected?.textContent || fallback;
}

async function loadSavedPreferences() {
  try {
    const user = await apiFetch("/user/profile", { auth: true });
    const prefs = user.preferences || {};

    if (prefs.budget && getEl("budget")) getEl("budget").value = clean(prefs.budget);
    if (prefs.climate && getEl("climate")) getEl("climate").value = clean(prefs.climate);
    if (prefs.vibe && getEl("vibe")) getEl("vibe").value = clean(prefs.vibe);
    if (prefs.tripType && getEl("tripType")) getEl("tripType").value = clean(prefs.tripType);
    if (prefs.region && getEl("region")) getEl("region").value = clean(prefs.region);

    populateCountryOptions();

    if (prefs.country && getEl("country")) getEl("country").value = clean(prefs.country);

    populateCityOptions();

    if (prefs.city && getEl("city")) getEl("city").value = clean(prefs.city);

    if (prefs.interests && getEl("interests")) {
      getEl("interests").value = prefs.interests.join(", ");
    }
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
  const country = clean(params.get("country") || "");
  const city = clean(params.get("city") || "");

  if (q && getEl("interests")) getEl("interests").value = q;
  if (climate && getEl("climate")) getEl("climate").value = climate;
  if (vibe && getEl("vibe")) getEl("vibe").value = vibe;
  if (budget && getEl("budget")) getEl("budget").value = budget;
  if (tripType && getEl("tripType")) getEl("tripType").value = tripType;
  if (region && getEl("region")) getEl("region").value = region;

  populateCountryOptions();

  if (country && getEl("country")) getEl("country").value = country;

  populateCityOptions();

  if (city && getEl("city")) getEl("city").value = city;
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
  const country = clean(getEl("country")?.value || "");
  const city = clean(getEl("city")?.value || "");

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
        region,
        country,
        city
      }
    });

    const results = data.results || [];

    if (!results.length) {
      setMessage("No destinations found. Try changing your filters.");
    } else if (city) {
      setMessage(`Showing ${results.length} destination(s) in ${getSelectedLabel("city", city)}.`);
    } else if (country) {
      setMessage(`Showing ${results.length} destination(s) in ${getSelectedLabel("country", country)}.`);
    } else if (region) {
      setMessage(`Showing ${results.length} destination(s) in ${getSelectedLabel("region", region)}.`);
    } else {
      setMessage(`Showing top ${results.length} destinations.`);
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
        ${summary.image ? `<img src="${esc(summary.image)}" alt="${esc(summary.title)}">` : ""}

        <h4>${esc(summary.title)}</h4>

        ${summary.description ? `<p><strong>${esc(summary.description)}</strong></p>` : ""}

        <p>${esc(summary.extract)}</p>

        ${summary.pageUrl ? `<a href="${esc(summary.pageUrl)}" target="_blank">Read more on Wikipedia</a>` : ""}
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
      <h3>${esc(d.city || d.name)}, ${esc(d.country)}</h3>

      <p><strong>Country:</strong> ${esc(d.country || "-")}</p>
      <p><strong>City:</strong> ${esc(d.city || d.name || "-")}</p>
      <p><strong>Region:</strong> ${esc(titleCase(d.region || "-"))}</p>
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

getEl("region")?.addEventListener("change", () => {
  populateCountryOptions();
  populateCityOptions();
});

getEl("country")?.addEventListener("change", () => {
  populateCityOptions();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await submitRecommendationSearch();
});

async function initExplorePage() {
  populateCountryOptions();
  populateCityOptions();

  await loadDestinationOptions();
  loadQueryParamsIntoForm();
  await loadSavedPreferences();
  await autoSearchFromQueryParams();
  await savePendingFavouriteAfterLogin();
}

initExplorePage();