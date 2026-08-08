import { useEffect, useState } from "react";
import CQCard from "./CQCard";
import { fetchCountryProfile } from "../countryInfo";

// Show more about a selected country (before a recipe is picked): a
// representative photo + a short summary (via Wikipedia's keyless API), plus
// cultural facts (capital, languages, area, region). If the profile fetch
// fails the panel degrades cleanly to the flag + bundled facts.
// The located world map itself lives in the left sidebar (App.jsx).

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

// Thematic placeholder used when the country photo is missing or fails to load.
function PhotoCard({ country, thumbnail }) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-cq-accentSoft/60 via-cq-surface to-cq-primary/10 dark:from-cq-darkSurface2 dark:via-cq-darkSurface dark:to-cq-darkRing/10">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`${country.name} · ${country.region}`}
          className="aspect-banner h-auto w-full object-cover"
        />
      ) : (
        <div className="aspect-banner grid w-full place-items-center bg-cq-accentSoft/50 text-cq-accent dark:bg-cq-darkSurface2 dark:text-cq-ring">
          <span className="text-6xl drop-shadow">🗺</span>
        </div>
      )}
    </div>
  );
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

  const hasFlag = Boolean(country.flag);

  return (
    <div className="flex flex-col gap-4">
      <CQCard className="w-full p-5">
        {/* Hero: photo + name + description */}
        <PhotoCard country={country} thumbnail={profile.thumbnail} />

        <div className="mt-4 flex items-center gap-3">
          {hasFlag && (
            <img
              src={country.flag}
              alt={`Flag of ${country.name}`}
              className="h-10 w-14 shrink-0 rounded object-cover ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60"
            />
          )}
          <div>
            <h2 className="font-serif text-2xl font-bold text-cq-text dark:text-cq-darkText">
              {country.name}
            </h2>
            <p className="text-sm text-cq-muted dark:text-cq-darkMuted">
              {country.region}
              {country.subregion ? ` · ${country.subregion}` : ""}
            </p>
          </div>
        </div>

        {profile.description && (
          <p className="mt-2 text-sm font-medium text-cq-primary dark:text-cq-ring">
            {profile.description}
          </p>
        )}

        {profile.extract && (
          <p className="mt-3 font-serif italic text-sm leading-relaxed text-cq-text/90 dark:text-cq-darkText/80">
            {profile.extract.split(".").slice(0, 2).join(".") + "."}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="border-t border-cq-border/50 dark:border-cq-darkBorder/50 pt-2">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
                {label}
              </dt>
              <dd className="mt-0.5 font-serif text-base text-cq-text dark:text-cq-darkText">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 font-serif italic text-sm leading-relaxed text-cq-muted dark:text-cq-darkMuted">
          Press <span className="font-medium text-cq-primary dark:text-cq-ring">"Pick Local Recipe"</span>{" "}
          or <span className="font-medium text-cq-primary dark:text-cq-ring">"AI Recipe Idea"</span> to explore dishes
          from {country.name}'s kitchen.
        </p>
      </CQCard>
    </div>
  );
}
