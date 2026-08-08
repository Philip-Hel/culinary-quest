// Load the bundled country list.
//
// The public REST Countries API (restcountries.com/v3.1/all) was deprecated and
// now requires its own API key, so we no longer call it. Instead we ship a
// static snapshot (src/countries.json: name, ISO code, region, subregion,
// capital, area, latlng, languages) and pull flag images from the free, keyless
// flagcdn.com CDN. This never breaks, needs no key, and works offline.
import countries from "./countries.json";

export async function fetchRealCountries() {
  try {
    return countries.map((c) => ({
      name: c.name,
      flag: `https://flagcdn.com/w80/${c.cca2.toLowerCase()}.png`,
      region: c.region,
      subregion: c.subregion,
      capital: c.capital,
      area: c.area,
      latlng: c.latlng,
      languages: c.languages,
    }));
  } catch (err) {
    console.error("Failed to load country data:", err);
    return [];
  }
}

// FULL GLOBAL COUNTRY → CUISINE MAPPING
export const cuisineMap = {
  "Afghanistan": "Middle Eastern",
  "Albania": "Croatian",
  "Algeria": "African",
  "Andorra": "French",
  "Angola": "African",
  "Antigua and Barbuda": "Caribbean",
  "Argentina": "Latin American",
  "Armenia": "Middle Eastern",
  "Australia": "British",
  "Austria": "German",
  "Azerbaijan": "Middle Eastern",

  "Bahamas": "Caribbean",
  "Bahrain": "Middle Eastern",
  "Bangladesh": "Indian",
  "Barbados": "Caribbean",
  "Belarus": "Russian",
  "Belgium": "French",
  "Belize": "Caribbean",
  "Benin": "African",
  "Bhutan": "Indian",
  "Bolivia": "Latin American",
  "Bosnia and Herzegovina": "Croatian",
  "Botswana": "African",
  "Brazil": "Latin American",
  "Brunei": "Malaysian",
  "Bulgaria": "Croatian",
  "Burkina Faso": "African",
  "Burundi": "African",

  "Cabo Verde": "African",
  "Cambodia": "Thai",
  "Cameroon": "African",
  "Canada": "Canadian",
  "Central African Republic": "African",
  "Chad": "African",
  "Chile": "Latin American",
  "China": "Chinese",
  "Colombia": "Latin American",
  "Comoros": "African",
  "Congo": "African",
  "Costa Rica": "Latin American",
  "Croatia": "Croatian",
  "Cuba": "Caribbean",
  "Cyprus": "Greek",
  "Czech Republic": "Croatian",

  "Denmark": "British",
  "Djibouti": "African",
  "Dominica": "Caribbean",
  "Dominican Republic": "Caribbean",

  "Ecuador": "Latin American",
  "Egypt": "Egyptian",
  "El Salvador": "Latin American",
  "Equatorial Guinea": "African",
  "Eritrea": "African",
  "Estonia": "Russian",
  "Eswatini": "African",
  "Ethiopia": "African",

  "Fiji": "Australian",
  "Finland": "British",
  "France": "French",

  "Gabon": "African",
  "Gambia": "African",
  "Georgia": "Middle Eastern",
  "Germany": "German",
  "Ghana": "African",
  "Greece": "Greek",
  "Grenada": "Caribbean",
  "Guatemala": "Latin American",
  "Guinea": "African",
  "Guinea-Bissau": "African",
  "Guyana": "Caribbean",

  "Haiti": "Caribbean",
  "Honduras": "Latin American",
  "Hungary": "Croatian",

  "Iceland": "British",
  "India": "Indian",
  "Indonesia": "Malaysian",
  "Iran": "Middle Eastern",
  "Iraq": "Middle Eastern",
  "Ireland": "Irish",
  "Israel": "Middle Eastern",
  "Italy": "Italian",

  "Jamaica": "Jamaican",
  "Japan": "Japanese",
  "Jordan": "Middle Eastern",

  "Kazakhstan": "Russian",
  "Kenya": "Kenyan",
  "Kiribati": "Australian",
  "Korea (North)": "Japanese",
  "Korea (South)": "Japanese",
  "Kuwait": "Middle Eastern",
  "Kyrgyzstan": "Russian",

  "Laos": "Thai",
  "Latvia": "Russian",
  "Lebanon": "Middle Eastern",
  "Lesotho": "African",
  "Liberia": "African",
  "Libya": "African",
  "Liechtenstein": "German",
  "Lithuania": "Russian",
  "Luxembourg": "French",

  "Madagascar": "African",
  "Malawi": "African",
  "Malaysia": "Malaysian",
  "Maldives": "Indian",
  "Mali": "African",
  "Malta": "Italian",
  "Marshall Islands": "Australian",
  "Mauritania": "African",
  "Mauritius": "African",
  "Mexico": "Mexican",
  "Micronesia": "Australian",
  "Moldova": "Russian",
  "Monaco": "French",
  "Mongolia": "Russian",
  "Montenegro": "Croatian",
  "Morocco": "Moroccan",
  "Mozambique": "African",
  "Myanmar": "Thai",

  "Namibia": "African",
  "Nauru": "Australian",
  "Nepal": "Indian",
  "Netherlands": "Dutch",
  "New Zealand": "British",
  "Nicaragua": "Latin American",
  "Niger": "African",
  "Nigeria": "African",
  "North Macedonia": "Croatian",
  "Norway": "British",

  "Oman": "Middle Eastern",

  "Pakistan": "Indian",
  "Palau": "Australian",
  "Panama": "Latin American",
  "Papua New Guinea": "Australian",
  "Paraguay": "Latin American",
  "Peru": "Latin American",
  "Philippines": "Filipino",
  "Poland": "Polish",
  "Portugal": "Portuguese",

  "Qatar": "Middle Eastern",

  "Romania": "Croatian",
  "Russia": "Russian",
  "Rwanda": "African",

  "Saint Kitts and Nevis": "Caribbean",
  "Saint Lucia": "Caribbean",
  "Saint Vincent and the Grenadines": "Caribbean",
  "Samoa": "Australian",
  "San Marino": "Italian",
  "Sao Tome and Principe": "African",
  "Saudi Arabia": "Middle Eastern",
  "Senegal": "African",
  "Serbia": "Croatian",
  "Seychelles": "African",
  "Sierra Leone": "African",
  "Singapore": "Chinese",
  "Slovakia": "Croatian",
  "Slovenia": "Croatian",
  "Solomon Islands": "Australian",
  "Somalia": "African",
  "South Africa": "African",
  "South Sudan": "African",
  "Spain": "Spanish",
  "Sri Lanka": "Indian",
  "Sudan": "African",
  "Suriname": "Caribbean",
  "Sweden": "British",
  "Switzerland": "German",
  "Syria": "Middle Eastern",

  "Taiwan": "Chinese",
  "Tajikistan": "Russian",
  "Tanzania": "African",
  "Thailand": "Thai",
  "Timor-Leste": "Malaysian",
  "Togo": "African",
  "Tonga": "Australian",
  "Trinidad and Tobago": "Caribbean",
  "Tunisia": "Tunisian",
  "Turkey": "Turkish",
  "Turkmenistan": "Russian",
  "Tuvalu": "Australian",

  "Uganda": "African",
  "Ukraine": "Russian",
  "United Arab Emirates": "Middle Eastern",
  "United Kingdom": "British",
  "United States": "American",
  "Uruguay": "Latin American",
  "Uzbekistan": "Russian",

  "Vanuatu": "Australian",
  "Vatican City": "Italian",
  "Venezuela": "Latin American",
  "Vietnam": "Vietnamese",

  "Yemen": "Middle Eastern",

  "Zambia": "African",
  "Zimbabwe": "African"
};

// Fetch recipes by cuisine (MealDB "area")
export async function fetchRecipesByCuisine(area) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`
  );
  const data = await res.json();
  return data.meals || [];
}

// Fetch recipes by category — a non-empty fallback pool when a country's
// cuisine/area returns no results.
export async function fetchRecipesByCategory(category) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`
  );
  const data = await res.json();
  return data.meals || [];
}

// Fetch full recipe details
export async function fetchRecipeDetails(id) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
  );
  const data = await res.json();
  return data.meals[0];
}