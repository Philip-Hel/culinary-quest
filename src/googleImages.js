// Google Custom Search (Programmable Search Engine) — an optional image source
// for AI dishes, used only when the user has configured it. It gives better,
// more relevant photos than the keyless Openverse pool.
//
// Configure by creating a Programmable Search Engine (any site can be empty;
// set "Search the entire web"), then enabling the "Custom Search JSON API" and
// creating an API key. Put both in the environment (never committed):
//   VITE_GOOGLE_CSE_KEY
//   VITE_GOOGLE_CSE_ID
// If either is missing these helpers return "" and the app falls back to
// Openverse without error — exactly like Spoonacular / DeepSeek.

const API_KEY = import.meta.env.VITE_GOOGLE_CSE_KEY || "";
const CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID || "";
const BASE = "https://www.googleapis.com/customsearch/v1";

export const googleImagesConfigured = Boolean(API_KEY && CSE_ID);

// Search Google for an image URL for a food query. Returns the top result's
// image URL, or "" when not configured / on any failure. Filters by the
// "images" type (tbm=isch equivalent) and asks for square-ish image results.
export async function searchGoogleImage(query) {
  if (!googleImagesConfigured) return "";
  if (!query) return "";

  const params = new URLSearchParams({
    key: API_KEY,
    cx: CSE_ID,
    q: query,
    searchType: "image",
    num: "3",
    imgType: "photo",
    safe: "moderate",
  });

  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) {
      console.error("Google CSE error:", res.status, res.statusText);
      return "";
    }
    const data = await res.json();
    return (data?.items && data.items[0]?.link) || "";
  } catch (err) {
    console.error("Google CSE search failed:", err);
    return "";
  }
}
