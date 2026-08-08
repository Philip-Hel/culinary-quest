import { useEffect, useState } from "react";
import PageLayout from "./components/PageLayout";
import CQButton from "./components/CQButton";
import CQCard from "./components/CQCard";
import CountryCard from "./components/CountryCard";
import RecipeCard from "./components/RecipeCard";
import WorldMap from "./components/WorldMap";
import CountryInfo from "./components/CountryInfo";

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
import { suggestAIDish, tweakRecipeWithAI, aiConfigured } from "./deepseek";
import FavoritesView from "./components/FavoritesView";
import CountryPicker from "./components/CountryPicker";
import AiTweakPanel from "./components/AiTweakPanel";
import {
  getFavorites,
  addFavorite,
  isFavorite,
  removeFavorite,
  syncFromServer,
} from "./favorites";

export default function App() {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("explore"); // "explore" | "saved"
  const [saved, setSaved] = useState(() => getFavorites());
  const [tweakOpen, setTweakOpen] = useState(false);
  const [note, setNote] = useState(null); // contextual hint (no key / no country)
  const [aiHistory, setAiHistory] = useState([]); // dish names shown for current country

  useEffect(() => {
    fetchRealCountries().then(setCountries);
    // Load saved recipes from the server (if the deployed server is reachable);
    // falls back to localStorage silently when offline.
    syncFromServer().then((list) => { if (list) setSaved(list); });
  }, []);

  // Normalize a recipe to a common shape while keeping the FULL detail payload
  // (instructions, category, ingredients, measures) so the RecipeCard can
  // render an editorial spread. `source` tells us which detail-fetcher to use.
  const toMeal = (recipe) => {
    const thumb = recipe.strMealThumb ?? recipe.image;
    // Ensure every recipe carries an `images` array (DeepSeek dishes already
    // have many; others fall back to their single thumbnail) so the RecipeCard
    // can show a dot-scrolling carousel when more than one photo exists.
    const images = Array.isArray(recipe.images) && recipe.images.length
      ? recipe.images
      : thumb ? [thumb] : recipe.images || [];
    return {
      ...recipe,
      idMeal: String(recipe.idMeal ?? recipe.id),
      strMeal: recipe.strMeal ?? recipe.title,
      strMealThumb: thumb,
      source: recipe.source ?? "mealdb",
      images, // our normalized array wins over any on the original recipe
    };
  };

  // A recipe about to be shown gets the current country/region/cuisine attached
  // so it can be saved and searched in the recipe book.
  const shownRecipe = (r) => ({
    _country: country?.name,
    _region: country?.region,
    _subregion: country?.subregion,
    _cuisine: r.strCategory || r._cuisine,
    ...r,
  });

  const refreshSaved = () => setSaved(getFavorites());

  // Single toggle: save when unsaved, unsave when saved (source-aware).
  const toggleSaved = () => {
    if (!recipe) return;
    if (isFavorite(recipe)) {
      removeFavorite(recipe);
    } else {
      addFavorite(recipe, {
        country: recipe._country,
        region: recipe._region,
        subregion: recipe._subregion,
        cuisine: recipe._cuisine,
      });
    }
    refreshSaved();
  };

  const currentIsSaved = () => (recipe ? isFavorite(recipe) : false);

  // Open a saved recipe in the main card (without re-picking a country).
  const openSaved = (f) => {
    setCountry({ name: f._country, region: f._region, subregion: f._subregion });
    setAiHistory([]);
    setRecipe(shownRecipe(f));
    setError(null);
    setNote(null);
    setView("explore");
  };

  // Gate AI actions: need a DeepSeek key and a selected country.
  const aiAllowed = () => {
    if (!aiConfigured) {
      setNote("Add a DeepSeek key (VITE_DEEPSEEK_API_KEY in .env) to enable AI.");
      return false;
    }
    if (!country) {
      setNote("Pick or choose a country first — then I can draft a dish for it.");
      return false;
    }
    return true;
  };

  // Ask DeepSeek for a fresh AI idea for the current country. Tracks which dishes
  // have already been suggested (for this country) and asks for something
  // different, retrying once if the model still repeats one.
  const newAiIdea = async () => {
    if (!aiAllowed() || !country) return;
    setTweakOpen(false);
    setNote(null);
    setLoading(true);
    try {
      // Ask for a dish excluding anything already shown, retrying (with an
      // escalating "pick something different" nudge) if the model repeats one.
      let aiDish = null;
      let strong = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = await suggestAIDish({ ...country, exclude: aiHistory, stronglyDifferent: strong || attempt > 1 });
        if (!candidate) break;
        const dup = aiHistory.some((n) => String(n).toLowerCase() === candidate.strMeal.toLowerCase());
        if (!dup) { aiDish = candidate; break; }
        strong = true; // model repeated a seen dish -> escalate the "different" nudge
        aiDish = candidate; // keep it as a fallback so we don't blank the screen
      }
      if (aiDish) {
        setRecipe(shownRecipe(aiDish));
        setAiHistory((h) => [...h.filter((n) => n !== aiDish.strMeal).slice(-20), aiDish.strMeal]);
        setError(null);
      } else {
        setError("The AI couldn't draft a dish right now — please try again.");
      }
    } catch (err) {
      console.error("AI idea failed:", err);
      setError("Something went wrong getting an AI idea. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Choose a specific country (from the picker) and run the local recipe flow.
  const pickCountry = async (chosen) => {
    if (!chosen) return;
    setView("explore");
    setNote(null);
    await pickRandomCountry(chosen);
  };

  // Tweak the current recipe with AI (preset or free text).
  const handleTweak = async (instruction) => {
    if (!recipe || !aiAllowed()) return;
    setNote(null);
    setLoading(true);
    try {
      const tweaked = await tweakRecipeWithAI(recipe, instruction);
      if (tweaked) {
        setRecipe(shownRecipe(tweaked));
        setTweakOpen(false);
        setError(null);
      } else {
        setError("The AI couldn't tweak that recipe — please try again.");
      }
    } catch (err) {
      console.error("AI tweak failed:", err);
      setError("Something went wrong tweaking the recipe. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickRandomCountry = async (target) => {
    const random = target || countries[Math.floor(Math.random() * countries.length)];
    if (!random) return;

    setCountry(random);
    setAiHistory([]); // new country -> fresh set of AI dishes to avoid repeats
    setRecipes([]);
    setRecipe(null);
    setLoading(true);
    setError(null);

    // Run each recipe source in its own try/catch so one failure can't wipe
    // out every other source's results (they already fail-soft and return []).
    const safe = async (label, fn) => {
      try {
        return await fn();
      } catch (err) {
        console.error(`[${label}] failed:`, err);
        return [];
      }
    };

    const collected = [];

    // 1) Primary: the country's actual cuisine via a *valid* TheMealDB area.
    const area = resolveMealdbArea(random);
    if (area) {
      const areaMeals = await safe("TheMealDB", () => fetchRecipesByCuisine(area));
      collected.push(...(areaMeals || []));
    }

    // 2) Fallback: if the cuisine gave nothing, pull a rich category pool so
    //    the recipe button never silently disappears.
    if (collected.length === 0) {
      const categoryIndex = random.name.length % CATEGORY_FALLBACKS.length;
      const categoryMeals = await safe("Category", () =>
        fetchRecipesByCategory(CATEGORY_FALLBACKS[categoryIndex])
      );
      collected.push(...(categoryMeals || []));
    }

    // 3) Scale out: Spoonacular multi-angle search (free) — the country's
    //    cuisine plus a rotating signature-ingredient keyword, merged.
    const spoonacularCuisine = resolveSpoonacularCuisine(random);
    const spoonKeywords = resolveSpoonacularKeywords(random);
    const spoonResults = await safe("Spoonacular", () =>
      searchRecipesMulti({ cuisine: spoonacularCuisine, keywords: spoonKeywords })
    );
    collected.push(...(spoonResults || []));

    // 4) Scale out more: Edamam (optional, paid) fills remaining regional gaps.
    const edamam = resolveEdamam(random);
    const edamamResults = await safe("Edamam", () =>
      searchEdamamRecipes(edamam.keyword, edamam.cuisineType)
    );
    collected.push(...(edamamResults || []));

    // 5) Offline curated pool — safe, no key; dedupe by name vs live results.
    const offlineResults = getOfflineRecipes(random);
    if (offlineResults.length) {
      const liveNames = new Set(
        collected.map((r) => (r.strMeal || r.title || "").toLowerCase())
      );
      for (const r of offlineResults) {
        if (!liveNames.has(r.strMeal.toLowerCase())) collected.push(r);
      }
    }

    // 6) Optional AI (DeepSeek): add a fresh region-appropriate dish. It only
    //    ever adds; the real verified recipes stay the foundation.
    if (aiConfigured) {
      const aiDish = await safe("DeepSeek", () => suggestAIDish(random));
      if (aiDish) collected.push(aiDish);
    }

    if (collected.length === 0) {
      setError("No recipes found for this country right now — try again!");
    } else {
      setRecipes(collected.map(toMeal));
    }
    setLoading(false);
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

      setRecipe(details ? shownRecipe(toMeal(details)) : null);
      if (!details) setError("Couldn't load that recipe — pick another!");
    } catch (err) {
      console.error("Failed to load recipe details:", err);
      setError("Something went wrong loading the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savedCount = saved.length;

  return (
    <PageLayout>
      <div className="flex flex-col gap-5">
        {/* View switcher */}
        <nav className="mt-2 inline-flex self-center rounded-full border border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/70 dark:bg-cq-darkSurface2/60 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView("explore")}
            className={`rounded-full px-5 py-1.5 transition-colors ${
              view === "explore"
                ? "bg-cq-brand text-white shadow-cq-btn"
                : "text-cq-muted dark:text-cq-darkMuted"
            }`}
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => setView("saved")}
            className={`rounded-full px-5 py-1.5 transition-colors ${
              view === "saved"
                ? "bg-cq-brand text-white shadow-cq-btn"
                : "text-cq-muted dark:text-cq-darkMuted"
            }`}
          >
            My Recipes{savedCount ? ` (${savedCount})` : ""}
          </button>
        </nav>

        {view === "saved" ? (
          <FavoritesView
            favorites={saved}
            onOpen={openSaved}
            onRemove={(f) => {
              removeFavorite(f); // source-aware (uses _favId)
              refreshSaved();
            }}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start lg:min-h-[calc(100vh-220px)]">
            {/* ---- Left sidebar: country controls + compact flag (vertical stack) ---- */}
            <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
              <div className="flex flex-col gap-2">
                <CQButton onClick={() => pickRandomCountry()} disabled={loading} className="w-full">
                  {loading ? "Loading…" : "Random country"}
                </CQButton>
                <CQButton onClick={pickRandomRecipe} disabled={!country || loading} className="w-full">
                  Pick Local Recipe{recipes.length ? ` (${recipes.length})` : ""}
                </CQButton>
                <div className="flex justify-center">
                  <CountryPicker countries={countries} onPick={pickCountry} />
                </div>
                <CQButton variant="secondary" onClick={newAiIdea} disabled={loading} className="w-full">
                  {loading ? "AI drafting…" : "AI Recipe Idea"}
                </CQButton>
              </div>

              {/* Contextual hint (e.g. add a DeepSeek key, pick a country first) */}
              {note && (
                <p className="text-center text-sm text-cq-olive dark:text-cq-ring">
                  {note}
                </p>
              )}

              <CountryCard country={country} compact />

              {/* Located map of the selected country (appears once a country is chosen) */}
              {country?.latlng && (
                <div className="overflow-hidden rounded-xl border border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/70 dark:bg-cq-darkSurface2/60 p-1 pb-0.5 shadow-cq">
                  <WorldMap latlng={country.latlng} label={country.name} highlight={country.name} />
                </div>
              )}
            </aside>

            {/* ---- Right main: startup map / country info / recipe ---- */}
            <section className="flex min-w-0 flex-col gap-4 lg:min-h-[calc(100vh-220px)]">
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

              {/* The recipe (or country info / startup map when none selected) */}
              {recipe ? (
                <>
                  <RecipeCard key={recipe?.idMeal || "none"} recipe={recipe} />
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <CQButton variant="secondary" onClick={toggleSaved}>
                      {currentIsSaved() ? "♥ Saved" : "♥ Save this recipe"}
                    </CQButton>
                    <CQButton variant="secondary" onClick={() => pickRandomRecipe()} disabled={loading}>
                      New Local Recipe
                    </CQButton>
                    <CQButton variant="secondary" onClick={newAiIdea} disabled={loading}>
                      {loading ? "AI drafting…" : "New AI Idea"}
                    </CQButton>
                    <CQButton variant="secondary" onClick={() => setTweakOpen((o) => !o)} disabled={loading}>
                      Tweak with AI
                    </CQButton>
                  </div>
                  {tweakOpen && (
                    <AiTweakPanel busy={loading} onApply={handleTweak} onClose={() => setTweakOpen(false)} />
                  )}
                </>
              ) : country ? (
                <CountryInfo country={country} />
              ) : (
                <div className="relative w-full overflow-hidden rounded-2xl border border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/70 dark:bg-cq-darkSurface2/60 shadow-cq">
                  {/* Themed world map fills the whole right panel */}
                  <WorldMap size="tall" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-center">
                    <p className="font-serif text-lg italic text-cq-text dark:text-cq-darkText">
                      Pick a country to begin the journey.
                    </p>
                    <p className="text-xs uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
                      Choose Random country, or pick one with the map
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
