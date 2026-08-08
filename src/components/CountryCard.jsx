import CQCard from "./CQCard";

function Chip({ label, value }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[0.62rem] font-semibold uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
        {label}
      </span>
      <span className="mt-1 font-serif text-sm text-cq-text dark:text-cq-darkText">
        {value}
      </span>
    </div>
  );
}

export default function CountryCard({ country, compact = false }) {
  if (!country) return null;

  if (compact) {
    return (
      <CQCard className="w-full p-4">
        <div className="flex items-center gap-4">
          {country.flag && (
            <img
              src={country.flag}
              alt={`Flag of ${country.name}`}
              className="h-12 w-16 shrink-0 rounded-md object-cover ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60"
            />
          )}
          <div className="min-w-0">
            <h2 className="truncate font-serif text-xl font-bold text-cq-text dark:text-cq-darkText">
              {country.name}
            </h2>
            <p className="truncate text-sm text-cq-muted dark:text-cq-darkMuted">
              {country.region}
              {country.subregion ? ` · ${country.subregion}` : ""}
            </p>
          </div>
        </div>
      </CQCard>
    );
  }

  return (
    <CQCard className="w-full overflow-hidden p-0">
      <div className="relative">
        {/* Giant magazine background numeral */}
        <span className="pointer-events-none absolute -top-7 right-2 select-none font-serif text-[9rem] font-black leading-none text-cq-accent/10 dark:text-cq-darkRing/10">
          {country.name.charAt(0)}
        </span>

        {/* Framed flag treated like an archival photograph */}
        <div className="relative mx-auto -mt-1 w-fit rotate-[-1.5deg] bg-cq-surface dark:bg-cq-darkSurface2 p-3 pb-4 shadow-cq-lg dark:shadow-cqDark-lg ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60">
          <div className="overflow-hidden rounded ring-4 ring-cq-ring/30 dark:ring-cq-darkRing/30">
            <img
              src={country.flag}
              alt={`Flag of ${country.name}`}
              className="aspect-magazine w-36 object-cover transition-transform duration-700 hover:scale-105 sm:w-44"
            />
          </div>
          <p className="mt-2 text-center font-serif text-[0.7rem] italic text-cq-muted dark:text-cq-darkMuted">
            Filed under {country.region}
          </p>
        </div>
      </div>

      <div className="px-7 pb-8 pt-2 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-cq-accent dark:text-cq-ring">
          ✦ Feature · The Table Abroad ✦
        </p>

        <h2 className="mt-3 font-serif text-5xl font-black leading-none tracking-tight text-cq-text dark:text-cq-darkText sm:text-6xl">
          {country.name}
        </h2>

        <div className="ornament mx-auto mt-6 max-w-xs text-lg">
          <span>❦</span>
        </div>

        <p className="mt-4 font-serif text-lg italic text-cq-muted dark:text-cq-darkMuted">
          Plated from {country.region}
          {country.subregion ? `, the ${country.subregion}` : ""}.
        </p>

        <div className="mt-7 flex items-center justify-center gap-8 border-t border-cq-border/60 dark:border-cq-darkBorder/60 pt-6">
          <Chip label="Continent" value={country.region} />
          <Chip label="Quarter" value={country.subregion || "—"} />
        </div>
      </div>
    </CQCard>
  );
}
