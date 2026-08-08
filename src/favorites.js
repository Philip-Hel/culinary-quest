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

export function removeFavorite(idMeal) {
  const list = load().filter((f) => String(f.idMeal) !== String(idMeal));
  save(list);
  return list;
}

export function removeFavoriteByFavId(favId) {
  const list = load().filter((f) => f._favId !== favId);
  save(list);
  return list;
}

export function getFavorites() {
  return load();
}

export function isFavorite(idMeal) {
  return load().some((f) => String(f.idMeal) === String(idMeal));
}
