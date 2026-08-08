import { useEffect, useState } from "react";
import CQCard from "./CQCard";
import { fetchCountryProfile } from "../countryInfo";

// Show more about a selected country (before a recipe is picked): a fuller
// layout that makes use of the whole right panel — a header with a small flag,
// a Wikipedia summary (keyless API), and a generous facts grid. If the profile
// fetch fails the panel degrades cleanly to the bundled facts.
// The located world map lives in the left sidebar (App.jsx).

function formatArea(km2) {
  if (!km2) return "—";
  return `${Math.round(km2).toLocaleString()} km²`;
}

// Fetch the country's Wikipedia profile once per country change.
function useCountryProfile(name) {
  const [state, setState] = useState({ name: undefined, profile: {} });
  useEffect(() => {
    if (!name) return undefined;
    let active = true;
    Promise.resolve()
      .then(() => fetchCountryProfile(name))
      .then((p) => {
        if (active) setState({ name, profile: p });
      });
    return () => {
      active = false;
    };
  }, [name]);
  // Only return a profile if it belongs to the current country, so a stale
  // profile never flashes after the country changes.
  return state.name === name ? state.profile : {};
}

export default function CountryInfo({ country }) {
  // Hooks must run before any early return.
  const profile = useCountryProfile(country && country.name);

  if (!country) return null;

  const facts = [
    country.capital && ["Capital", country.capital],
    country.languages && ["Languages", country.languages],
    country.area && ["Area", formatArea(country.area)],
    country.subregion && ["Sub-region", country.subregion],
    country.region && ["Continent", country.region],
  ].filter(Boolean);

  // A fuller extract (up to ~4 sentences) so the panel has real content.
  const sentences = (profile.extract || "").split(".").filter(Boolean);
  const summary = sentences.slice(0, 4).join(".") + (sentences.length > 4 ? "." : "");

  return (
    <div className="flex h-full flex-col gap-4">
      <CQCard className="w-full p-6">
        {/* Header: small flag + eyebrow + name */}
        <div className="flex items-center gap-4">
          {country.flag ? (
            <img
              src={country.flag}
              alt={`Flag of ${country.name}`}
              className="h-12 w-16 shrink-0 rounded ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60"
            />
          ) : (
            <span className="grid h-12 w-16 shrink-0 place-items-center rounded bg-cq-accentSoft/60 font-serif text-xl font-bold text-cq-accent dark:bg-cq-darkSurface2 dark:text-cq-ring">
              {country.name.charAt(0)}
            </span>
          )}
          <div>
            <p className="text-xs uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
              {country.region}
              {country.subregion ? ` · ${country.subregion}` : ""}
            </p>
            <h2 className="font-serif text-3xl font-bold text-cq-text dark:text-cq-darkText">
              {country.name}
            </h2>
            {profile.description && (
              <p className="mt-0.5 text-sm font-medium text-cq-primary dark:text-cq-ring">
                {profile.description}
              </p>
            )}
          </div>
        </div>

        <div className="rule-double my-5" />

        {/* Summary */}
        {summary ? (
          <p className="font-serif text-lg italic leading-relaxed text-cq-text/90 dark:text-cq-darkText/85">
            {summary}
          </p>
        ) : (
          <p className="font-serif text-lg italic leading-relaxed text-cq-muted dark:text-cq-darkMuted">
            A country of {country.region.toLowerCase()} — the perfect place to
            start a {country.name} food journey.
          </p>
        )}

        <div className="rule-double my-5" />

        {/* Facts grid — generous tiles across the full width */}
        <h3 className="text-xs font-bold uppercase tracking-wideish text-cq-accent dark:text-cq-ring">
          At a glance
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-cq-border/60 dark:border-cq-darkBorder/60 bg-cq-bg/60 px-3 py-3 dark:bg-cq-darkSurface2/60"
            >
              <dt className="text-[0.68rem] font-semibold uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
                {label}
              </dt>
              <dd className="mt-1 font-serif text-lg leading-snug text-cq-text dark:text-cq-darkText">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 font-serif italic text-sm leading-relaxed text-cq-muted dark:text-cq-darkMuted">
          Press <span className="font-medium text-cq-primary dark:text-cq-ring">"Pick Local Recipe"</span>{" "}
          or <span className="font-medium text-cq-primary dark:text-cq-ring">"AI Recipe Idea"</span> to explore dishes
          from {country.name}'s kitchen.
        </p>
      </CQCard>
    </div>
  );
}
