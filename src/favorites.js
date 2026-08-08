// Favorite/saved recipes — persisted to localStorage (there's no backend).
//
// A saved recipe is the full recipe object PLUS the country/region metadata it
// was picked from, so the Favorites view can search by country or cuisine.

const KEY = "culinary-quest-favorites";

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

// Add a recipe if not already saved. `meta` carries { country, region, subregion, cuisine }.
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
  }
  return list;
}

// Remove a saved recipe by its stable key (source + id). Source-aware, so a
// numeric id collision across sources can't delete the wrong recipe.
export function removeFavoriteByFavId(favId) {
  const list = load().filter((f) => f._favId !== favId);
  save(list);
  return list;
}

// Source-aware removal that accepts either a full recipe or its _favId.
export function removeFavorite(recipeOrFavId) {
  const favId = typeof recipeOrFavId === "string"
    ? recipeOrFavId
    : recipeOrFavId?._favId || favoriteId(recipeOrFavId);
  return removeFavoriteByFavId(favId);
}

export function getFavorites() {
  return load();
}

// Source-aware check: does a recipe (by its stable key) already exist?
export function isFavorite(recipeOrFavId) {
  const favId = typeof recipeOrFavId === "string"
    ? recipeOrFavId
    : recipeOrFavId?._favId || favoriteId(recipeOrFavId);
  return load().some((f) => f._favId === favId);
}
