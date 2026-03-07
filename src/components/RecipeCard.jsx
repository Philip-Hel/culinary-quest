import CQCard from "./CQCard";

export default function RecipeCard({ recipe }) {
  if (!recipe) return null;

  return (
    <CQCard>
      <img
        src={recipe.strMealThumb}
        alt={recipe.strMeal}
        className="
          rounded-xl shadow mb-6 
          transition-transform duration-500 
          hover:scale-[1.02]
        "
      />
      <h3 className="text-3xl font-serif mb-4">{recipe.strMeal}</h3>
      <p className="text-base leading-relaxed whitespace-pre-line">
        {recipe.strInstructions}
      </p>
    </CQCard>
  );
}