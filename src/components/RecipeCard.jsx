import { useState } from "react";
import CQCard from "./CQCard";

// TheMealDB packs ingredients into strIngredient1..20 + strMeasure1..20.
// Collect the non-empty pairs; Spoonacular instead exposes strIngredients[].
function collectIngredients(recipe) {
  if (Array.isArray(recipe.strIngredients)) {
    return recipe.strIngredients.filter(Boolean);
  }
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const ing = recipe[`strIngredient${i}`];
    const measure = recipe[`strMeasure${i}`];
    if (!ing || !ing.trim()) continue;
    out.push(`${measure ? measure.trim() + " " : ""}${ing.trim()}`);
  }
  return out;
}

// TheMealDB steps are separated by \r\n (sometimes blank lines); Spoonacular is
// already newline-joined. Render each as a numbered "step".
function collectSteps(recipe) {
  return String(recipe.strInstructions || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const StarRow = () => (
  <span className="inline-flex text-cq-accent dark:text-cq-ring" aria-hidden>
    {"★★★★★"}
  </span>
);

export default function RecipeCard({ recipe }) {
  // Hooks must run before the early return. `imgFailed` resets when the card is
  // remounted via its `key` in App.jsx (per-recipe), so a new dish re-tries its photo.
  const [imgFailed, setImgFailed] = useState(false);

  if (!recipe) return null;

  const isAI = recipe.source === "deepseek";
  const isTweaked = /ai-tweaked/i.test(recipe.strTags || "");
  const ingredients = collectIngredients(recipe);
  const steps = collectSteps(recipe);
  const area = recipe.strArea || recipe.strCategory;
  const tags = recipe.strTags || "";

  return (
    <CQCard className="w-full overflow-hidden p-0">
      {/* Bleeding photo hero with caption strip */}
      <figure className="relative">
        {recipe.strMealThumb && !imgFailed ? (
          <img
            src={recipe.strMealThumb}
            alt={recipe.strMeal}
            onError={() => setImgFailed(true)}
            className="aspect-banner w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
        ) : (
          <div className="aspect-banner w-full bg-gradient-to-br from-cq-accentSoft/40 via-cq-surface to-cq-primary/20 grid place-items-center">
            <span className="font-serif text-6xl text-cq-primary/30">🍽</span>
          </div>
        )}
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-cq-surface/85 dark:bg-cq-surface/80 px-5 py-2.5 text-[0.7rem] font-medium uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted backdrop-blur">
          <span>{isAI ? (isTweaked ? "AI-tweaked · unverified" : "Suggested by AI · unverified") : "Photographed on location"}</span>
          <span className="font-serif normal-case italic tracking-normal">
            {area ? `A ${area} speciality` : "From the global kitchen"}
          </span>
        </figcaption>
      </figure>

      <div className="px-7 pb-9">
        {/* Headline block */}
        <div className="pt-6">
          <p className="flex items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cq-accent dark:text-cq-ring">
            <span>{isAI ? (isTweaked ? "✦ AI-Tweaked ✦" : "✦ Suggested by AI ✦") : "✦ Signature Dish ✦"}</span>
            <StarRow />
          </p>
          <h3 className="mt-3 font-serif text-4xl font-black leading-tight tracking-tight text-cq-text dark:text-cq-darkText sm:text-5xl">
            {recipe.strMeal}
          </h3>

          {tags ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.split(",").slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-cq-border/70 dark:border-cq-darkBorder bg-cq-accentSoft/30 dark:bg-cq-darkSurface2 px-2.5 py-0.5 font-serif text-xs italic text-cq-muted dark:text-cq-darkMuted"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ornament mx-auto mt-7 max-w-sm text-base">
          <span>❦</span>
        </div>

        {/* Two-col spread: ingredients + method */}
        <div className="mt-7 grid gap-8 sm:grid-cols-[0.9fr_1.1fr]">
          {/* Ingredients sidebar */}
          <aside className="sm:border-r sm:border-cq-border/60 dark:sm:border-cq-darkBorder/60 sm:pr-6">
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-cq-primary dark:text-cq-darkText">
              The Pantry
            </h4>
            {ingredients.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {ingredients.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-baseline gap-3 font-serif text-[0.95rem] text-cq-text/90 dark:text-cq-darkText/90"
                  >
                    <span className="text-xs text-cq-accent dark:text-cq-ring">{`${i + 1}.`}</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 font-serif italic text-cq-muted dark:text-cq-darkMuted">
                Ingredients forthcoming…
              </p>
            )}
          </aside>

          {/* Method */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-cq-primary dark:text-cq-darkText">
              Method of Preparation
            </h4>
            {steps.length > 0 ? (
              <ol className="mt-4 space-y-4">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cq-brand text-white font-serif text-sm shadow-cq-btn">
                      {i + 1}
                    </span>
                    <p className="font-serif text-[0.95rem] leading-relaxed text-cq-text/90 dark:text-cq-darkText/90">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 font-serif italic text-cq-muted dark:text-cq-darkMuted">
                No method on file for this dish.
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 border-t border-cq-border/60 dark:border-cq-darkBorder/60 pt-4 text-center text-xs uppercase tracking-[0.2em] text-cq-muted/70 dark:text-cq-darkMuted/70">
          Bon appétit · Good eating is good thinking
        </p>
      </div>
    </CQCard>
  );
}
