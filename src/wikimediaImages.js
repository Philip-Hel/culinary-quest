// Wikimedia Commons image search — the keyless, free photo source for AI dishes.
//
// Unlike Google/Bing (legacy image APIs retired / tied to search engines), the
// Wikimedia API needs no key and no account. Searching Wikimedia Commons for a
// dish returns highly relevant, directly-hosted food photos. This is the default
// (open) image source; Openverse is the fallback (see deepseek.js).

const BASE = "https://commons.wikimedia.org/w/api.php";

// Search Wikimedia Commons for a food photo for a query. Returns a 640px image
// URL, or "" when nothing is found / on any failure.
export async function searchWikimediaFoodImage(query) {
  if (!query) return "";

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} food`,
    gsrnamespace: "6",
    gsrlimit: "5",
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
      return "";
    }
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});
    for (const page of pages) {
      const info = page?.imageinfo && page.imageinfo[0];
      const url = info && (info.thumburl || info.url);
      if (url) return url;
    }
    return "";
  } catch (err) {
    console.error("Wikimedia image search failed:", err);
    return "";
  }
}
