// Wikimedia Commons image search — the keyless, free photo source for AI dishes.
//
// Unlike Google/Bing (legacy image APIs retired / tied to search engines), the
// Wikimedia API needs no key and no account. Searching Wikimedia Commons for a
// dish returns highly relevant, directly-hosted food photos. This is the default
// (open) image source; Openverse is the fallback (see deepseek.js).

const BASE = "https://commons.wikimedia.org/w/api.php";

// Search Wikimedia Commons for food photos for a query. Returns an array of up
// to `limit` distinct 640px image URLs (best matches first), or [] when nothing
// is found / on failure.
export async function searchWikimediaFoodImages(query, limit = 4) {
  if (!query) return [];

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} food`,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "640",
    format: "json",
    origin: "*", // required by Wikimedia for anonymous CORS
  });

  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) {
      console.error("Wikimedia image error:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    const urls = [];
    for (const page of pages) {
      const info = page?.imageinfo && page.imageinfo[0];
      const url = info && (info.thumburl || info.url);
      if (url && !urls.includes(url)) urls.push(url);
      if (urls.length >= limit) break;
    }
    return urls;
  } catch (err) {
    console.error("Wikimedia image search failed:", err);
    return [];
  }
}

// Single-image convenience (first Wikimedia result, or "" when none).
export async function searchWikimediaFoodImage(query) {
  const urls = await searchWikimediaFoodImages(query, 1);
  return urls[0] || "";
}
