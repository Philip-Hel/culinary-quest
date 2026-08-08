// Favorite/saved recipes.
//
// Stored in localStorage (works everywhere, offline, dev/static) AND synced to
// the server when the deployed server (server.mjs /api/favorites) is available.
// The server copy makes saved recipes durable across devices/browser wipes and
// lives in a folder that can be backed up.
//
// A saved recipe is the full recipe object PLUS the country/region metadata it
// was picked from, so the Favorites view can search by country or cuisine.

const KEY = "culinary-quest-favorites";
const API = "/api/favorites"; // served by server.mjs when deployed

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (err) {
    console.error("Could not persist favorites:", err);
  }
}

// Stable id used to detect duplicates across sources.
export function favoriteId(r) {
  return `${r.source || "mealdb"}:${r.idMeal}`;
}

// Add a recipe if not already saved (local-first, then best-effort server sync).
export function addFavorite(recipe, meta = {}) {
  const list = load();
  const id = favoriteId(recipe);
  if (!list.some((f) => favoriteId(f) === id)) {
    list.push({
      ...recipe,
      _favId: id,
      _country: meta.country,
      _region: meta.region,
      _subregion: meta.subregion,
      _cuisine: meta.cuisine,
      _savedAt: Date.now(),
    });
    save(list);
    syncToServer(list);
  }
  return list;
}

// Source-aware removal that accepts either a full recipe or its _favId.
export function removeFavorite(recipeOrFavId) {
  const favId =
    typeof recipeOrFavId === "string"
      ? recipeOrFavId
      : recipeOrFavId?._favId || favoriteId(recipeOrFavId);
  const list = load().filter((f) => f._favId !== favId);
  save(list);
  syncToServer(list);
  return list;
}

export function getFavorites() {
  return load();
}

// Source-aware check: does a recipe (by its stable key) already exist?
export function isFavorite(recipeOrFavId) {
  const favId =
    typeof recipeOrFavId === "string"
      ? recipeOrFavId
      : recipeOrFavId?._favId || favoriteId(recipeOrFavId);
  return load().some((f) => f._favId === favId);
}

// best-effort: push the whole list to the server (ignore failures so the app
// still works offline / in dev without the deployed server).
async function syncToServer(list) {
  try {
    await fetch(API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(list),
    });
  } catch { /* server unavailable — fine, we still have localStorage */ }
}

// best-effort: pull the server's saved recipes, merge into localStorage, and
// return the merged list. Returns null if the server couldn't be reached.
export async function syncFromServer() {
  try {
    const res = await fetch(API);
    if (!res.ok) return null;
    const remote = await res.json();
    if (!Array.isArray(remote)) return null;

    // Merge: server copy is authoritative, but keep any local-only additions.
    const local = load();
    const byId = new Map();
    for (const f of [...remote, ...local]) byId.set(f._favId || favoriteId(f), f);
    const merged = [...byId.values()];
    save(merged);
    return merged;
  } catch {
    return null;
  }
}
