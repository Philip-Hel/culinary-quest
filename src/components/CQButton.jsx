export default function CQButton({ children, disabled = false, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-2xl px-7 py-3.5 transition-all duration-300 ease-cq-smooth select-none";

  const primary =
    "btn-shine bg-cq-brand enabled:hover:bg-cq-brand-hover text-white shadow-cq-btn enabled:hover:shadow-cq-lg";

  const secondary =
    "bg-cq-surface dark:bg-cq-darkSurface2 text-cq-primary dark:text-cq-darkText border border-cq-border dark:border-cq-darkBorder shadow-cq hover:shadow-cq-lg";

  const styles = variant === "secondary" ? secondary : primary;

  const state =
    "enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      {...props}
      type="button"
      disabled={disabled}
      className={`${base} ${styles} ${state} ${className}`}
    >
      {children}
    </button>
  );
}
