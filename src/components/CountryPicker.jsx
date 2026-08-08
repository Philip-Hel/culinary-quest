import { useEffect, useMemo, useState } from "react";
import CQCard from "./CQCard";

// Searchable country selector. Renders a small "pick a country" button that
// opens an overlay with a live search + region filter over the loaded list.
// Purely presentational: receives countries[] and calls onPick(country).
export default function CountryPicker({ countries, onPick }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");

  useEffect(() => {
    // Close on Escape.
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const regions = useMemo(
    () => [...new Set(countries.map((c) => c.region).filter(Boolean))].sort(),
    [countries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return countries.filter((c) => {
      const inRegion = region === "all" || c.region === region;
      const inQuery =
        !q || c.name.toLowerCase().includes(q) || (c.subregion || "").toLowerCase().includes(q);
      return inRegion && inQuery;
    });
  }, [countries, query, region]);

  if (open) {
    return (
      <CQCard className="w-full max-w-md p-0">
        <div className="border-b border-cq-border/60 dark:border-cq-darkBorder/60 p-4">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              type="search"
              placeholder="Type a country…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-xl border border-cq-border dark:border-cq-darkBorder bg-cq-surface dark:bg-cq-darkSurface2 px-3 py-2 text-cq-text dark:text-cq-darkText placeholder:text-cq-muted focus:outline-none focus:ring-2 focus:ring-cq-accent/50"
            />
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-xl border border-cq-border dark:border-cq-darkBorder bg-cq-surface dark:bg-cq-darkSurface2 px-2 py-2 text-sm text-cq-text dark:text-cq-darkText"
            >
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close country picker"
              className="rounded-lg px-2 py-1 text-cq-muted hover:text-cq-primary"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-cq-muted dark:text-cq-darkMuted">
            {filtered.length} countries
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-cq-muted dark:text-cq-darkMuted">No matches.</p>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => { onPick(c); setOpen(false); }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-cq-accentSoft/30 dark:hover:bg-cq-darkSurface2"
                  >
                    {c.flag ? (
                      <img src={c.flag} alt="" className="h-6 w-8 rounded-sm object-cover" />
                    ) : (
                      <span className="h-6 w-8 rounded-sm bg-cq-accentSoft/40" />
                    )}
                    <span className="font-serif text-sm text-cq-text dark:text-cq-darkText">{c.name}</span>
                    <span className="ml-auto text-xs text-cq-muted dark:text-cq-darkMuted">{c.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CQCard>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-full border border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/70 dark:bg-cq-darkSurface2/60 px-5 py-2 text-sm font-medium text-cq-muted dark:text-cq-darkMuted hover:text-cq-primary dark:hover:text-cq-ring transition-colors"
    >
      {countries.length > 0 ? "Choose a country" : "Loading countries…"}
    </button>
  );
}
