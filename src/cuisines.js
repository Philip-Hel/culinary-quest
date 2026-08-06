import { cuisineMap } from "./api";

// Normalize a country/region name for lookup: strip diacritics (Türkiye → T),
// lowercase, keep only letters/spaces. This makes keys robust to accented
// names and the (mis)matches between the country list and cuisineMap.
const normalize = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim();

// cuisineMap stores its keys in proper case (e.g. "Belarus"). Build a
// lowercased index once so lookups are case-insensitive regardless of casing.
const CUISINE_BY_NORMALIZED = {};
for (const [key, value] of Object.entries(cuisineMap)) {
  CUISINE_BY_NORMALIZED[normalize(key)] = value;
}

// The bundled country list uses some names that differ from cuisineMap's keys
// (e.g. "South Korea" vs "Korea (South)", "Türkiye" vs "Turkey"). Alias the
// common variants to their cuisine concept so they get the right recipes.
const COUNTRY_ALIASES = {
  // Name mismatches between the bundled list and cuisineMap
  "south korea": "Japanese",
  "north korea": "Japanese",
  "turkiye": "Turkish",      // bundled "Türkiye" vs cuisineMap "Turkey"
  "czechia": "Croatian",     // vs "Czech Republic"
  "czech republic": "Croatian",
  "cape verde": "African",   // vs "Cabo Verde"
  "ivory coast": "African",  // vs "Côte d'Ivoire"
  "congo": "African",        // vs "Republic of the Congo" nuance
  "dr congo": "African",
  "hong kong": "Chinese",
  "macau": "Chinese",
  "palestine": "Middle Eastern",
  "kosovo": "Croatian",
  // Territories / islands that deserve a specific parent cuisine
  "guernsey": "British",
  "jersey": "British",
  "isle of man": "British",
  "gibraltar": "Spanish",
  "greenland": "Danish",
  "faroer": "Danish",
  "french polynesia": "French",
  "new caledonia": "French",
  "reunion": "French",
  "guadeloupe": "French",
  "martinique": "French",
  "puerto rico": "Caribbean",
  // French overseas departments / territories
  "french guiana": "French",
  "saint pierre and miquelon": "French",
  "saint barthelemy": "French",
  // Caribbean territories (should be Caribbean, not American)
  "aruba": "Caribbean",
  "anguilla": "Caribbean",
  "caribbean netherlands": "Caribbean",
  "cayman islands": "Caribbean",
  "curacao": "Caribbean",
  "montserrat": "Caribbean",
  "sint maarten": "Caribbean",
  "saint martin": "Caribbean",
  "turks and caicos islands": "Caribbean",
  "us virgin islands": "Caribbean",
  "united states virgin islands": "Caribbean",
  "bermuda": "British",
  "british virgin islands": "Caribbean",
  "falkland islands": "British",
  "saint helena ascension and tristan da cunha": "British",
};

// Region-level default so territories and islands still get a sensible,
// regional cuisine instead of everything collapsing to "American".
const REGION_FALLBACK = {
  // top-level regional groups (countries.json "region")
  oceania: "Australian",
  asia: "Japanese",
  africa: "Moroccan",
  americas: "American",
  europe: "Italian",
  antarctic: "British",
  // subregions — Pacific island nations have no authentic cuisine in either
  // API, so the geographically-closest real pool (Australian) stands in.
  caribbean: "Caribbean",
  polynesia: "Australian",
  "australia and new zealand": "Australian",
  "northern europe": "British",
  "southern europe": "Italian",
  "southeastern europe": "Croatian",
  "eastern europe": "Russian",
  "central europe": "Polish",
  "western europe": "French",
  "western africa": "African",
  "eastern africa": "African",
  "northern africa": "African",
  "middle africa": "African",
  "southern africa": "African",
  "eastern asia": "Chinese",
  "southeast asia": "Thai",
  "western asia": "Middle Eastern",
  "central asia": "Russian",
  micronesia: "Australian",
  melanesia: "Australian",
  "north america": "American",
  "south america": "American",
};

