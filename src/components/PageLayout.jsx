import DarkModeToggle from "./DarkModeToggle";

export default function PageLayout({ children }) {
  return (
    <div className="page-texture relative min-h-screen flex flex-col bg-cq-bg dark:bg-cq-darkBg text-cq-text dark:text-cq-darkText transition-colors duration-500">
      <DarkModeToggle />

      {/* Compact masthead bar */}
      <header className="relative z-10 border-b border-cq-border dark:border-cq-darkBorder bg-cq-hero dark:bg-cq-hero-dark">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-2xl font-black tracking-tight text-cq-text dark:text-cq-darkText sm:text-3xl">
              Culinary{" "}
              <span className="bg-gradient-to-br from-cq-primary via-[#d9743b] to-cq-accent bg-clip-text text-transparent">
                Quest
              </span>
            </h1>
            <p className="hidden font-serif italic text-cq-muted dark:text-cq-darkMuted md:inline">
              Explore the globe, one dish at a time.
            </p>
          </div>
          <span className="hidden text-[0.7rem] font-medium uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted sm:inline">
            No. 1 · The Global Edition
          </span>
        </div>
      </header>

      {/* Main body — wide container that hosts the two-column layout */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-24 sm:px-6">
        {children}
      </main>

      {/* Running footer */}
      <footer className="relative z-10 border-t border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/40 dark:bg-cq-darkSurface/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 text-[0.7rem] font-medium uppercase tracking-wideish text-cq-muted dark:text-cq-darkMuted">
          <span>Culinary Quest © MMXXVI</span>
          <span className="hidden italic font-serif normal-case tracking-normal text-sm text-cq-olive dark:text-cq-darkRing sm:inline">
            Printed on recycled daydreams
          </span>
          <span className="font-serif text-sm normal-case">Folio xvii</span>
        </div>
      </footer>
    </div>
  );
}
