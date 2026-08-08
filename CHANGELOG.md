# Changelog

All notable changes to **Culinary Quest** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres (in spirit) to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> The version badge in `README.md` says `1.0.0`, but `package.json` currently declares `0.0.0`. Versions below reflect repository history as reconstructed from the git log.

---

## [Unreleased]

### Added
- **Spoonacular integration** (optional second, much larger recipe source) via `src/spoonacular.js`; enabled with `VITE_SPOONACULAR_API_KEY` in `.env` (see `.env.example`).
- **Spoonacular adaptive broadening** — when a country's cuisine is thin, also query a rotating signature-ingredient keyword and merge/dedupe; stops early when a cuisine is well-covered, staying frugal within the 50-point/day free tier.
- **Edamam integration** (optional third source, best regional coverage, but **paid only** — no free tier) via `src/edamam.js`; enabled with `VITE_EDAMAM_APP_ID` + `VITE_EDAMAM_APP_KEY`. Returns complete recipe objects in search results (no separate detail call).
- **Bundled offline recipe pool** (`src/offline.js` + `src/recipes.json`) for cuisines live APIs don't cover (Pacific islands, regional African, Latin American, Middle Eastern). Keyless, offline, never breaks; live sources stay primary.
- **DeepSeek AI suggestions** (`src/deepseek.js`, paid/optional) — with `VITE_DEEPSEEK_API_KEY` set, the app asks the model for a random region-appropriate dish and adds it to the pool, marked "Suggested by AI" (AI text is unverified; real recipes remain primary).
- **Recipe Book (Favorites)** (`src/favorites.js` + `FavoritesView.jsx`) — save dishes you like and search them by country, cuisine, or name; filter by cuisine. Persisted in `localStorage`.
- **`src/cuisines.js`** — resolves any country to a working recipe source (valid TheMealDB area → category fallback → Spoonacular → Edamam).
- **Dark Mode toggle** (`DarkModeToggle.jsx`) — persistent via `localStorage`, defaults to system preference.
- **Loading & error states** while fetching recipes, with friendly inline messages.

### Fixed
- **Most countries produced no recipes** (silent dead-end). The old code mapped countries/regions to TheMealDB "area" values that return zero meals (`American`, `African`, `Caribbean`, `Middle Eastern`, `Asian`, `French`, `German`, `Indian`, `Dutch`). Countries now resolve to a valid area or a non-empty category fallback.
- **Country data source down.** REST Countries deprecated its free public endpoint (now requires a key), which broke the app's ability to load any countries. Replaced with a bundled static list (`src/countries.json`) + keyless `flagcdn.com` flags. No country API key required and it can't break on external deprecation.

### Changed / Cleaned
- `Recipes by cuisine` fallback: category pool used when a cuisine is empty.
- Removed dead Vite boilerplate (`src/App.css`, `src/assets/react.svg`).
- Updated `README.md` structure + version badges to match the real stack (React 19, Vite 7).

### Planned (from the project README)
- Quest Log — record visited countries / dishes
- Map Selector — pick a country geographically

### Known limitations
- No automated test suite
- Spoonacular is free (50 pts/day); Edamam is **paid** and DeepSeek is **paid**. Without Spoonacular the app relies on TheMealDB + category fallback (smaller pool)

---

## [0.1.0] — Inception

The initial version of the app, reconstructed from the repository's early commits.

### Added
- React + Vite project scaffolding
- Tailwind CSS integration with a custom `cq-` theme (brand palette, fonts, shadows, easing)
- Global `fadeIn` animation in `index.css`
- **Data layer** (`src/api.js`):
  - `fetchRealCountries()` via REST Countries API `v3.1/all`
  - Full global country → cuisine mapping (`cuisineMap`)
  - `fetchRecipesByCuisine(area)` and `fetchRecipeDetails(id)` via TheMealDB
- **Normalization** (`src/normalizeCountryName.js`) to make country names safe for cuisine lookup
- **Components:**
  - `PageLayout` — page shell with theme-aware header
  - `CQButton` — branded, interactive button
  - `CQCard` — reusable themed card
  - `CountryCard` — flag, name, region
  - `RecipeCard` — thumbnail, name, instructions
- **Orchestration** (`src/App.jsx`): random country → cuisine → random recipe flow
- README and LICENSE (MIT)

[Unreleased]: https://github.com/Philip-Hel/culinary-quest
[0.1.0]: https://github.com/Philip-Hel/culinary-quest
