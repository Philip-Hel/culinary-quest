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
// Returns a thumbnail URL, or "" when the request fails so RecipeCard falls
// back to its themed placeholder. We take the best-ranked relevant result, and
// prefer one whose title echoes the dish so the photo generally matches.
async function fetchFoodImage(name) {
  const slug = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!slug) return "";

  // The significant words to gauge title relevance (drop tiny filler words).
  const filler = new Set(["the", "a", "an", "of", "with", "and", "on", "in", "for"]);
  const dishWords = [...new Set(slug.split(" "))].filter((w) => w.length > 2 && !filler.has(w));
  const prefers = (title) =>
    dishWords.length > 0 &&
    dishWords.some((w) => String(title || "").toLowerCase().includes(w));

  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(slug)}&page_size=6&filter_dead=true`
    );
    if (!res.ok) {
      console.error("Openverse image search error:", res.status, res.statusText);
      return "";
    }
    const data = await res.json();
    const results = (data && data.results) || [];
    if (!results.length) return "";

    // Prefer a result whose title actually mentions the dish; otherwise take
    // Openverse's top-ranked result (still relevant in the big pool).
    const pick = results.find((r) => prefers(r.title)) || results[0];
    return pick.thumbnail || pick.url || "";
  } catch (err) {
    console.error("Openverse image search failed:", err);
    return "";
  }
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
