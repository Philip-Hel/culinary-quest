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

// Ask DeepSeek for one random, region-appropriate dish for a country, returned
// as strict JSON. Returns the recipe in the app's shape with source "deepseek",
// or null on any failure / missing key / unparseable reply.
export async function suggestAIDish({ name, region, subregion }) {
  if (!API_KEY) return null;

  const context = [name, region, subregion].filter(Boolean).join(" · ");
  const prompt = [
    `Pick one specific, authentic dish for ${context}.`,
    "Return ONLY valid JSON with exactly these keys:",
    '{"name": string, "ingredients": string[], "instructions": string}.',
    "Prefer a well-known national dish with a short, accurate method.",
    "Do not include any text outside the JSON.",
  ].join(" ");

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: "You are a food writer who knows world cuisines precisely." },
      { role: "user", content: prompt },
    ],
    temperature: 1.0,
    max_tokens: 400,
    response_format: { type: "text" },
  };

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("DeepSeek error:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    const json = extractJson(text);
    if (!json) {
      console.error("DeepSeek: could not parse JSON reply");
      return null;
    }
    return {
      idMeal: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      strMeal: String(json.name || "").trim(),
      strInstructions: String(json.instructions || "").trim(),
      strIngredients: Array.isArray(json.ingredients) ? json.ingredients : [],
      strCategory: region || "AI-suggested",
      strTags: "AI-generated",
      source: "deepseek",
    };
  } catch (err) {
    console.error("DeepSeek request failed:", err);
    return null;
  }
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
