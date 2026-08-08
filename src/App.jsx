import { useEffect, useState } from "react";
import PageLayout from "./components/PageLayout";
import CQButton from "./components/CQButton";
import CQCard from "./components/CQCard";
import CountryCard from "./components/CountryCard";
import RecipeCard from "./components/RecipeCard";

import {
  fetchRealCountries,
  fetchRecipesByCuisine,
  fetchRecipesByCategory,
  fetchRecipeDetails,
} from "./api";

import {
  resolveMealdbArea,
  resolveSpoonacularCuisine,
  resolveSpoonacularKeywords,
  resolveEdamam,
  CATEGORY_FALLBACKS,
} from "./cuisines";

import { searchRecipesMulti, fetchSpoonacularRecipeDetails } from "./spoonacular";
import { searchEdamamRecipes } from "./edamam";
import { getOfflineRecipes } from "./offline";
import { suggestAIDish, aiConfigured } from "./deepseek";

export default function App() {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRealCountries().then(setCountries);
  }, []);

  // Normalize a recipe to a common shape while keeping the FULL detail payload
  // (instructions, category, ingredients, measures) so the RecipeCard can
  // render an editorial spread. `source` tells us which detail-fetcher to use.
  const toMeal = (recipe) => ({
    idMeal: String(recipe.idMeal ?? recipe.id),
    strMeal: recipe.strMeal ?? recipe.title,
    strMealThumb: recipe.strMealThumb ?? recipe.image,
    source: recipe.source ?? "mealdb",
    ...recipe,
  });

  const pickRandomCountry = async () => {
    const random = countries[Math.floor(Math.random() * countries.length)];
    if (!random) return;

    setCountry(random);
    setRecipes([]);
    setRecipe(null);
    setLoading(true);
    setError(null);

    try {
      const collected = [];

      // 1) Primary: the country's actual cuisine via a *valid* TheMealDB area.
      const area = resolveMealdbArea(random);
      if (area) {
        const areaMeals = await fetchRecipesByCuisine(area);
        collected.push(...(areaMeals || []));
      }

      // 2) Fallback: if the cuisine gave nothing, pull a rich category pool so
      //    the recipe button never silently disappears.
      if (collected.length === 0) {
        const categoryIndex =
          random.name.length % CATEGORY_FALLBACKS.length;
        const categoryMeals = await fetchRecipesByCategory(
          CATEGORY_FALLBACKS[categoryIndex]
        );
        collected.push(...(categoryMeals || []));
      }

      // 3) Scale out: Spoonacular multi-angle search (free) — the country's
      //    cuisine plus a rotating signature-ingredient keyword, de-duplicated,
      //    so thin cuisines yield a much bigger pool without burning quota.
      const spoonacularCuisine = resolveSpoonacularCuisine(random);
      const spoonKeywords = resolveSpoonacularKeywords(random);
      const spoonResults = await searchRecipesMulti({
        cuisine: spoonacularCuisine,
        keywords: spoonKeywords,
      });
      collected.push(...(spoonResults || []));

      // 4) Scale out more: Edamam (optional, paid) fills remaining regional gaps.
      const edamam = resolveEdamam(random);
      const edamamResults = await searchEdamamRecipes(
        edamam.keyword,
        edamam.cuisineType
      );
      collected.push(...(edamamResults || []));

      // 5) Offline curated pool: guaranteed dishes for cuisines the live APIs
      //    can't cover (Pacific islands, regional African/Latin American, etc.).
      //    Always safe, no key — dedupe by name so we don't repeat live finds.
      const offlineResults = getOfflineRecipes(random);
      if (offlineResults.length) {
        const liveNames = new Set(
          collected.map((r) => (r.strMeal || r.title || "").toLowerCase())
        );
        for (const r of offlineResults) {
          if (!liveNames.has(r.strMeal.toLowerCase())) collected.push(r);
        }
      }

      // 6) Optional AI (DeepSeek): when a key is configured, ask the model for a
      //    fresh, region-appropriate dish to add to the pool. It only ever adds —
      //    the real, verified recipes above stay the foundation.
      if (aiConfigured) {
        const aiDish = await suggestAIDish(random);
        if (aiDish) collected.push(aiDish);
      }

      if (collected.length === 0) {
        setError("No recipes found for this country right now — try again!");
      } else {
        setRecipes(collected.map(toMeal));
      }
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Something went wrong loading recipes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickRandomRecipe = async () => {
    if (recipes.length === 0) return;

    const random = recipes[Math.floor(Math.random() * recipes.length)];
    setLoading(true);
    setRecipe(null);

    try {
      let details;
      if (random.source === "spoonacular") {
        details = await fetchSpoonacularRecipeDetails(random.idMeal);
      } else if (random.source === "edamam" || random.source === "offline" || random.source === "deepseek") {
        // Edamam/offline/AI results already include the full recipe.
        details = random;
      } else {
        details = await fetchRecipeDetails(random.idMeal);
      }

      setRecipe(details ? toMeal(details) : null);
      if (!details) setError("Couldn't load that recipe — pick another!");
    } catch (err) {
      console.error("Failed to load recipe details:", err);
      setError("Something went wrong loading the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showRecipeButton =
    country && recipes.length > 0 && !loading && !error;

  return (
    <PageLayout>
      <div className="flex flex-col items-center gap-6">
        <CQButton onClick={pickRandomCountry} disabled={loading}>
          {loading ? "Exploring…" : "Pick Random Country"}
        </CQButton>

        <CountryCard country={country} />

        {loading && (
          <CQCard className="w-full">
            <div className="flex items-center justify-center gap-3 text-cq-muted dark:text-cq-darkMuted">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cq-accent/30 border-t-cq-accent" />
              <p className="font-medium">Searching the world&apos;s kitchens…</p>
            </div>
          </CQCard>
        )}

        {error && (
          <CQCard className="w-full">
            <div className="flex items-center justify-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-cq-primary/10 text-cq-primary">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v6M12 16.5v.5" />
                </svg>
              </span>
              <p className="font-medium text-cq-primary dark:text-cq-ring">
                {error}
              </p>
            </div>
          </CQCard>
        )}

        {showRecipeButton && (
          <CQButton onClick={pickRandomRecipe}>
            Pick Random Recipe ({recipes.length})
          </CQButton>
        )}

        <RecipeCard recipe={recipe} />
      </div>
    </PageLayout>
  );
}