// Look up a country (and its region/subregion) and return a cuisine concept.
// Tries, in order: an explicit name alias, the country in cuisineMap, then a
// region- or subregion-based default.
function lookupConcept(name, region, subregion) {
  return (
    COUNTRY_ALIASES[normalize(name)] ||
    CUISINE_BY_NORMALIZED[normalize(name)] ||
    REGION_FALLBACK[normalize(region)] ||
    REGION_FALLBACK[normalize(subregion)] ||
    ""
  );
}

// Cuisine / recipe-source resolution.
//
// WHY THIS FILE EXISTS
// --------------------
// TheMealDB's /filter.php?a={area} endpoint only returns data for a small set
// of "area" codes. Values like "American", "African", "Caribbean", "Middle
// Eastern", "Asian", "French", "German", "Indian" or "Dutch" all return ZERO
// meals. The original cuisineMap mapped huge numbers of countries (and used
// "American" as a global default) to those broken codes, so most countries
// produced no recipes at all and the "Pick Random Recipe" button never appeared.
//
// This module resolves a country to a recipe source that ACTUALLY works:
//  1. a valid TheMealDB area (so the app never dead-ends), and
//  2. a Spoonacular cuisine (to scale the list out — Spoonacular has far more
//     recipes, filterable by its own cuisine vocabulary).

// Valid TheMealDB areas that return real meals (verified against the live API).
export const VALID_MEALDB_AREAS = [
  "Algerian", "Australian", "British", "Canadian", "Chinese", "Croatian",
  "Egyptian", "Filipino", "Greek", "Irish", "Italian", "Jamaican", "Japanese",
  "Kenyan", "Malaysian", "Mexican", "Moroccan", "Polish", "Portuguese",
  "Russian", "Spanish", "Syrian", "Thai", "Tunisian", "Turkish", "Ukrainian",
  "Uruguayan", "Vietnamese"
];

// Translate a cuisine *concept* (the values in cuisineMap) into a TheMealDB
// area that actually returns meals. Broad culinary regions resolve to the
// closest area TheMealDB supports.
const MEALDB_AREA_BY_CONCEPT = {
  "American": "Australian",
  "Latin American": "Mexican",
  "British": "British",
  "Indian": "British",
  "Middle Eastern": "Turkish",
  "African": "Moroccan",
  "Caribbean": "Jamaican",
  "Asian": "Japanese",
  "French": "Italian",
  "German": "Polish",
  "Dutch": "British",
  "Irish": "Irish",
  "Greek": "Greek",
  "Italian": "Italian",
  "Spanish": "Spanish",
  "Portuguese": "Portuguese",
  "Mexican": "Mexican",
  "Chinese": "Chinese",
  "Japanese": "Japanese",
  "Thai": "Thai",
  "Vietnamese": "Vietnamese",
  "Malaysian": "Malaysian",
  "Filipino": "Filipino",
  "Turkish": "Turkish",
  "Egyptian": "Egyptian",
  "Moroccan": "Moroccan",
  "Tunisian": "Tunisian",
  "Syrian": "Syrian",
  "Algerian": "Algerian",
  "Russian": "Russian",
  "Polish": "Polish",
  "Ukrainian": "Ukrainian",
  "Croatian": "Croatian",
  "Canadian": "Canadian",
  "Kenyan": "Kenyan",
  "Jamaican": "Jamaican",
  "Australian": "Australian",
  "Uruguayan": "Uruguayan"
};

