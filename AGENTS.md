# AGENTS.md — Working Guide for AI Coding Agents

This file helps AI agents (and their human partners) work on **Culinary Quest** efficiently and consistently. It describes what the project is, how it's wired together, and the conventions to follow when making changes.

> **Quick orientation:** Culinary Quest is a small, client-side React + Vite app. There is no backend. All "data" comes from two public HTTP APIs. If a change doesn't touch `src/api.js`, `src/App.jsx`, one of the components in `src/components/`, or the Tailwind theme, you're probably in the wrong place.

---

## 1. Project Overview

**Culinary Quest** is a global food adventure — one country at a time.

- A user clicks **Pick Random Country**, and the app fetches/selects a random country.
- The app maps that country to a cuisine, then fetches matching recipes.
- The user clicks **Pick Random Recipe** to reveal a single meal with full instructions.
- The UI is a custom Tailwind theme with light/dark modes and subtle animations.

**Vision** (from the README): *"Culinary Quest isn't just a randomizer — it's a journey. A way to explore the world through flavor, culture, and curiosity."*

---

## 2. Tech Stack (actual, from `package.json`)

| Concern | Technology | Version |
| --- | --- | --- |
| Framework | React | `^19.2.0` |
| Build tool | Vite | `^7.3.1` |
| Styling | Tailwind CSS | `^3.4.19` |
| PostCSS | tailwindcss + autoprefixer | `^8.5.8` |
| Linting | ESLint (flat config) | `^9.39.1` |
| Type checking | TypeScript types (types-only) | `@types/react ^19.2.7` |

> **Note:** The `README.md` badges were corrected to match `package.json` (React 19, Vite 7). When documenting versions, trust `package.json`.

