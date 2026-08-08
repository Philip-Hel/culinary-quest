// Bing Image Search API — an optional image source for AI dishes.
//
// Unlike Google's Custom Search API, Bing's image API needs NO search engine:
// a single Azure subscription key lets you search the whole web's images for a
// free-form food query and get relevant, website-ready image URLs. Free tier is
// ~1000 transactions/month (roughly 1,000 image searches — plenty here).
//
// Configure by creating a "Bing Search v7" resource in the Azure Portal and
// copying one of its keys into the environment (never committed):
//   VITE_BING_SUBSCRIPTION_KEY
// If it's missing, these helpers return "" and the app falls back to Openverse
// without error — exactly like Spoonacular / DeepSeek.

const KEY = import.meta.env.VITE_BING_SUBSCRIPTION_KEY || "";
const BASE = "https://api.bing.microsoft.com/v7.0/images/search";

export const bingImagesConfigured = Boolean(KEY);

// Search Bing for a relevant image URL for a food query. Returns the top
// result's image URL, or "" when not configured / on any failure.
export async function searchBingImage(query) {
  if (!bingImagesConfigured) return "";
  if (!query) return "";

  const params = new URLSearchParams({
    q: query,
    count: "5",
    safeSearch: "Moderate",
  });

  try {
    const res = await fetch(`${BASE}?${params}`, {
      headers: { "Ocp-Apim-Subscription-Key": KEY },
    });
    if (!res.ok) {
      console.error("Bing image error:", res.status, res.statusText);
      return "";
    }
    const data = await res.json();
    const item = data?.value && data.value[0];
    // Prefer a directly-usable image URL; fall back to the thumbnail.
    return (item && (item.contentUrl || item.thumbnailUrl)) || "";
  } catch (err) {
    console.error("Bing image search failed:", err);
    return "";
  }
}
