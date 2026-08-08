// Fetch a short country profile (representative photo, one-line description,
// and a 1-2 sentence summary) from Wikipedia's keyless REST API.
//
// Keyless and free — mirrors the project's "fail soft" pattern: on any error we
// log to console.error and return an empty object, so a missing or broken
// profile never breaks the UI. The country panel degrades to flag + facts.

export async function fetchCountryProfile(name) {
  if (!name) return {};
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    if (!res.ok) {
      console.error("Wikipedia profile error:", res.status, res.statusText);
      return {};
    }
    const data = await res.json();
    return {
      thumbnail: data.thumbnail && data.thumbnail.source,
      description: data.description,
      extract: data.extract,
    };
  } catch (err) {
    console.error("Failed to fetch country profile:", err);
    return {};
  }
}
