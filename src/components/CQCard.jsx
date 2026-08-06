export default function CQCard({ children, interactive = false, className = "" }) {
  return (
    <div
      className={`
        animate-fadeIn relative
        bg-cq-surface dark:bg-cq-darkSurface
        rounded-sm
        shadow-cq dark:shadow-cqDark
        ring-1 ring-cq-border/50 dark:ring-cq-darkBorder/60
        transition-all duration-500 ease-cq-smooth
        ${interactive ? "hover:-translate-y-1.5 hover:shadow-cq-lg dark:hover:shadow-cqDark-lg" : ""}
        ${className}
      `}
    >
      {/* fine upper hairline for a "printed sheet" feel */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cq-accentSoft/80 to-transparent" />
      {children}
    </div>
  );
}