**External data sources:**
- **`src/countries.json` (bundled static)** — country list (name, ISO code, region, subregion). Shipped in-repo because the previously used REST Countries `v3.1/all` endpoint was deprecated and now requires its own API key.
- [flagcdn.com](https://flagcdn.com) — keyless flag images (`/w80/{iso2}.png`).
- [TheMealDB](https://www.themealdb.com) — `api/json/v1/1` (filter by area/category, lookup by id) — no key
- [Spoonacular](https://spoonacular.com) — `recipes/complexSearch` + `recipes/{id}/information` — **optional**, requires `VITE_SPOONACULAR_API_KEY` in `.env` (see `.env.example`). Without a key the app gracefully falls back to TheMealDB + a category fallback.
- [Edamam](https://developer.edamam.com) — `api/recipes/v2` (search) — **optional, PAID only (no free tier, plans start ~$9/mo.)**. Required `VITE_EDAMAM_APP_ID` + `VITE_EDAMAM_APP_KEY`. Returns full recipe objects in search results (no separate detail call). Degrades gracefully without keys. Keep it off unless the user has paid for an account.
- [DeepSeek](https://platform.deepseek.com/api_keys) — `chat/completions` (OpenAI-compatible, **PAID**, no free tier). `VITE_DEEPSEEK_API_KEY` → the app asks the model for a random region-appropriate dish and adds it to the pool, clearly marked "suggested by AI". AI text is unverified; real recipe sources stay primary.

---

## 3. Setup & Commands

```bash
npm install   # install dependencies
npm run dev   # start the Vite dev server
npm run build # build for production into ./dist
npm run lint  # run ESLint over the project
npm run preview # preview the production build
```

There is **no test runner** configured. Do not assume `npm test` exists.

---

## 4. Repository Structure & Key Files

```
culinary-quest/
├── index.html                  # Vite entry HTML (mounts #root)
├── package.json                # deps + scripts; source of truth for versions
├── vite.config.js              # Vite config (React plugin only)
├── postcss.config.js           # Tailwind + autoprefixer
├── tailwind.config.js          # ⚙️ Custom "cq-" theme palette, fonts, shadows, easing
├── eslint.config.js            # ESLint flat config (browser globals, JSX)
├── .gitignore
├── .env.example                # Template for the optional Spoonacular key
├── public/
│   └── vite.svg                # Vite default favicon
└── src/
    ├── main.jsx                # React root — imports ./index.css (required for Tailwind)
    ├── index.css               # Tailwind directives + global fadeIn animation
    ├── App.jsx                 # ⚙️ Top-level state + orchestration of the flow
    ├── api.js                  # ⚙️ API/static fetchers + the full country→cuisine cuisineMap
    ├── countries.json          # Bundled static country list (name, ISO, region) — replaces the deprecated REST Countries API
    ├── cuisines.js             # ⚙️ Resolves a country to a working recipe source (MealDB area / Spoonacular cuisine / Edamam keyword / offline regions / category fallback)
    ├── spoonacular.js          # Optional 2nd recipe source (via VITE_SPOONACULAR_API_KEY)
    ├── edamam.js               # Optional 3rd recipe source, best regional coverage (via VITE_EDAMAM_APP_ID/KEY)
    ├── offline.js              # Bundled offline recipe source (no key, never breaks)
    ├── recipes.json            # ⚙️ Curated offline dishes for cuisines live APIs don't cover
    ├── deepseek.js             # Optional AI recipe suggestions (via VITE_DEEPSEEK_API_KEY)
    ├── normalizeCountryName.js # Normalizes country names for cuisine lookup
    └── components/
        ├── PageLayout.jsx      # ⚙️ Page shell: header, theme-aware background, mounts DarkModeToggle
        ├── CQButton.jsx        # Themed button (brand colors + hover/active/disabled states)
        ├── CQCard.jsx          # Themed card wrapper (surface, border, fadeIn)
        ├── CountryCard.jsx     # Shows flag + name + region of the chosen country
        ├── RecipeCard.jsx      # Shows thumbnail + name + instructions of the meal
        └── DarkModeToggle.jsx  # Persisted dark/light toggle (flips `dark` on <html>)
```

> ✅ Note: `App.css` and `src/assets/react.svg` were dead Vite boilerplate and have been removed.

Legend: `⚙️` = file you will most likely touch; other files are plain presentational components or static assets.

---

## 5. Data Flow & Architecture

There is **no router, no state library, no global CSS framework import beyond Tailwind** — just local React state in `App.jsx`.

```
[PageLayout → header/wrapper + DarkModeToggle]
        │
   App (owns state: countries, country, recipes, recipe, loading, error)
        │
        ├─ on mount: fetchRealCountries()  →  countries[]   (REST Countries)
        │
        ├─ "Pick Random Country" (CQButton)
        │     • random pick from countries[]
        │     • area = resolveMealdbArea(country)          (cuisines.js)
        │     • fetchRecipesByCuisine(area)                (TheMealDB area → some recipes)
        │     • if empty → fetchRecipesByCategory(fallback) (non-empty category pool)
        │     • cuisine = resolveSpoonacularCuisine(country)
        │     • searchRecipesByCuisine(cuisine)            (optional, only if key set)
        │     • merge all into recipes[], recipe = null
        │     • set loading=false; set error on total failure
        │
        └─ "Pick Random Recipe" (CQButton, shown when recipes exist & not loading)
              • random pick from recipes[]
              • if source == "spoonacular" → fetchSpoonacularRecipeDetails(id)
                else                          fetchRecipeDetails(id)      (TheMealDB)
              • → recipe

Rendering:
  CountryCard <= country
  RecipeCard  <= recipe
  (loading / error cards shown via CQCard)
```

### Key details

- **`api.js`**
  - `fetchRealCountries()` reads the bundled `countries.json` and returns `[{ name, flag, region, subregion }]`, where `flag` is a `flagcdn.com/w80/{iso}.png` URL. It is synchronous off the bundle — no live countries API call (the old REST Countries `v3.1/all` is deprecated and keyed).
  - `cuisineMap` is a large static mapping of **country → cuisine concept** (e.g. `"Italy": "Italian"`). It is the flat lookup feed for `cuisines.js`.
  - `fetchRecipesByCuisine(area)` → `https://www.themealdb.com/api/json/v1/1/filter.php?a={area}` returns `data.meals || []`.
  - `fetchRecipesByCategory(category)` → `https://www.themealdb.com/api/json/v1/1/filter.php?c={category}` — the non-empty fallback pool.
  - `fetchRecipeDetails(id)` → `https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}` returns `data.meals[0]`.

- **`cuisines.js`** — the source-of-truth for recipe resolution. Because many `cuisineMap` concepts (e.g. `American`, `African`, `Caribbean`, `Middle Eastern`, `Asian`, `French`, `German`, `Indian`) are **not valid TheMealDB areas and return 0 meals**, this module translates them into valid areas (`resolveMealdbArea`) or Spoonacular cuisines (`resolveSpoonacularCuisine`), and exposes `CATEGORY_FALLBACKS` for when no cuisine works. **Do not add new cuisine→area mappings that TheMealDB doesn't support.**

- **`spoonacular.js`** — the optional, much larger recipe source. Reads `VITE_SPOONACULAR_API_KEY`; returns `[]`/`null` (no throw) when the key is missing so the app degrades gracefully. `searchRecipesMulti()` queries the cuisine **and**, when the cuisine is thin, a rotating signature-ingredient keyword, merging/dedupeing (adaptive: stops early when a cuisine is already well-covered). Search uses `/recipes/complexSearch?cuisine=…|query=…&number=15`; details use `/recipes/{id}/information`. Free tier is 50 points/day (~1.07 pts/call), so the logic is deliberately frugal.

- **`edamam.js`** — the optional third source, with the best regional coverage — but **paid only** (no free tier). Reads `VITE_EDAMAM_APP_ID` + `VITE_EDAMAM_APP_KEY`; returns `[]` if either is missing. Search uses `api/recipes/v2?type=public&q=…`; full recipe objects (ingredients, yield, time) come back in search results, so there is no separate detail call.

- **`offline.js`** — bundled, keyless recipe source powered by `recipes.json`. Matches a country to region tags via `resolveOfflineRegions` (cuisines.js) and returns curated dishes for cuisines live APIs barely cover (Pacific islands, regional African, Latin American, Middle Eastern). No network, never breaks; the trade-off is it only updates when `recipes.json` is regenerated and committed. Live sources are primary — offline enriches the pool.

- **`deepseek.js`** — optional AI dish suggestion (OpenAI-compatible `chat/completions`, paid). Reads `VITE_DEEPSEEK_API_KEY`; returns `null` when the key is missing. Asks the model for one region-appropriate dish as strict JSON and returns it tagged `source: "deepseek"`. AI instructions are unverified — the RecipeCard marks them "Suggested by AI" and the real verified sources stay the foundation.

- **`normalizeCountryName.js`** — lowercases, strips every non-`[a-z\s]` character, and trims.

- **Recipe source fallback chain:** valid TheMealDB area → category fallback pool → (optional) Spoonacular cuisine → (optional) Edamam keyword → bundled offline pool → (optional) DeepSeek AI draft → friendly error if absolutely nothing matches.

---

## 6. Conventions & Patterns

### Component style
- Presentational components (`CQButton`, `CQCard`, `PageLayout`, `CountryCard`, `RecipeCard`) are single-responsibility and accept props/`children`.
- Cards are built by composition: `CountryCard`/`RecipeCard` wrap content in `CQCard`.
- Components that render nothing when data is missing return `null` early (e.g., `if (!country) return null;`).

### Styling (Tailwind + "cq-" theme)
- Prefer Tailwind utilities directly in `className`.
- **Use the custom color tokens** from `tailwind.config.js` under the `cq` namespace: `bg-cq-bg`, `text-cq-primary`, `bg-cq-surface`, `border-cq-border`, `shadow-cq`, `ease-cq-smooth`, etc.
- **Every surface/color has a dark variant** with the `dark:` prefix (e.g., `dark:bg-cq-darkBg`). Dark mode is class-based (`darkMode: "class"`), so the `dark` class must be present on a parent element for `dark:` utilities to apply.
- Fonts: use `font-serif` (`Playfair Display`) for display heading, `font-sans` (`Inter`) for body.
- Keep animations subtle: the global `fadeIn` animation and `animate-fadeIn` class live in `src/index.css`.

### JavaScript
- `.jsx` files for components (ES modules, `export default`).
- Functional React + hooks (`useState`, `useEffect`) only — no class components.
- Error handling in `api.js` is "fail soft": log to `console.error` and return empty/safe values.

---

## 7. Known Gaps / Gotchas (read before editing)

- **TheMealDB is small and does NOT cover all cuisines.** Only ~28 "areas" return real meals; `American`, `African`, `Caribbean`, `Middle Eastern`, `Asian`, `French`, `German`, `Indian`, `Dutch` all return **0**. This is why `cuisines.js` exists. When touching recipe sources, preserve the guarantee that no country ends up with zero recipes (area → category fallback → Spoonacular → error).
- **Spoonacular is optional but free (50 pts/day).** All new recipe logic must work with **no API key**; without a key the app uses TheMealDB + category fallback only. Don't make Spoonacular a hard dependency. Edamam is optional too but is **paid** — keep it purely optional and never a requirement.
- **`App.css` and `src/assets/react.svg` were removed** as dead Vite boilerplate (they weren't imported anywhere).
- **Country data is now a bundled static list** (`src/countries.json`). The old public REST Countries endpoint is deprecated/keyed, so if you need to refresh it, regenerate from a stable source (e.g. the `mledoze/countries` `dist/countries.json`) and keep the same shape `{ name, cca2, region, subregion }`. Flags load from keyless `flagcdn.com`.
- **No tests.** If you add logic that matters (especially around `cuisines.js` / `cuisineMap` / normalization), adding a simple test harness would be a meaningful improvement, but set it up from scratch.
- **`.env` is gitignored** — real Spoonacular keys must go in a local `.env`, never committed. Only `.env.example` (documenting the variable) is tracked.

---

## 8. Extension Points (future features)

The README names these as intended next steps. In each case, the natural starting point is `App.jsx` (state + wiring) and new components under `src/components/`:

- **Quest Log** — record visited countries/dishes. Would add state for history + a list component.
- **Favorites** — persist favorite meals. Would need `localStorage` or similar (no backend exists).
- **Map Selector** — geographically pick a country instead of random. Would consume the existing `countries[]` (which already includes `region`/`subregion`).
- **Pagination / "load more"** — Spoonacular already returns `totalResults`; exposing `offset` pagination would let the UI grow the recipe list on demand.

When adding a feature: keep data fetching in `api.js`/`spoonacular.js`, keep presentational components dumb, and compose with `CQCard`/`CQButton` + `cq-` theme tokens so the UI stays consistent.
