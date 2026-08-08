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
// maxTokens is generous because DeepSeek's reasoning model spends output tokens
// "thinking" before producing the final JSON (a full recipe can be ~700-800
// tokens); too small a budget silently truncates the reply to unparseable JSON.
async function chat(userPrompt, systemPrompt = "You are a food writer who knows world cuisines precisely.", maxTokens = 2000) {
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
        temperature: 1.0,
        max_tokens: maxTokens,
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

// Ask DeepSeek for one random, region-appropriate dish for a country, returned
// as strict JSON. Returns the recipe in the app's shape with source "deepseek",
// or null on any failure / missing key / unparseable reply.
export async function suggestAIDish({ name, region, subregion }) {
  const context = [name, region, subregion].filter(Boolean).join(" · ");
  const prompt = [
    `Pick one specific, authentic dish for ${context}.`,
    "Return ONLY valid JSON with exactly these keys:",
    '{"name": string, "ingredients": string[], "instructions": string}.',
    "Prefer a well-known national dish with a short, accurate method.",
    "Do not include any text outside the JSON.",
  ].join(" ");

  const text = await chat(prompt);
  const json = extractJson(text);
  if (!json) return null;
  return {
    idMeal: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    strMeal: String(json.name || "").trim(),
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

  return {
    ...recipe,
    idMeal: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    strMeal: String(json.name || recipe.strMeal).trim(),
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
