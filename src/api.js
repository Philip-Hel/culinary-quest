// Fetch all real countries (stable v3.1 endpoint)
export async function fetchRealCountries() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,flags,region,subregion"
    );

    if (!res.ok) {
      console.error("REST Countries error:", res.status, res.statusText);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("REST Countries returned non-array:", data);
      return [];
    }

    return data.map(c => ({
      name: c.name.common,
      flag: c.flags?.png,
      region: c.region,
      subregion: c.subregion
    }));
  } catch (err) {
    console.error("FETCH FAILED:", err);
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
  "Argentina": "American",
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
  "Bolivia": "American",
  "Bosnia and Herzegovina": "Croatian",
  "Botswana": "African",
  "Brazil": "American",
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
  "Chile": "American",
  "China": "Chinese",
  "Colombia": "American",
  "Comoros": "African",
  "Congo": "African",
  "Costa Rica": "American",
  "Croatia": "Croatian",
  "Cuba": "Caribbean",
  "Cyprus": "Greek",
  "Czech Republic": "Croatian",

  "Denmark": "British",
  "Djibouti": "African",
  "Dominica": "Caribbean",
  "Dominican Republic": "Caribbean",

  "Ecuador": "American",
  "Egypt": "Egyptian",
  "El Salvador": "American",
  "Equatorial Guinea": "African",
  "Eritrea": "African",
  "Estonia": "Russian",
  "Eswatini": "African",
  "Ethiopia": "African",

  "Fiji": "Asian",
  "Finland": "British",
  "France": "French",

  "Gabon": "African",
  "Gambia": "African",
  "Georgia": "Middle Eastern",
  "Germany": "German",
  "Ghana": "African",
  "Greece": "Greek",
  "Grenada": "Caribbean",
  "Guatemala": "American",
  "Guinea": "African",
  "Guinea-Bissau": "African",
  "Guyana": "Caribbean",

  "Haiti": "Caribbean",
  "Honduras": "American",
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
  "Kiribati": "Asian",
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
  "Marshall Islands": "Asian",
  "Mauritania": "African",
  "Mauritius": "African",
  "Mexico": "Mexican",
  "Micronesia": "Asian",
  "Moldova": "Russian",
  "Monaco": "French",
  "Mongolia": "Russian",
  "Montenegro": "Croatian",
  "Morocco": "Moroccan",
  "Mozambique": "African",
  "Myanmar": "Thai",

  "Namibia": "African",
  "Nauru": "Asian",
  "Nepal": "Indian",
  "Netherlands": "Dutch",
  "New Zealand": "British",
  "Nicaragua": "American",
  "Niger": "African",
  "Nigeria": "African",
  "North Macedonia": "Croatian",
  "Norway": "British",

  "Oman": "Middle Eastern",

  "Pakistan": "Indian",
  "Palau": "Asian",
  "Panama": "American",
  "Papua New Guinea": "Asian",
  "Paraguay": "American",
  "Peru": "American",
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
  "Samoa": "Asian",
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
  "Solomon Islands": "Asian",
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
  "Timor-Leste": "Asian",
  "Togo": "African",
  "Tonga": "Asian",
  "Trinidad and Tobago": "Caribbean",
  "Tunisia": "Tunisian",
  "Turkey": "Turkish",
  "Turkmenistan": "Russian",
  "Tuvalu": "Asian",

  "Uganda": "African",
  "Ukraine": "Russian",
  "United Arab Emirates": "Middle Eastern",
  "United Kingdom": "British",
  "United States": "American",
  "Uruguay": "American",
  "Uzbekistan": "Russian",

  "Vanuatu": "Asian",
  "Vatican City": "Italian",
  "Venezuela": "American",
  "Vietnam": "Vietnamese",

  "Yemen": "Middle Eastern",

  "Zambia": "African",
  "Zimbabwe": "African"
};

// Fetch recipes by cuisine
export async function fetchRecipesByCuisine(area) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`
  );
  const data = await res.json();
  return data.meals;
}

// Fetch full recipe details
export async function fetchRecipeDetails(id) {
  const res = await fetch(
    `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`
  );
  const data = await res.json();
  return data.meals[0];
}