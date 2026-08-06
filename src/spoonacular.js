// Spoonacular integration — the second (much larger) recipe source.
//
// Spoonacular recognises its own cuisine vocabulary and returns thousands of
// recipes, vs TheMealDB's ~300. The API key is read from the environment
// (VITE_SPOONACULAR_API_KEY) so it is never committed. If no key is present,
// these helpers return empty arrays and the app falls back to TheMealDB +
// category fallback without error.

const API_KEY = import.meta.env.VITE_SPOONACULAR_API_KEY || "";
const BASE = "https://api.spoonacular.com";

// Search for recipes by cuisine. Returns a normalized meal array:
// [{ id, title, image, source: "spoonacular" }]
export async function searchRecipesByCuisine(cuisine, number = 25) {
  if (!API_KEY) return [];

  const params = new URLSearchParams({
    cuisine: cuisine.toLowerCase().replace("/", " "),
    number: String(number),
    offset: "0",
    apiKey: API_KEY,
  });

  try {
    const res = await fetch(`${BASE}/recipes/complexSearch?${params}`);
    if (!res.ok) {
      console.error("Spoonacular error:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    const results = data?.results || [];
    return results.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      source: "spoonacular",
    }));
  } catch (err) {
    console.error("Spoonacular search failed:", err);
    return [];
  }
}

// Fetch full instructions for a single Spoonacular recipe, normalized to the
// same shape the RecipeCard expects ({ title, image, instructions }).
// Uses the richer `information` endpoint.
export async function fetchSpoonacularRecipeDetails(id) {
  if (!API_KEY) return null;

  try {
    const res = await fetch(
      `${BASE}/recipes/${id}/information?apiKey=${API_KEY}`
    );
    if (!res.ok) {
      console.error("Spoonacular details error:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
  const instructions = (data.instructions || "")
    // Spoonacular returns HTML; strip tags and decode a few entities to plain text.
    .replace(/<[^>]*>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n");

  return {
    idMeal: String(data.id),
    strMeal: data.title,
    strMealThumb: data.image,
    strInstructions: instructions,
    // Spoonacular "information" exposes structured ingredients.
    strIngredients: (data.extendedIngredients || []).map((ing) => ing.original),
    strCategory: (data.cuisines || [])[0] || undefined,
    strTags: (data.diets || []).join(", "),
    source: "spoonacular",
  };
  } catch (err) {
    console.error("Spoonacular details failed:", err);
    return null;
  }
}
