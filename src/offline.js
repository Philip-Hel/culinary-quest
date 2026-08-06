// Offline (bundled) recipe source.
//
// TheMealDB and Spoonacular barely cover some cuisines (Pacific islands,
// regional African, Latin American, etc.). This module returns curated recipes
// from the bundled `src/recipes.json` pool for those gaps. It's fully offline,
// needs no key, and never breaks — the trade-off is it only changes when
// `src/recipes.json` is regenerated and committed.
//
// Live sources are still tried FIRST; offline fills the rest (see App.jsx).

import RECIPES from "./recipes.json";
import { resolveOfflineRegions } from "./cuisines";

const POOL = RECIPES.recipes || [];

// Return curated offline recipes matching a country's region tags.
export function getOfflineRecipes({ name, region, subregion }) {
  const wanted = resolveOfflineRegions({ name, region, subregion });
  if (wanted.size === 0) return [];

  const matches = POOL.filter((r) => r.regions.some((tg) => wanted.has(tg)));
  return matches.map((r, i) => ({
    idMeal: r.id,
    strMeal: r.name,
    strMealThumb: r.image,
    strInstructions: r.instructions,
    strIngredients: r.ingredients || [],
    strCategory: r.category || "(offline)",
    strTags: r.countryHint || "",
    source: "offline",
    // stable pseudo-id for dedupe/detail
    detail: i,
  }));
}