// Spoonacular slang/cuisine term for each cuisine concept.
const SPOONACULAR_BY_CONCEPT = {
  "American": "american",
  "Latin American": "latin american",
  "British": "british",
  "Indian": "indian",
  "Middle Eastern": "middle eastern",
  "African": "moroccan",
  "Caribbean": "caribbean",
  "Asian": "japanese",
  "French": "french",
  "German": "german",
  "Dutch": "british",
  "Irish": "irish",
  "Greek": "greek",
  "Italian": "italian",
  "Spanish": "spanish",
  "Portuguese": "portuguese",
  "Mexican": "mexican",
  "Chinese": "chinese",
  "Japanese": "japanese",
  "Thai": "thai",
  "Vietnamese": "vietnamese",
  "Malaysian": "malaysian",
  "Filipino": "filipino",
  "Turkish": "moroccan",
  "Egyptian": "moroccan",
  "Moroccan": "moroccan",
  "Tunisian": "moroccan",
  "Syrian": "middle eastern",
  "Algerian": "moroccan",
  "Russian": "russian",
  "Polish": "polish",
  "Ukrainian": "russian",
  "Croatian": "croatian",
  "Canadian": "american",
  "Kenyan": "african",
  "Jamaican": "caribbean",
  "Australian": "british",
  "Uruguayan": "american"
};

// TheMealDB categories always return lots of meals regardless of country.
// We rotate through them as a final safety net so the recipe button never
// silently disappears.
export const CATEGORY_FALLBACKS = [
  "Beef", "Chicken", "Seafood", "Vegetarian", "Pasta", "Dessert"
];

// Resolve a country (name + region) to the best recipe-source the app should
// try first with TheMealDB. Gets the cuisine concept from cuisineMap (via the
// case-insensitive index), then translates it to a valid area. Returns null
// only if no valid area exists.
export function resolveMealdbArea({ name, region, subregion }) {
  const concept = lookupConcept(name, region, subregion) || "American";

  const area = MEALDB_AREA_BY_CONCEPT[concept];
  if (area && VALID_MEALDB_AREAS.includes(area)) return area;

  // No valid area (shouldn't happen given the default above) — rotate a
  // category fallback instead.
  return null;
}

// Resolve a country to a Spoonacular cuisine string for the second API.
export function resolveSpoonacularCuisine({ name, region, subregion }) {
  const concept = lookupConcept(name, region, subregion) || "American";

  return SPOONACULAR_BY_CONCEPT[concept] ||
    subregion?.toLowerCase?.() ||
    region?.toLowerCase?.() ||
    "american";
}

// Edamam recognises cuisine names as both a search term (q) and a filter
// (cuisineType). Return the best keyword for a country so thin cuisines (or the
// broad region fallbacks, e.g. "African") still get many results.
const EDAMAM_KEYWORD_BY_CONCEPT = {
  "American": "american cuisine",
  "Latin American": "latin american",
  British: "british",
  Indian: "indian",
  "Middle Eastern": "middle eastern",
  African: "african",
  Caribbean: "caribbean",
  Asian: "asian",
  French: "french",
  German: "german",
  Irish: "irish",
  Greek: "greek",
  Italian: "italian",
  Spanish: "spanish",
  Portuguese: "portuguese",
  Mexican: "mexican",
  Chinese: "chinese",
  Japanese: "japanese",
  Thai: "thai",
  Vietnamese: "vietnamese",
  Malaysian: "malaysian",
  Filipino: "filipino",
  Turkish: "turkish",
  Egyptian: "egyptian",
  Moroccan: "moroccan",
  Tunisian: "tunisian",
  Polish: "polish",
  Russian: "russian",
  Ukrainian: "ukrainian",
  Croatian: "croatian",
  Jamaican: "jamaican",
  Kenyan: "kenyan",
  Danish: "danish",
};

export function resolveEdamam({ name, region, subregion }) {
  const concept = lookupConcept(name, region, subregion) || "American";
  const fallbackName = String(name || "").trim();
  return {
    // Prefer the cuisine keyword; fall back to the country name itself.
    keyword: EDAMAM_KEYWORD_BY_CONCEPT[concept] || fallbackName,
    cuisineType: concept.toLowerCase(),
    countryName: fallbackName,
  };
}

