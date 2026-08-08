import { useState } from "react";
import CQCard from "./CQCard";

// Favorites ("Your Recipe Book"): a searchable/filterable list of saved recipes.
// Search matches country, region, cuisine, or dish name.
export default function FavoritesView({ favorites, onOpen, onRemove }) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState("all");

  if (favorites.length === 0) {
    return (
      <CQCard className="w-full text-center">
        <p className="font-serif text-xl italic text-cq-muted dark:text-cq-darkMuted">
          Your recipe book is empty.
        </p>
        <p className="mt-2 text-sm text-cq-muted dark:text-cq-darkMuted">
          Pick a country and press <span className="font-medium">Save</span> to
          keep a dish here.
        </p>
      </CQCard>
    );
  }

  const cuisines = [...new Set(favorites.map((f) => f._cuisine || f.strCategory || "Other"))].sort();

  const q = query.trim().toLowerCase();
  const filtered = favorites.filter((f) => {
    const cuisineMatch = cuisine === "all" || (f._cuisine || f.strCategory) === cuisine;
    const textMatch =
      !q ||
      [f.strMeal, f._country, f._region, f._subregion, f._cuisine, f.strCategory]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    return cuisineMatch && textMatch;
  });

  return (
    <CQCard className="w-full">
      <h2 className="font-serif text-2xl font-bold text-cq-text dark:text-cq-darkText">
        Your Recipe Book ({favorites.length})
      </h2>

      {/* Search + filter */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search country, cuisine or dish…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-cq-border dark:border-cq-darkBorder bg-cq-surface dark:bg-cq-darkSurface2 px-4 py-2.5 text-cq-text dark:text-cq-darkText placeholder:text-cq-muted dark:placeholder:text-cq-darkMuted focus:outline-none focus:ring-2 focus:ring-cq-accent/50"
        />
        <select
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          className="rounded-xl border border-cq-border dark:border-cq-darkBorder bg-cq-surface dark:bg-cq-darkSurface2 px-3 py-2.5 text-cq-text dark:text-cq-darkText focus:outline-none"
        >
          <option value="all">All cuisines</option>
          {cuisines.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-center text-cq-muted dark:text-cq-darkMuted">
          No saved dishes match.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-cq-border/60 dark:divide-cq-darkBorder/60">
          {filtered.map((f) => (
            <li key={f._favId} className="flex items-center gap-4 py-3">
              <img
                src={f.strMealThumb}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60"
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
              />
              <button
                type="button"
                onClick={() => onOpen(f)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate font-serif text-lg text-cq-text dark:text-cq-darkText">
                  {f.strMeal}
                </span>
                <span className="block truncate text-sm text-cq-muted dark:text-cq-darkMuted">
                  {[f._country, f._cuisine || f.strCategory].filter(Boolean).join(" · ")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(f)}
                aria-label={`Remove ${f.strMeal}`}
                className="shrink-0 rounded-full border border-cq-border/60 dark:border-cq-darkBorder px-3 py-1 text-sm text-cq-muted dark:text-cq-darkMuted hover:text-cq-primary dark:hover:text-cq-ring hover:border-cq-primary/40 transition-colors"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </CQCard>
  );
}
