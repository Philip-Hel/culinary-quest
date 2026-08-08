// DeepSeek (LLM) recipe suggestion — an optional, AI-drafted recipe source.
//
// DeepSeek's API is OpenAI-compatible and PAID (no free tier). When a
// VITE_DEEPSEEK_API_KEY is present, the app asks the model for a random,
// region-appropriate dish for the chosen country and renders it alongside the
// real, verified recipes. Instructions are AI-written, so keep the verified
// sources as the primary pool (see App.jsx) — AI is an enhancement, not the
// source of truth. Without a key, every function here degrades gracefully.

const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
const BASE = "https://api.deepseek.com";
const MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || "deepseek-v4-flash";
import { searchWikimediaFoodImage } from "./wikimediaImages";

export const aiConfigured = Boolean(API_KEY);

// Shared chat completion call with a fetch timeout so slow reasoning-model
// replies can't hang the UI forever. Returns the raw assistant text, or "".
// maxTokens is generous because recipes are long (~700-800 tokens of JSON).
// Thinking mode is DISABLED below so the whole token budget goes to the recipe
// and replies are fast/cheap; too small a budget would still truncate the JSON.
async function chat(userPrompt, systemPrompt = "You are a food writer who knows world cuisines precisely.", maxTokens = 2000, temperature = 1.0) {
  if (!API_KEY) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000); // 45s ceiling
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        thinking: { type: "disabled" },
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("DeepSeek error:", res.status, res.statusText);
      return "";
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("DeepSeek request failed:", err);
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// Resolve a food photo for an AI dish from Openverse — a keyless API that
// aggregates millions of open-licensed images (Flickr, Wikimedia, etc.), far
// larger than any single food site. Searching by the dish name returns relevant
// results with a thumbnail URL we can drop straight into an <img>.
//
// To keep the photos food-only we (a) append a literal "food" tag to the query
// so the whole result set is food-weighted, and (b) prefer a result whose title
// carries a food signal (a dish word, or a common food term). If none look
// foody we still take the top-ranked result (already food-biased) rather than
// giving up, so a photo shows up from the big pool.
//
// Returns a thumbnail URL, or "" only when the request fails or returns nothing
// (RecipeCard then shows its themed placeholder).
async function fetchFoodImage(name) {
  const slug = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!slug) return "";

  // Try Wikimedia Commons first — free, keyless, and its food results are the
  // most relevant of the sources tried. Fall through to Openverse on a miss so
  // a photo still appears when possible.
  {
    const wikiUrl = await searchWikimediaFoodImage(slug);
    if (wikiUrl) return wikiUrl;
  }

  // Significant words from the dish, plus a broad set of food terms used to
  // recognise a food-looking title.
  const filler = new Set(["the", "a", "an", "of", "with", "and", "on", "in", "for"]);
  const dishWords = [...new Set(slug.split(" "))].filter((w) => w.length > 2 && !filler.has(w));
  const foodTerms = new Set([
    "food", "dish", "meal", "recipe", "cook", "cooking", "kitchen", "dinner", "lunch", "breakfast",
    "soup", "stew", "curry", "salad", "stir", "fry", "fried", "grill", "grilled", "bake", "baked",
    "roast", "roasted", "steak", "pork", "beef", "chicken", "beef", "fish", "shrimp", "prawn", "crab",
    "rice", "noodle", "noodles", "ramen", "pasta", "pizza", "bread", "cake", "cookie", "pie", "taco",
    "burrito", "sauce", "soup", "cheese", "sausage", "tofu", "veggie", "vegetable", "tomato", "potato",
    "egg", "eggs", "fruit", "ice", "chocolate", "spice", "spicy", "cream", "butter", "olive", "garlic",
  ]);
  const isFood = (title) => {
    const t = String(title || "").toLowerCase();
    // A title mentioning the dish (or a dish word) is a strong signal.
    if (dishWords.some((w) => t.includes(w))) return true;
    // Otherwise check every word of the title against known food terms, e.g.
    // "Pad Thai. #food #foodporn #thaifood" → matches "food".
    const words = t.split(/[^a-z]+/).filter(Boolean);
    return words.some((w) => foodTerms.has(w));
  };

  // Build candidate queries, most specific first. A fully specialised dish name
  // like "Taro with Coconut Milk (Ongngem)" can return nothing, so we retry with
  // fewer significant words (e.g. "taro coconut milk") until a food photo shows.
  const candidates = [dishWords.join(" ")];
  if (dishWords.length > 2) candidates.push(dishWords.slice(0, Math.ceil(dishWords.length / 2)).join(" "));
  if (dishWords.length > 1) candidates.push(dishWords[0]);

  for (const query of candidates) {
    try {
      const res = await fetch(
        `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query + " food")}&page_size=8&filter_dead=true`
      );
      if (!res.ok) {
        console.error("Openverse image search error:", res.status, res.statusText);
        return "";
      }
      const data = await res.json();
      const results = (data && data.results) || [];
      if (!results.length) continue;

      // Prefer a title that mentions the dish or reads as food; fall back to the
      // top-ranked (already food-weighted) result so we rarely show a placeholder.
      const pick = results.find((r) => isFood(r.title)) || results[0];
      return pick.thumbnail || pick.url || "";
    } catch (err) {
      console.error("Openverse image search failed:", err);
      return "";
    }
  }
  return "";
}

