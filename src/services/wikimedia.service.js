const WIKIPEDIA_BASE_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";

async function fetchJson(url, errorMessage) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TravelRecommendationApp/1.0"
    }
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.error("Wikimedia status:", response.status);
    console.error("Wikimedia response:", data);

    throw new Error(errorMessage);
  }

  return data;
}

function buildSearchTitles(destination) {
  const titles = [];

  if (destination.city && destination.country) {
    titles.push(`${destination.city}, ${destination.country}`);
  }

  if (destination.name && destination.country) {
    titles.push(`${destination.name}, ${destination.country}`);
  }

  if (destination.name) {
    titles.push(destination.name);
  }

  if (destination.city) {
    titles.push(destination.city);
  }

  if (destination.country) {
    titles.push(destination.country);
  }

  return [...new Set(titles.filter(Boolean))];
}

export async function getWikipediaSummary(destination) {
  const titles = buildSearchTitles(destination);

  for (const title of titles) {
    try {
      const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));

      const data = await fetchJson(
        `${WIKIPEDIA_BASE_URL}/${encodedTitle}`,
        `Could not find Wikipedia summary for ${title}`
      );

      if (data.extract) {
        return {
          title: data.title || title,
          description: data.description || "",
          extract: data.extract || "",
          image: data.thumbnail?.source || data.originalimage?.source || "",
          pageUrl: data.content_urls?.desktop?.page || "",
          searchedTitle: title
        };
      }
    } catch (err) {
      console.log(`Wikipedia lookup failed for: ${title}`);
    }
  }

  return {
    title: destination.name,
    description: "",
    extract: "No Wikipedia summary found for this destination.",
    image: "",
    pageUrl: "",
    searchedTitle: destination.name
  };
}