import { useEffect, useState } from "react";
import PageLayout from "./components/PageLayout";
import CQButton from "./components/CQButton";
import CountryCard from "./components/CountryCard";
import RecipeCard from "./components/RecipeCard";

import {
  fetchRealCountries,
  cuisineMap,
  fetchRecipesByCuisine,
  fetchRecipeDetails
} from "./api";

import normalizeCountryName from "./normalizeCountryName";

export default function App() {
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    fetchRealCountries().then(setCountries);
  }, []);

  const pickRandomCountry = async () => {
    const random = countries[Math.floor(Math.random() * countries.length)];
    setCountry(random);

    const normalized = normalizeCountryName(random.name);
    const cuisine =
      cuisineMap[normalized] ||
      cuisineMap[random.region] ||
      "American";

    const recipesFromAPI = await fetchRecipesByCuisine(cuisine);
    setRecipes(recipesFromAPI || []);
    setRecipe(null);
  };

  const pickRandomRecipe = async () => {
    const random = recipes[Math.floor(Math.random() * recipes.length)];
    const details = await fetchRecipeDetails(random.idMeal);
    setRecipe(details);
  };

  return (
    <PageLayout>
      
      <div className="flex flex-col items-center gap-6">
        <CQButton onClick={pickRandomCountry}>
          Pick Random Country
        </CQButton>

        <CountryCard country={country} />

        {country && recipes.length > 0 && (
          <CQButton onClick={pickRandomRecipe}>
            Pick Random Recipe
          </CQButton>
        )}

        <RecipeCard recipe={recipe} />
      </div>
    </PageLayout>
  );
}