// Ask DeepSeek for a dish for a country. `exclude` lists dish names the user
// has already seen for this country; a higher temperature + the exclusion list
// push the model toward something genuinely different. Returns the recipe in
// the app's shape with source "deepseek", or null on any failure.
export async function suggestAIDish({ name, region, subregion, exclude = [], stronglyDifferent = false }) {
  const context = [name, region, subregion].filter(Boolean).join(" · ");
  const lines = [
    `Pick one specific, authentic dish for ${context}.`,
    "Return ONLY valid JSON with exactly these keys:",
    '{"name": string, "ingredients": string[], "instructions": string}.',
    "Choose a dish that is true to the local cuisine. Use a less famous, still-common dish to vary the selection.",
  ];
  if (stronglyDifferent) {
    lines.push("The user found the earlier suggestions repetitive. Avoid famous/obvious choices and pick a clearly DIFFERENT regional dish.");
  }
  if (exclude.length) {
    lines.push(`Already shown to the user (AVOID returning any of these exact dishes): ${exclude.join(", ")}.`);
  } else {
    lines.push("(No prior dishes shown yet — pick the most emblematic dish.)");
  }
  lines.push("Do not include any text outside the JSON.");
  const prompt = lines.join(" ");

  // Higher temperature to reduce repetition, plus a random jitter to vary the
  // model's pick across calls for the same country.
  const temperature = 1.1 + (Math.random() * 0.3);
  const text = await chat(prompt, undefined, 2000, temperature);
  const json = extractJson(text);
  if (!json) return null;
  const dishName = String(json.name || "").trim();
  return {
    idMeal: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    strMeal: dishName,
    strMealThumb: await fetchFoodImage(dishName), // "" → themed placeholder
    strInstructions: String(json.instructions || "").trim(),
    strIngredients: Array.isArray(json.ingredients) ? json.ingredients : [],
    strCategory: region || "AI-suggested",
    strTags: "AI-generated",
    source: "deepseek",
  };
}

// Tweak an existing recipe with AI (e.g. make it vegetarian / spicier / fewer
// ingredients). Asks the model to revise the current dish while keeping its name
// and origin, and returns a full updated recipe (source stays "deepseek" so the
// RecipeCard can mark it "AI-tweaked"). Returns null on any failure.
export async function tweakRecipeWithAI(recipe, instruction) {
  if (!recipe || !instruction) return null;

  const current = {
    name: recipe.strMeal,
    ingredients: Array.isArray(recipe.strIngredients) ? recipe.strIngredients : [],
    instructions: recipe.strInstructions || "",
  };
  const prompt = [
    `Revise the following recipe so that it is: ${instruction}.`,
    "Return ONLY valid JSON with exactly these keys:",
    '{"name": string, "ingredients": string[], "instructions": string}.',
    "Keep the same dish name and cuisine tradition; adjust only the ingredients and method to satisfy the request.",
    "Do not include any text outside the JSON.",
    "CURRENT RECIPE:",
    JSON.stringify(current),
  ].join("\n");

  const text = await chat(prompt);
  const json = extractJson(text);
  if (!json) return null;

  const tweakedName = String(json.name || recipe.strMeal).trim();
  return {
    ...recipe,
    idMeal: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    strMeal: tweakedName,
    strMealThumb: recipe.strMealThumb || (await fetchFoodImage(tweakedName)),
    strIngredients: Array.isArray(json.ingredients) ? json.ingredients : (recipe.strIngredients || []),
    strInstructions: String(json.instructions || recipe.strInstructions).trim(),
    strCategory: recipe.strCategory || "AI-suggested",
    strTags: "AI-tweaked",
    source: "deepseek",
  };
}

// Pull the first JSON object out of a model reply (it may wrap in fences).
function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
