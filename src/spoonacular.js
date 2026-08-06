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

// Broadened multi-angle search: query a country's cuisine AND, when that
// cuisine is thin, also query a couple of signature-ingredient keywords (e.g.
// Nigeria → "okra", "plantain") and merge + de-duplicate. Rich cuisines cost
// one call; thin ones spend more of the quota to broaden the pool.
//
// Spoonacular free tier = 50 points/day. Each complexSearch call costs ~1 pt +
// 0.01/result (≈1.07 pts at number=15). With the adaptive logic below a pick is
// usually 1–3 calls ≈ 1–3.2 pts ≈ ~16–45+ country picks/day. Raise `maxCalls`
// (and/or `number`) only if you also raise the plan.
export async function searchRecipesMulti({ cuisine, keywords = [], number = 15, maxCalls = 3 }) {
  if (!API_KEY) return [];

  const queries = [];
  if (cuisine) queries.push({ cuisine });
  // Rotate the keyword list every pick so a given country surfaces a different
  // signature dish on each visit rather than always querying the same one.
  const keywordSlots = maxCalls - 1;
  if (keywordSlots > 0 && keywords.length > 0) {
    const offset = keywords.join(" ").length % keywords.length;
    for (let i = 0; i < keywordSlots; i++) {
      const kw = keywords[(offset + i) % keywords.length];
      if (kw) queries.push({ query: kw });
    }
  }

  const seen = new Set();
  const out = [];
  const usedCalls = [];
  for (let qi = 0; qi < queries.length; qi++) {
    const q = queries[qi];
    // Adaptive: if the very first (cuisine) call already returned a healthy
    // pool, stop — no need to burn quota on keywords for a well-covered cuisine.
    if (qi > 0 && out.length >= Math.min(number, 15)) break;

    const params = new URLSearchParams({
      number: String(number),
      offset: "0",
      apiKey: API_KEY,
    });
    if (q.cuisine) params.set("cuisine", q.cuisine);
    if (q.query) params.set("query", q.query);

    try {
      const res = await fetch(`${BASE}/recipes/complexSearch?${params}`);
      if (!res.ok) continue;
      const data = await res.json();
      const results = data?.results || [];
      usedCalls.push({ q, got: results.length });
      for (const r of results) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        out.push({ id: r.id, title: r.title, image: r.image, source: "spoonacular" });
      }
    } catch (err) {
      console.error("Spoonacular multi-search failed:", err);
    }
  }
  // Log a compact trace so quota usage is observable in the console.
  console.info(
    "Spoonacular multi-search:",
    usedCalls.map((c) => `${c.q.cuisine || c.q.query}(${c.got})`).join(" + "),
    "→",
    out.length,
    "unique"
  );
  return out;
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