// Signature-ingredient / dish keywords to broaden Spoonacular results for
// cuisines where a plain cuisine search is thin. Rotated among so each pick
// surfaces a different slice of the country's food without burning quota.
const INGREDIENT_KEYWORDS = {
  African: ["jollof", "okra", "peanut stew", "plantain"],
  "Latin American": ["empanadas", "ceviche", "arepa", "mole"],
  Caribbean: ["callaloo", "rice and peas", "pepperpot", "ackee"],
  "Middle Eastern": ["hummus", "falafel", "shawarma", "kabsa"],
  Asian: ["stir fry", "noodle", "curry", "rice bowl"],
  Australian: ["barbecue", "lamington", "pavlova", "seafood"],
  Indian: ["curry", "tandoori", "dal", "biryani"],
  Mexican: ["tacos", "guacamole", "enchilada", "pozole"],
  Thai: ["pad thai", "green curry", "tom yum", "massaman"],
  Jamaican: ["jerk chicken", "oxtail", "ackee", "curry goat"],
  Vietnamese: ["pho", "banh mi", "spring rolls", "bun cha"],
  Chinese: ["dumplings", "kung pao", "fried rice", "dim sum"],
  Japanese: ["sushi", "ramen", "teriyaki", "katsu"],
  Turkish: ["kebab", "borek", "meze", "sis kebab"],
  Greek: ["souvlaki", "moussaka", "spanakopita", "tzatziki"],
  Spanish: ["paella", "tapas", "gazpacho", "chorizo"],
  British: ["fish and chips", "roast", "shepherds pie", "scones"],
  French: ["coq au vin", "ratatouille", "crepe", "boeuf bourguignon"],
  Italian: ["risotto", "pasta", "bruschetta", "tiramisu"],
  Egyptian: ["koshari", "ful medames", "molokhia"],
  Moroccan: ["tagine", "couscous", "harissa"],
  Kenyan: ["ugali", "sukuma", "biryani"],
  Polish: ["pierogi", "bigos", "kielbasa"],
  Russian: ["borscht", "pelmeni", "blini"],
  Croatian: ["cevapi", "sarma", "raznjici"],
};

export function resolveSpoonacularKeywords({ name, region, subregion }) {
  const concept = lookupConcept(name, region, subregion) || "American";
  return INGREDIENT_KEYWORDS[concept] || [];
}

// Map a country to the region tags used by the bundled offline recipe pool
// (src/recipes.json). Live sources are primary; these tags decide which curated
// offline dishes are available as a fallback for the gaps live APIs don't cover.
const REGION_TAGS = {
  // Pacific / Oceania
  polynesia: "pacific",
  melanesia: "pacific",
  micronesia: "pacific",
  oceania: "pacific",
  // Africa
  "western africa": "west-africa",
  "middle africa": "west-africa",
  "eastern africa": "east-africa",
  "southern africa": "east-africa",
  "northern africa": "north-africa",
  // Americas
  caribbean: "caribbean",
  "south america": "latin-america",
  "central america": "latin-america",
  // Middle East (only when cuisine concept is Middle Eastern, else generic)
  "western asia": "middle-east",
};

const CONCEPT_REGION_TAG = {
  African: ["east-africa", "west-africa"],
  Caribbean: ["caribbean"],
  "Latin American": ["latin-america"],
  "Middle Eastern": ["middle-east"],
};

export function resolveOfflineRegions({ name, region, subregion }) {
  const tags = new Set();
  const subnorm = String(subregion || "").toLowerCase();
  const regnorm = String(region || "").toLowerCase();
  const add = (t) => t && tags.add(t);

  // Prefer the precise geographic tag (subregion, then region).
  add(REGION_TAGS[subnorm]);
  add(REGION_TAGS[regnorm]);

  // Only when no precise geographic tag matched, fall back to the broad
  // cuisine-concept tag so every country in that cuisine still gets coverage
  // (e.g. any African country not in a tagged subregion).
  if (tags.size === 0) {
    const concept = lookupConcept(name, region, subregion) || "";
    for (const t of CONCEPT_REGION_TAG[concept] || []) tags.add(t);
  }

  return tags;
}
