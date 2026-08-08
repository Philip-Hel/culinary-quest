import { useState } from "react";
import CQButton from "./CQButton";

// AI tweak panel: quick presets + a free-text prompt for revising the current
// recipe with AI. Presentational — calls onApply(instruction).
const PRESETS = [
  "Make it vegetarian",
  "Make it lower-carb",
  "Make it spicier",
  "Use fewer ingredients",
  "Make it gluten-free",
  "Make it healthier / lighter",
];

export default function AiTweakPanel({ onApply, onClose, busy }) {
  const [instruction, setInstruction] = useState("");

  const apply = (text) => {
    const next = text.trim();
    if (next) onApply(next);
  };

  return (
    <div className="w-full rounded-2xl border border-cq-border/70 dark:border-cq-darkBorder/70 bg-cq-surface/90 dark:bg-cq-darkSurface2/80 p-5 shadow-cq dark:shadow-cqDark">
      <div className="flex items-start justify-between">
        <h4 className="font-serif text-lg font-bold text-cq-text dark:text-cq-darkText">
          Tweak this recipe with AI
        </h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tweak panel"
          className="text-cq-muted hover:text-cq-primary text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={busy}
            onClick={() => apply(p)}
            className="rounded-full border border-cq-border/70 dark:border-cq-darkBorder bg-cq-accentSoft/30 dark:bg-cq-darkSurface2 px-3 py-1 text-sm text-cq-text dark:text-cq-darkText hover:border-cq-accent disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="…or type your own tweak (e.g. add lime, no peanuts)"
          value={instruction}
          disabled={busy}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply(instruction)}
          className="flex-1 rounded-xl border border-cq-border dark:border-cq-darkBorder bg-cq-surface dark:bg-cq-darkSurface2 px-3 py-2 text-sm text-cq-text dark:text-cq-darkText placeholder:text-cq-muted focus:outline-none focus:ring-2 focus:ring-cq-accent/50"
        />
        <CQButton disabled={busy || !instruction.trim()} onClick={() => apply(instruction)}>
          {busy ? "Tweaking…" : "Tweak"}
        </CQButton>
      </div>
    </div>
  );
}
