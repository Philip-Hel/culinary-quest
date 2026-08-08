import CQCard from "./CQCard";
import WorldMap from "./WorldMap";

// Show more about a selected country (before a recipe is picked): cultural
// facts (capital, languages, area, region) and a map marking where it is.
// All data is bundled offline in countries.json — no network needed.

function formatArea(km2) {
  if (!km2) return "—";
  return `${Math.round(km2).toLocaleString()} km²`;
}

export default function CountryInfo({ country }) {
  if (!country) return null;

  const facts = [
    country.capital && ["Capital", country.capital],
    country.languages && ["Languages", country.languages],
    country.area && ["Area", formatArea(country.area)],
    country.subregion && ["Sub-region", country.subregion],
    country.region && ["Continent", country.region],
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <CQCard className="w-full p-5">
        {/* Location map with marker + highlighted country */}
        <div className="w-56 max-w-full mx-auto">
          <WorldMap latlng={country.latlng} label={country.name} highlight={country.name} />
        </div>
        <p className="mt-2 text-center text-xs uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
          {country.name} · located here
        </p>
      </CQCard>

      <CQCard className="w-full p-5">
        <div className="flex items-center gap-3">
          {country.flag && (
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
