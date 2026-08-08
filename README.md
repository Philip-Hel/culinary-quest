🍽️ Culinary Quest
A global food adventure — one country at a time.


🏷️ Badges
<p align="center">
<img src="https://img.shields.io/badge/version-1.0.0-c44536?style=for-the-badge" alt="Version Badge"/><img src="https://img.shields.io/badge/build-passing-4a7c59?style=for-the-badge" alt="Build Passing"/><img src="https://img.shields.io/badge/license-MIT-2f2f2f?style=for-the-badge" alt="MIT License"/><img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React Badge"/><img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss" alt="Tailwind Badge"/><img src="https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite" alt="Vite Badge"/>
</p>

👁️ Overview
Culinary Quest is a React + Vite application that transforms cooking into exploration. With a single click, you’re transported to a random country, complete with its flag, region, and recipes inspired by its cuisine. It blends elegant UI design with smooth interactions, powered by Tailwind CSS and a custom theme.

🧭 Features
- Random Country Generator — Explore the world one click at a time
- Cuisine-Based Recipe Suggestions — Automatically maps every country to a working recipe source
- Multi-Source Recipes — TheMealDB by default, with an optional Spoonacular integration for a much larger recipe pool
- Premium Tailwind UI — Custom palette, shadows, typography, animations
- Dark Mode — Smooth, persistent theme toggle
- Loading & Error States — Clear feedback while searching and when no recipes are found
- Recipe Book (Favorites) — Save dishes you like and search them by country, cuisine, or name (persisted locally)
- Modern Stack — React + Vite + Tailwind
- Expandable Architecture — Quest Log, Map Selector, and more

🛠️ Tech Stack
- React + Vite
- Tailwind CSS (custom theme)
- Bundled static country list (no country API needed) + flagcdn.com for flags
- TheMealDB (recipes, default)
- Spoonacular (recipes, optional — see Getting Started)
- Edamam (recipes, optional, paid — see Getting Started)
- DeepSeek (optional AI recipe suggestions — see Getting Started)
- Bundled offline recipe pool (curated dishes for cuisines live APIs don't cover: Pacific islands, regional African, Latin American, etc.)
- Node.js

🚀 Getting Started
npm install
npm run dev

Optional: enable the larger recipe sources
- Lowest effort: create the free Spoonacular key at https://spoonacular.com (50 free points/day, no credit card via Spoonacular directly). It's the largest genuinely-free source. The app queries the country's cuisine plus a rotating signature-ingredient keyword, and stops early when a cuisine is already well-covered — so a typical visit costs ~1–3 points (roughly 15–45 country picks/day on the free tier).
- Edamam is **not free** (paid only, plans start ~$9/mo) — skip it unless you want to pay. The code supports it if you add credentials later.
- DeepSeek (optional): add a key from https://platform.deepseek.com/api_keys to have the app suggest a fresh, region-appropriate dish via AI alongside the real ones. Paid (cheap), no free tier; instructions are AI-written and marked as unverified.
- Copy `.env.example` to `.env` and set whatever keys you have:
   VITE_SPOONACULAR_API_KEY=your-spoonacular-key
   VITE_EDAMAM_APP_ID=your-edamam-app-id
   VITE_EDAMAM_APP_KEY=your-edamam-app-key
   VITE_DEEPSEEK_API_KEY=your-deepseek-key
  The app works without any of these — it just uses TheMealDB plus a category fallback. Each enabled source adds more recipes per country.



📁 Project Structure
src/
  components/
    CQButton.jsx
    CQCard.jsx
    CountryCard.jsx
    RecipeCard.jsx
    PageLayout.jsx
    DarkModeToggle.jsx
    FavoritesView.jsx  # searchable/filterable list of saved recipes
  api.js
  countries.json  # bundled static country list (name, ISO, region)
  cuisines.js       # resolves a country to a working recipe source
  spoonacular.js    # optional second, larger recipe API
  edamam.js         # optional third recipe API (best regional coverage)
  offline.js        # bundled offline recipe pool for cuisines live APIs don't cover
  recipes.json      # curated offline dishes (Pacific, African, Latin American, ...)
  deepseek.js       # optional AI recipe suggestions (VITE_DEEPSEEK_API_KEY)
  favorites.js      # local Recipe Book storage (localStorage)
  App.jsx
  main.jsx
  index.css



🌟 Vision
Culinary Quest isn’t just a randomizer — it’s a journey.
A way to explore the world through flavor, culture, and curiosity.
The goal is to build an experience that feels warm, premium, and full of discovery.
