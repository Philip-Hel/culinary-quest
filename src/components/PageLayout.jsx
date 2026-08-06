import DarkModeToggle from "./DarkModeToggle";

export default function PageLayout({ children }) {
  return (
    <div className="page-texture relative min-h-screen flex flex-col bg-cq-bg dark:bg-cq-darkBg text-cq-text dark:text-cq-darkText transition-colors duration-500">
      <DarkModeToggle />

      {/* Masthead header */}
      <header className="relative z-10 overflow-hidden bg-cq-hero dark:bg-cq-hero-dark border-b border-cq-border dark:border-cq-darkBorder">
        <div className="masthead-grain relative">
          {/* Top rail: edition / dateline / folio */}
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-5 text-[0.7rem] font-medium uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
            <span>No. 1 · The Global Edition</span>
            <span className="hidden sm:inline italic font-serif normal-case tracking-normal text-sm text-cq-olive dark:text-cq-darkRing">
              A monthly journal of wander and flavour
            </span>
            <span>"One country, one table"</span>
          </div>

          {/* Nameplate with twin rules */}
          <div className="mx-auto max-w-4xl px-6 pt-8 pb-10 text-center">
            <div className="rule-double mx-auto mb-8 max-w-xl opacity-80" />

            <h1 className="animate-reveal font-serif text-hero font-black leading-none tracking-tight text-cq-text dark:text-cq-darkText">
              Culinary{" "}
              <span className="inline-block bg-gradient-to-br from-cq-primary via-[#d9743b] to-cq-accent bg-clip-text text-transparent">
                Quest
              </span>
              <span className="align-top text-[0.28em] text-cq-primary">©</span>
            </h1>

            <div className="ornament mx-auto mt-6 max-w-xs text-xl">
              <span className="leading-none">❦</span>
            </div>

            <p className="mx-auto mt-5 max-w-md font-serif text-lg italic text-cq-muted dark:text-cq-darkMuted">
              Explore the globe, one dish at a time.
            </p>
          </div>
        </div>

        {/* Soft bottom fade into page bg */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-cq-bg dark:from-cq-darkBg to-transparent" />
      </header>

      {/* Main body — a centred editorial column */}
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-4 pb-24">
        {children}
      </main>

      {/* Running footer */}
      <footer className="relative z-10 border-t border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/40 dark:bg-cq-darkSurface/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-[0.7rem] font-medium uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
          <span>Culinary Quest © MMXXVI</span>
          <span className="italic font-serif normal-case tracking-normal text-sm text-cq-olive dark:text-cq-darkRing">
            Printed on recycled daydreams
          </span>
          <span className="font-serif text-sm normal-case">Folio xvii</span>
        </div>
      </footer>
    </div>
  );
}
