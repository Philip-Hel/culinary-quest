// Edamam — the third, optional recipe source.
//
// Edamam offers a large multilingual recipe database with real regional
// coverage (vs TheMealDB's ~300 recipes). Like Spoonacular, it requires a free
// developer account — you get an application ID and key from
// https://developer.edamam.com. Credentials are read from the environment
// (VITE_EDAMAM_APP_ID / VITE_EDAMAM_APP_KEY) so nothing is committed. If either
// is missing, these helpers return empty arrays and the app silently falls back
// to TheMealDB + Spoonacular.

const APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || "";
const APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY || "";
const BASE = "https://api.edamam.com/api/recipes/v2";

export const edamamConfigured = Boolean(APP_ID && APP_KEY);

// Search Edamam for recipes by a keyword + optional cuisine filter.
// Returns a normalized list: [{ idMeal, strMeal, strMealThumb, source, ...full }]
// Edamam returns complete recipe objects (ingredients, yield, totalTime) right
// in search results, so we build the full detail payload here — no 2nd call.
export async function searchEdamamRecipes(keyword, cuisineType, to = 20) {
  if (!APP_ID || !APP_KEY) return [];
  if (!keyword) return [];

  const params = new URLSearchParams({
    type: "public",
    q: keyword,
    app_id: APP_ID,
    app_key: APP_KEY,
    to: String(to),
  });
  if (cuisineType) params.set("cuisineType", cuisineType);

  try {
    const res = await fetch(`${BASE}?${params}`);
    if (!res.ok) {
      console.error("Edamam error:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const hits = data?.hits || [];
    return hits
      .map((h) => h?.recipe)
      .filter(Boolean)
      .map((r) => ({
        idMeal: r.uri, // Edamam recipes are identified by their resource URI
        strMeal: r.label,
        strMealThumb: r.image,
        strInstructions: r.instructions || r.source || "",
        strIngredients: (r.ingredientLines || []).filter(Boolean),
        strCategory: (r.cuisineType || [])[0] || (r.dishType || [])[0],
        strTags: (r.dishType || []).join(", "),
        strYield: r.yield,
        strTime: r.totalTime,
        source: "edamam",
      }));
  } catch (err) {
    console.error("Edamam search failed:", err);
    return [];
  }
}
